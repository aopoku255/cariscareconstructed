# Deploying to Render

The repository root contains a [Render Blueprint](../render.yaml) that creates two web services from the same GitHub repository:

| Service       | Folder      | What it runs                                   | Default URL                         |
| ------------- | ----------- | ---------------------------------------------- | ----------------------------------- |
| `carisca-api` | `backend/`  | Express API, migrations, uploaded media (disk) | `https://carisca-api.onrender.com`  |
| `carisca-web` | `frontend/` | Next.js website and `/admin` dashboard         | `https://carisca-web.onrender.com`  |

If a service name is already taken on Render, Render adds a suffix (for example `carisca-api-x1y2`). Use the URLs Render actually assigns wherever this guide shows a `*.onrender.com` address.

## Why the website proxies the API

Browsers treat every `*.onrender.com` subdomain as a separate site, because `onrender.com` is on the Public Suffix List. The admin session cookie is `SameSite=Lax`, so the browser would not send it from `carisca-web` to `carisca-api`, and nobody could stay signed in.

To avoid this, the website forwards `/api/v1/*` to the API through a Next.js rewrite. The rewrite is switched on by `API_PROXY_TARGET` in [frontend/next.config.ts](../frontend/next.config.ts). The browser only ever talks to `carisca-web`, so the cookie and the CSRF origin check both work.

Server-side rendering does not go through the proxy. It calls the API directly through `API_INTERNAL_BASE_URL`.

Because the proxy adds a hop, the API runs with `TRUST_PROXY=2`: one hop for Render's load balancer and one for the website proxy. This keeps rate limiting keyed on the real client IP.

When both services sit under one custom domain, the proxy is no longer needed. For example, `www.carisca.knust.edu.gh` for the website and `api.carisca.knust.edu.gh` for the API share one site. In that case:

- Leave `API_PROXY_TARGET` empty.
- Point `NEXT_PUBLIC_API_BASE_URL` straight at the API.
- Set `TRUST_PROXY=1`.

## Prerequisites

1. **The code on GitHub.** Render deploys from a connected repository.
2. **A MySQL 8 database reachable from the internet.** Render has no managed MySQL. You have two options:
   - **The cPanel database** (`bacaris_carisca_website`). In cPanel, go to **Remote MySQL** and add Render's outbound IP addresses. To find them, open the `carisca-api` service in the Render dashboard, then **Connect → Outbound**; the service must exist first. Without this step, migrations fail with `Access denied` or a timeout.
   - **A Render private service running MySQL** with its own disk. Render documents this as the "Deploy MySQL" template. Use the private service's internal hostname as `DB_HOST`.
3. **A paid instance type (Starter or above) for `carisca-api`.** Persistent disks and pre-deploy commands are not available on the free plan. With media in Cloudflare R2 (`STORAGE_DRIVER=r2`, see [media-storage.md](media-storage.md)) the API needs no disk, and you can remove the `disk` block from `render.yaml`. The Blueprint uses `starter` for both services. The website can be moved to the free plan, but free services sleep when idle and the first request after that is slow.

## First deployment

1. In the Render dashboard, choose **New → Blueprint** and select the GitHub repository. Render reads `render.yaml`.
2. Render asks for every variable marked `sync: false`. Fill them in as below, adjusting the hostnames if Render assigned different ones.

   **`carisca-api`**

   | Variable          | Value                                              |
   | ----------------- | -------------------------------------------------- |
   | `API_PUBLIC_URL`  | `https://carisca-api.onrender.com`                 |
   | `FRONTEND_URL`    | `https://carisca-web.onrender.com`                 |
   | `REVALIDATE_URL`  | `https://carisca-web.onrender.com/api/revalidate`  |
   | `DB_HOST`         | Database host                                      |
   | `DB_NAME`         | Database name                                      |
   | `DB_USER`         | Database user                                      |
   | `DB_PASSWORD`     | Database password                                  |
   | `SMTP_HOST`       | Mail server (optional; leave blank to skip email)  |
   | `MAIL_FROM`       | Sender address, e.g. `CARISCA <no-reply@…>`        |

   Further SMTP settings (`SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`) can be added afterwards under **Environment**. See [backend/.env.example](../backend/.env.example).

   **`carisca-web`**

   | Variable                   | Value                                       |
   | -------------------------- | ------------------------------------------- |
   | `NEXT_PUBLIC_API_BASE_URL` | `https://carisca-web.onrender.com/api/v1`   |
   | `NEXT_PUBLIC_SITE_URL`     | `https://carisca-web.onrender.com`          |
   | `API_PROXY_TARGET`         | `https://carisca-api.onrender.com`          |
   | `API_INTERNAL_BASE_URL`    | `https://carisca-api.onrender.com/api/v1`   |

   Render generates `SESSION_SECRET` and `REVALIDATE_SECRET`, and gives the website the same `REVALIDATE_SECRET` as the API.
3. Apply the Blueprint. Each API deploy then runs:
   1. `npm ci && npm run build`
   2. The pre-deploy step: `npm run prod:migrate && npm run prod:seed`. This creates or updates the tables and the roles, permissions, settings and menus.
   3. `npm start`, after which Render waits for `/api/v1/health` to return 200.
4. If the cPanel database rejects the connection, add the outbound IPs as described in [Prerequisites](#prerequisites) and choose **Manual Deploy → Deploy latest commit** on `carisca-api`.
5. If Render assigned URLs different from the ones you entered, correct the variables. Then redeploy **both** services.

   `NEXT_PUBLIC_*` and `API_PROXY_TARGET` are built into the website bundle, so a restart is not enough for them. Use **Manual Deploy → Clear build cache & deploy**.

## Create the first administrator

The site has no public sign-up. Open the **Shell** tab of `carisca-api` and run:

```bash
npm run prod:admin:create
```

The script asks for a name, an email address and a password. To run it non-interactively instead:

```bash
ADMIN_EMAIL=you@example.org ADMIN_NAME="Your Name" ADMIN_PASSWORD='…' npm run prod:admin:create
```

If the database already has an administrator, for example the cPanel database that was seeded from a local machine, you can skip this step.

## Import the existing website content

The database starts with no articles or media. To copy content from the current WordPress site, run this in the `carisca-api` shell:

```bash
node dist/scripts/import-wordpress.js --with-media
```

`--with-media` downloads images and documents into media storage: the persistent disk (`/var/data`), or the R2 bucket when `STORAGE_DRIVER=r2`. Without it, images stay linked to the old site. The import can safely be run again: records that already exist are left untouched. See [content-migration.md](content-migration.md) for what is imported and what still needs manual review.

## Check the deployment

| Check | Expected result |
| ----- | --------------- |
| `https://carisca-api.onrender.com/api/v1/health` | `{"status":"ok", …}` |
| `https://carisca-web.onrender.com/api/v1/health` | The same response, which shows the proxy works |
| `https://carisca-web.onrender.com/admin` → sign in | You stay signed in after refreshing the page |
| Publish an article in the dashboard | It appears on the public site within seconds (on-demand revalidation) |
| Upload an image, then redeploy the API | The image is still there (persistent disk or R2) |

The Swagger UI is off in production (`API_DOCS_ENABLED=false`). To browse it temporarily, set the variable to `true` on `carisca-api` and open `/api/docs`. Alternatively, generate the spec locally with `npm run docs:openapi`.

## Updating

Every push to `main` redeploys both services automatically, and the API's pre-deploy step applies any new migrations. To deploy by hand instead, turn off **Auto-Deploy** in each service's settings.

## Custom domain

1. Add the domain under **Settings → Custom Domains** on `carisca-web`. Optionally add an API subdomain on `carisca-api`.
2. Update `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `FRONTEND_URL` and `REVALIDATE_URL` to the new domain. If you added an API subdomain, also update `API_PUBLIC_URL` and see the note at the end of [Why the website proxies the API](#why-the-website-proxies-the-api).
3. Redeploy both services, clearing the build cache.
