# Architecture

## Overview

```
                 Browser
     ┌──────────────┴──────────────────┐
     │ HTML pages                      │ JSON (admin, forms), media files
     ▼                                 ▼
┌──────────────────────────┐   ┌───────────────────────────────┐
│ frontend/  (Next.js 16)  │──▶│ backend/  (Express 5 API)      │──▶ MySQL 8 (Sequelize 6)
│ carisca.knust.edu.gh     │   │ api.carisca.knust.edu.gh       │
│ public site + /admin UI  │◀──│ /api/v1/*, /uploads/*          │──▶ storage/ (uploads on disk)
└──────────────────────────┘   └───────────────────────────────┘
        ▲   POST /api/revalidate (shared secret) — purge cached pages after edits
        └────────────────────────────────────────────────────────
```

Two independent Node.js applications, each with its own `package.json`, build and start command. They share no code at build time; the contract between them is the REST API (`docs/api-documentation.md`).

| Concern | Decision | Why |
|---|---|---|
| Frontend rendering | Next.js App Router, Server Components. Public routes render on request (`connection()`), and API responses are cached in the Next data cache with tags and a `CONTENT_REVALIDATE_SECONDS` fallback. | `next build` never needs the API to be reachable; published edits show immediately through tag purges; repeat views are served from cache. |
| Cache purge | The API calls `POST {frontend}/api/revalidate` with tags (for example `articles`, `articles:<slug>`, `home`) after every create, update or delete. The frontend calls `revalidateTag(tag, { expire: 0 })`. | Changes show without a rebuild. If the call fails, pages still refresh after the fallback interval. |
| Admin UI | Client components under `/admin`. They call the API directly from the browser with `credentials: 'include'`. | The session cookie lives on the API host; the Next server never needs to forward credentials. |
| Authentication | Server-side sessions in MySQL (`sessions` table). An HTTP-only `SameSite=Lax`, `Secure` (production) cookie holds a random token; only its SHA-256 is stored. Idle timeout is 2 h; absolute timeout is 12 h. | Sessions can be revoked (logout, password change, role change, disabling a user). No tokens are kept in `localStorage`. |
| CSRF | (1) State-changing requests from browsers must come from an allow-listed `Origin`. (2) Authenticated state changes must send the per-session `X-CSRF-Token`. (3) The cookie is SameSite=Lax. | Defence in depth for cookie authentication across subdomains. |
| Authorisation | Permission keys (`articles.publish`, `users.update`, …) are checked on every admin route. Five roles: super_admin, admin, editor, author, reviewer. | The backend is the only enforcement point; the UI only hides controls. |
| Content workflow | `draft → review → published → archived`. A future `published_at` means scheduled. Authors can draft and submit for review but cannot publish, archive or edit published content. | Matches editorial practice. Public queries always filter `status='published' AND published_at <= NOW()`. |
| Rich text | TipTap editor → `sanitize-html` allow-list on the server before storage → rendered with `dangerouslySetInnerHTML`. | Stored HTML is always safe, whatever client sent it. |
| Media | Files under `uploads/YYYY/MM/<slug>-<random>.<ext>`, on disk in `STORAGE_DIR` or in Cloudflare R2 (`STORAGE_DRIVER`, see `docs/media-storage.md`), metadata in `media_assets`. Uploads pass an extension allow-list, a magic-byte check and SVG script rejection. They are served with `nosniff`, a sandbox CSP and `Content-Disposition: attachment` for non-viewable types. | Uploads survive redeploys, can't execute, and can be replaced in place. Every reference updates when a file is replaced. |
| Placeholders | `src/lib/image-slots.json` defines each image slot's size, ratio and fit. `<CmsImage>` renders a labelled SVG placeholder when a record has no image. | Missing images never break layout and are obviously not real photos. Assigning an image needs no code change. |
| Search | MySQL InnoDB FULLTEXT (boolean mode, prefix match) over articles, publications, events, pages, research projects and CPD programmes, with a LIKE fallback for very short terms. Only published content is searched. | No extra infrastructure (no Elasticsearch or Redis) on shared hosting. |
| Legacy URLs | `redirects` table plus the `/[...slug]` catch-all: an unknown path is looked up and answered with a 301. | Old WordPress links keep working. Redirects are editable in Admin › URL redirects. |
| Background work | None required. Expired sessions are purged hourly by an in-process timer. | cPanel often cannot run workers or cron reliably. |

## Repository layout

```
backend/
  src/config/        env (Zod-validated), database, permissions, umzug
  src/models/        Sequelize models + associations (index.ts)
  src/migrations/    ordered schema migrations (registered in migrations/index.ts)
  src/seeders/       roles/permissions/settings/menus + verified initial content (data/*.ts)
  src/controllers/   generic resource controller (CRUD, workflow, audit, revalidate)
  src/routes/        auth, public/*, admin/*
  src/services/      auth, media, audit, mail, menu, revalidate
  src/validators/    Zod schemas
  src/scripts/       migrate, seed, create-admin, import-wordpress
  tests/             Vitest + Supertest against a real MySQL test database
frontend/
  src/app/(public)/  public routes (+ [...slug] CMS pages and redirects)
  src/app/admin/     dashboard (client components)
  src/app/login/     sign-in and password reset
  src/app/api/       revalidate webhook;  src/app/api-health/ health check
  src/components/    layout, cards, forms, ui, charts
  src/features/admin resource configs, generic list/form, media picker, rich text
  src/services/      public.ts (server, cached), client.ts (public forms), admin.ts (dashboard)
  tests/             Vitest + Testing Library;  e2e/  Playwright workflows
docs/                audit, architecture, schema, API, migration, deployment
```

## Request lifecycle (public page)

1. A browser requests `/news/some-story`. The Next server renders `app/(public)/news/[slug]/page.tsx`.
2. `getArticle(slug)` calls `GET {API}/articles/some-story`, which is cached under the tags `articles` and `articles:some-story`.
3. The API's public route returns only live published rows, passed through `toPublic()`. That strips internal fields (`created_by`, `review_note`, storage paths) and drops private media.
4. When an editor updates the story, the API purges those tags, and the next request renders fresh content.

## Security summary

Helmet headers (strict CSP on the API) · CORS allow-list with credentials (no wildcards) · rate limits on login (10 per 15 min per IP+email), password reset and public forms · bcrypt (cost 12) · account lockout after 8 failures · password policy (12+ characters, mixed case, a digit) · parameterised queries via Sequelize · Zod validation on every input · request size limits (JSON 2 MB, uploads 5/25 MB) · server-side HTML sanitisation · audit log of administrative actions (no secrets recorded) · IP addresses stored only as keyed hashes · honeypot and timing checks on public forms · no public registration endpoint (the first admin is created by CLI) · no stack traces in production responses.
