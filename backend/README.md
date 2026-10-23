# CARISCA API (backend)

Express 5 + TypeScript REST API for the CARISCA website, using MySQL through Sequelize 6. It is deployed separately from the Next.js frontend.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with reload (`tsx watch`) on `PORT` (5000) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run `dist/server.js` (production) |
| `npm run typecheck` / `npm run lint` | Static checks |
| `npm test` | Vitest + Supertest against the `carisca_test` database (rebuilt from migrations on each run). Set `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, `TEST_DB_PASSWORD` to use a local test server when `.env` points at a remote database. |
| `npm run docs:openapi` | Write the OpenAPI 3.1 spec to `../docs/openapi.json` |
| `npm run db:migrate` / `db:migrate:undo` / `db:migrate:status` | Apply, revert or list migrations (development, via tsx) |
| `npm run db:seed` | Roles, permissions, settings, menus, topics + verified content (idempotent; `-- --system` for configuration only) |
| `npm run admin:create` | Create or reset a Super Administrator (interactive, or `ADMIN_EMAIL`/`ADMIN_NAME`/`ADMIN_PASSWORD`) |
| `npm run import:wordpress` | Import posts, events, pages and media from the legacy WordPress site (`--with-media`, `--source <dir>`, `--base <url>`) |
| `npm run prod:migrate` / `prod:seed` / `prod:admin:create` | The same tasks using compiled `dist/` (for servers without dev dependencies) |

## Configuration

Copy `.env.example` to `.env`. Configuration is validated at startup (`src/config/env.ts`); the server refuses to start with an explicit list of invalid variables. Key settings:

- `DB_*`: MySQL connection.
- `SESSION_SECRET`: 32+ random characters (also used as the key for hashing IP addresses).
- `FRONTEND_URL`: exact browser origin(s) allowed by CORS and the CSRF origin check.
- `API_PUBLIC_URL`: the API's own address (media URLs with the local storage driver).
- `STORAGE_DRIVER`: `local` (default) or `r2`. With `r2`, also set the `R2_*` values and `MEDIA_PUBLIC_URL`; see [docs/media-storage.md](../docs/media-storage.md).
- `STORAGE_DIR`: persistent uploads directory (`public/uploads`, `private/uploads`) for the local driver, and the importer's download cache.
- `REVALIDATE_URL` and `REVALIDATE_SECRET`: frontend cache purge after edits.
- `SMTP_*` and `MAIL_FROM`: optional email; without it, password-reset email and double opt-in are disabled honestly.

## Structure

```
src/
  app.ts, server.ts          Express app (helmet, CORS, sessions, CSRF, static uploads) and entry point
  config/                    env, database, permissions catalogue, umzug
  models/                    Sequelize models (identity, content, system) + associations
  migrations/                Schema migrations, registered in migrations/index.ts
  controllers/               Generic resource controller: list/get/create/update/delete/restore/reorder,
                             publishing workflow, ownership rules, audit log, cache revalidation
  routes/                    auth.routes.ts, public/{content,forms,search}.ts, admin/*.ts
  services/                  auth (sessions, lockout, reset), media (validation, storage, usages),
                             audit, mail, menu, revalidate
  validators/                Zod schemas
  seeders/                   system.ts, content.ts, data/curated.ts + data/pages.ts (verified content)
  scripts/                   migrate, seed, create-admin, import-wordpress
tests/                       auth, authorization, content workflow, forms, media
```

## Adding a content type

1. Add a migration (`src/migrations/<timestamp>-<name>.ts`) and register it in `src/migrations/index.ts`.
2. Add the model in `src/models/content.ts` and associations in `src/models/index.ts`.
3. Add a Zod schema in `src/validators/content.ts`.
4. Register the resource in `src/routes/admin/resources.ts` (permission, search fields, includes, cache tags).
5. Add the permission module to `src/config/permissions.ts`, then run `npm run db:seed` to sync permissions.
6. Add public routes in `src/routes/public/content.ts` (always filter with `livePublished()` and serialise with `toPublic()`).

## API

- **Interactive (Swagger UI):** http://localhost:5000/api/docs (spec: `/api/openapi.json`). Enabled by default outside production; set `API_DOCS_ENABLED=true` to publish in production.
- **Spec file:** [`../docs/openapi.json`](../docs/openapi.json), regenerated with `npm run docs:openapi`. Request schemas come from the Zod validators and admin paths from `routes/admin/resources.ts`, so they stay in step with the code (`tests/openapi.test.ts` validates the document).
- **Narrative guide:** [`../docs/api-documentation.md`](../docs/api-documentation.md). Health check: `GET /api/v1/health`.
