# Deploying to cPanel

This guide deploys the two applications separately:

| App | Suggested URL (confirm before configuring) | cPanel Node.js app root | Startup file |
|---|---|---|---|
| API (Express) | `https://api.carisca.knust.edu.gh` | `~/carisca/backend` | `dist/server.js` |
| Website + admin (Next.js) | `https://carisca.knust.edu.gh` | `~/carisca/frontend` (standalone bundle) | `server.js` |

The two hosts must share a registrable domain (here `knust.edu.gh`). The admin session cookie uses `SameSite=Lax`, so the browser only sends it to the API from a **same-site** page. If the API has to live on an unrelated domain, see Troubleshooting → "Cookie not sent".

---

## 1. Hosting prerequisites (confirm with the provider)

| Requirement | Why |
|---|---|
| cPanel **Setup Node.js App** (CloudLinux Node.js Selector / Phusion Passenger) able to run **two** apps | One per application |
| **Node.js 20.9 or newer** (22 LTS recommended, which is what this project was built and tested with) | Next.js 16 requires ≥ 20.9 |
| **SSH or cPanel Terminal** access | To install packages, build, run migrations and create the first admin |
| **MySQL 8.0+** (or MariaDB 10.6+) with InnoDB and FULLTEXT indexes | Database and search |
| Two (sub)domains with **AutoSSL / Let's Encrypt** | HTTPS is required for secure cookies |
| A **writable directory outside `public_html`** that survives deployments | Uploaded media |
| About **2–4 GB RAM** available to `next build`, *or* a Linux machine/CI to build on | Next.js builds are memory-hungry. Many shared plans kill the process. |
| Outbound HTTPS from the server (optional) | Running the WordPress importer on the server, and SMTP if email is used |

Not required: root access, Docker, Redis, queues, cron workers.

## 2. Server layout

```
/home/<user>/
├── carisca/
│   ├── backend/            ← API app root (source + dist/)
│   ├── frontend-src/       ← (if building on the server) Next.js source
│   └── frontend/           ← website app root = contents of .next/standalone
├── carisca-storage/        ← STORAGE_DIR: public/uploads, private/uploads (persistent)
└── carisca-backups/
```

Never put `carisca-storage` inside an app root or `public_html`. Redeploying an app must not touch it.

## 3. MySQL

1. **cPanel › MySQL® Databases** → *Create New Database*, e.g. `<user>_carisca`.
2. *Add New User*, e.g. `<user>_carisca_app`, with a long generated password.
3. *Add User To Database* → grant **ALL PRIVILEGES** on that database only. Migrations need CREATE, ALTER, INDEX, DROP and REFERENCES.
4. Note the **host** shown by your provider (often `localhost`, but use exactly what cPanel shows, e.g. a remote MySQL host) and the port (3306 unless stated).
5. Make sure the database uses `utf8mb4` (the default on MySQL 8). Tables are created with `utf8mb4_unicode_ci`.

## 4. Deploy the API

### 4.1 Upload the code

Use either option:

- `git clone <repository> ~/carisca` (in the Terminal), or
- upload a zip of the `backend/` folder (without `node_modules`, `dist`, `.env`) to `~/carisca/backend` and extract it.

### 4.2 Create the Node.js application

**cPanel › Setup Node.js App › Create Application**

| Field | Value |
|---|---|
| Node.js version | 22.x (or the newest ≥ 20.9 offered) |
| Application mode | Production |
| Application root | `carisca/backend` |
| Application URL | `api.carisca.knust.edu.gh` |
| Application startup file | `dist/server.js` |

Add the **environment variables** (or create `~/carisca/backend/.env` with `chmod 600`). See `backend/.env.example` for every option:

| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `API_PUBLIC_URL` | `https://api.carisca.knust.edu.gh` |
| `FRONTEND_URL` | `https://carisca.knust.edu.gh` (comma-separate extra origins, e.g. `https://www.carisca.knust.edu.gh`; never `*`) |
| `TRUST_PROXY` | `1` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | From §3 |
| `SESSION_SECRET` | 64+ random characters: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `STORAGE_DIR` | `/home/<user>/carisca-storage` |
| `STORAGE_DRIVER` | `local`, or `r2` to keep uploads in Cloudflare R2 instead (then also the `R2_*` values and `MEDIA_PUBLIC_URL`; see `docs/media-storage.md`) |
| `REVALIDATE_URL` | `https://carisca.knust.edu.gh/api/revalidate` |
| `REVALIDATE_SECRET` | Another random secret (also set on the frontend) |
| `SMTP_*`, `MAIL_FROM`, `CONTACT_NOTIFY_EMAIL` | Optional: the KNUST/CARISCA mail server, if available |
| `LOG_LEVEL` | `info` |
| `API_DOCS_ENABLED` | Leave empty (off) unless you want Swagger UI public at `/api/docs` |

`PORT` is supplied by Passenger; don't set it.

### 4.3 Install, build, migrate

Click **Run NPM Install** in the app page, or use the Terminal. The cPanel page shows the exact `source …/activate` command for your app:

```bash
source /home/<user>/nodevenv/carisca/backend/22/bin/activate
cd ~/carisca/backend
npm ci                      # includes TypeScript for the build
npm run build               # → dist/
npm run prod:migrate        # create/upgrade tables (safe to re-run)
npm run prod:seed           # roles, permissions, settings, menus, verified content (never overwrites edits)
npm run prod:admin:create   # interactive: first Super Administrator
npm prune --omit=dev        # optional: drop build-only packages
```

Creating the first administrator without prompts (the password is not saved in shell history if you prefix the line with a space and `HISTCONTROL=ignorespace` is set):

```bash
 ADMIN_EMAIL=you@knust.edu.gh ADMIN_NAME="Your Name" ADMIN_PASSWORD='…' npm run prod:admin:create
```

There is **no** public sign-up and **no** default password. Further users are created in **Admin › Users & roles**.

### 4.4 Migrate legacy content (optional, once)

```bash
UPLOAD_MAX_DOCUMENT_MB=100 UPLOAD_MAX_IMAGE_MB=20 node dist/scripts/import-wordpress.js --with-media
```

This needs outbound HTTPS to `carisca.knust.edu.gh`. If the server can't reach it, run the import on a workstation against a copy of the database, then copy both the database and `carisca-storage/public/uploads` across. See `docs/content-migration.md`.

### 4.5 Start and verify

Click **Restart** (or run `touch ~/carisca/backend/tmp/restart.txt`), then check:

```bash
curl -s https://api.carisca.knust.edu.gh/api/v1/health
# {"status":"ok","database":"ok",...}
```

## 5. Deploy the website (Next.js)

`NEXT_PUBLIC_*` values are **embedded at build time**. Build with the production values, and rebuild if the API URL changes.

Build-time variables:

```bash
export NEXT_PUBLIC_API_BASE_URL=https://api.carisca.knust.edu.gh/api/v1
export NEXT_PUBLIC_SITE_URL=https://carisca.knust.edu.gh
```

### Option A — build on the server (if memory allows)

```bash
# Create a temporary Node app for carisca/frontend-src (or use any activated Node 22 env), then:
cd ~/carisca/frontend-src            # git checkout of the frontend/ folder
npm ci
NEXT_PUBLIC_API_BASE_URL=… NEXT_PUBLIC_SITE_URL=… npm run build
rm -rf ~/carisca/frontend && cp -r .next/standalone ~/carisca/frontend
```

`npm run build` copies `public/` and `.next/static/` into `.next/standalone/` automatically (the `postbuild` script).

### Option B — build elsewhere and upload (recommended on small plans)

Build on **Linux x64** with the same Node major version, e.g. a GitHub Actions `ubuntu-latest` runner or WSL. Image optimisation uses the native `sharp` binary, so a bundle built on Windows or macOS will not run on the server. Then:

```bash
npm ci && NEXT_PUBLIC_API_BASE_URL=… NEXT_PUBLIC_SITE_URL=… npm run build
tar -czf frontend-standalone.tgz -C .next/standalone .
# upload and extract into ~/carisca/frontend
```

### 5.1 Create the Node.js application

| Field | Value |
|---|---|
| Node.js version | Same major used for the build |
| Application mode | Production |
| Application root | `carisca/frontend` |
| Application URL | `carisca.knust.edu.gh` |
| Application startup file | `server.js` |

Runtime environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_BASE_URL` | Same as the build value |
| `NEXT_PUBLIC_SITE_URL` | Same as the build value |
| `API_INTERNAL_BASE_URL` | Optional; normally the same as the public API URL |
| `REVALIDATE_SECRET` | Same as the API's `REVALIDATE_SECRET` |
| `CONTENT_REVALIDATE_SECONDS` | `300` (fallback refresh interval) |
| `NEXT_IMAGE_UNOPTIMIZED` | `false`. Set `true` (and rebuild) only if `sharp` cannot run on the host. |

The standalone bundle includes its own minimal `node_modules`, so **do not run `npm install`** in `~/carisca/frontend`. Restart the app, then check:

```bash
curl -s https://carisca.knust.edu.gh/api-health      # {"frontend":"ok","api":"ok",...}
curl -sI https://carisca.knust.edu.gh/sitemap.xml
```

Cache behaviour: pages render per request using cached API data. The cache is purged when content changes (API → `/api/revalidate`) and otherwise refreshed every `CONTENT_REVALIDATE_SECONDS`. The cache lives in `~/carisca/frontend/.next/cache` (must be writable) and is cleared by a redeploy, which is harmless.

## 6. Domains and SSL

1. **cPanel › Domains**: make sure `carisca.knust.edu.gh` (or the provided domain) points at this account, and create the `api` subdomain. The Node.js app pages attach them.
2. **cPanel › SSL/TLS Status** → *Run AutoSSL* for both hostnames. Confirm both load over HTTPS without warnings.
3. Optionally redirect `www.` to the apex in **Domains › Redirects**, and add it to `FRONTEND_URL` if it will ever load the admin.

## 7. CORS, cookies and CSRF (what must line up)

| Setting | Must equal |
|---|---|
| API `FRONTEND_URL` | Exact website origin(s), e.g. `https://carisca.knust.edu.gh` |
| Frontend `NEXT_PUBLIC_API_BASE_URL` | `https://api.carisca.knust.edu.gh/api/v1` |
| API `API_PUBLIC_URL` | `https://api.carisca.knust.edu.gh` (used in media URLs and the Next image allow-list via the build) |
| Both `REVALIDATE_SECRET` | Identical |

The session cookie is `HttpOnly; Secure; SameSite=Lax; Path=/` on the API host. Leave `COOKIE_DOMAIN` empty unless you know you need a shared parent-domain cookie. State-changing requests are checked for an allowed `Origin` and a per-session `X-CSRF-Token`.

## 8. Media storage and permissions

```bash
mkdir -p ~/carisca-storage/public/uploads ~/carisca-storage/private/uploads
chmod 750 ~/carisca-storage ~/carisca-storage/*
```

- Public files are served by the API at `/uploads/...`, with `nosniff`, a sandbox CSP and 30-day caching. Private files are never served publicly.
- Uploads are limited to images (JPG, PNG, WebP, GIF, script-free SVG) and documents (PDF, Office, CSV, TXT). Files are checked by content, not only by extension.
- Limits: `UPLOAD_MAX_IMAGE_MB` (5) and `UPLOAD_MAX_DOCUMENT_MB` (25). Apache/LiteSpeed in front of Passenger may also cap request bodies. Raise the host limit if large PDFs fail with 413.

## 9. Restarting

- cPanel › Setup Node.js App › **Restart**, or
- `touch ~/carisca/backend/tmp/restart.txt` / `touch ~/carisca/frontend/tmp/restart.txt` (Passenger).

Restart the API after changing its environment or deploying a new `dist/`. Restart the website after uploading a new bundle.

## 10. Updating

**API**

```bash
cd ~/carisca && git pull           # or upload new files
source /home/<user>/nodevenv/carisca/backend/22/bin/activate && cd backend
npm ci && npm run build && npm run prod:migrate && npm run prod:seed
touch tmp/restart.txt
```

`prod:seed` adds new permissions and settings without touching edited content.

**Website**: build a new standalone bundle (§5), replace `~/carisca/frontend` with it, and restart.

Take a database and storage backup (§12) before every update that includes migrations.

## 11. Initial administrator and users

- The first Super Administrator comes from `npm run prod:admin:create` (§4.3). Running it again with an existing email resets that user's password and ensures they have the role.
- Without SMTP, "Forgot password" deliberately reports that email is unavailable. A Super Administrator can set a new password in **Admin › Users & roles**.
- Give staff the least privilege they need: Editors publish, Authors draft and submit for review, Reviewers have read-only access.

## 12. Backups and restoration

**Database (daily)**: cPanel › Cron Jobs:

```bash
0 2 * * * mysqldump --single-transaction --routines -h <DB_HOST> -u <DB_USER> -p'<DB_PASSWORD>' <DB_NAME> | gzip > /home/<user>/carisca-backups/db-$(date +\%F).sql.gz && find /home/<user>/carisca-backups -name 'db-*.sql.gz' -mtime +30 -delete
```

(Prefer a `~/.my.cnf` with `chmod 600` over a password on the command line.)

**Media (daily)**:

```bash
30 2 * * * tar -czf /home/<user>/carisca-backups/uploads-$(date +\%F).tgz -C /home/<user> carisca-storage && find /home/<user>/carisca-backups -name 'uploads-*.tgz' -mtime +30 -delete
```

Also download copies off the server regularly (cPanel › Backup, or `rsync`), because a backup kept on the same server isn't a backup.

**Restore**

```bash
gunzip -c db-YYYY-MM-DD.sql.gz | mysql -h <DB_HOST> -u <DB_USER> -p <DB_NAME>
tar -xzf uploads-YYYY-MM-DD.tgz -C /home/<user>
touch ~/carisca/backend/tmp/restart.txt
```

Restore the database and media from the **same date**; media records point to files by path.

## 13. Security checklist

- [ ] HTTPS on both hosts; `NODE_ENV=production` on both apps
- [ ] `SESSION_SECRET` and `REVALIDATE_SECRET` are long, random and unique to production
- [ ] `.env` files are `chmod 600`, not in `public_html`, and not committed
- [ ] `FRONTEND_URL` lists exact origins only (no `*`)
- [ ] Database user has privileges on the CARISCA database only
- [ ] `STORAGE_DIR` is outside `public_html` and not world-readable
- [ ] The first admin uses a strong unique password; dev or test accounts don't exist in production
- [ ] Unused roles aren't assigned; departed staff are disabled or deleted
- [ ] Daily database and media backups run and are copied off-server
- [ ] Node.js version receives security updates (keep within an LTS line)
- [ ] `npm audit --omit=dev` is reviewed on each update. Known accepted advisories: `uuid` (inside Sequelize; the vulnerable buffer API is not used) and `sprintf-js` (inside Umzug's CLI parser, which is not used at runtime).
- [ ] Contact submissions, subscribers and registrations are personal data. Export only when needed and delete when no longer required (Ghana Data Protection Act, 2012).

## 14. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Passenger "Web application could not be started" / 503 | Check `~/carisca/<app>/stderr.log`. The API refuses to start on invalid configuration and lists the variables at fault. |
| `ER_ACCESS_DENIED` / `ECONNREFUSED` (DB) | Wrong `DB_HOST`, user not added to the database, or password typo. Test with `mysql -h … -u … -p`. |
| `/api/v1/health` shows `"database":"unavailable"` | Same as above; or the database server is down |
| Admin login works but the next page logs out | The cookie isn't being stored. Requires HTTPS (`Secure`). Check that the frontend and API are same-site, and that `FRONTEND_URL` matches the exact origin. |
| Browser console: CORS error | `FRONTEND_URL` doesn't include the page origin (scheme + host, no trailing slash) |
| `403 Invalid or missing CSRF token` | The session expired or changed in another tab. Sign out and in again. |
| "Cookie not sent" when the API is on another domain | `SameSite=Lax` cookies aren't sent cross-site. Host the API on a subdomain of the site's domain (recommended). |
| Images broken on the website, 400 from `/_next/image` | The bundle was built with a different `NEXT_PUBLIC_API_BASE_URL` (rebuild), or `sharp` can't load (set `NEXT_IMAGE_UNOPTIMIZED=true` and rebuild) |
| Edits take minutes to appear | The revalidation call is failing. Check that the API's `REVALIDATE_URL` is reachable from the server and the secrets match (the API logs "Frontend revalidation request failed"). Pages still refresh after `CONTENT_REVALIDATE_SECONDS`. |
| Upload fails with 413 | The file exceeds `UPLOAD_MAX_*` or the web server's body limit |
| `EACCES` when uploading | `STORAGE_DIR` isn't writable by the cPanel user |
| `next build` killed / out of memory | Use Option B (build in CI or another Linux machine) |
| `Error: Could not load the "sharp" module` | The bundle was built on another OS or architecture. Build on Linux x64. |
| Old WordPress URL returns 404 | Add a redirect in **Admin › URL redirects** |
| Search finds nothing for 1–2 letter words | MySQL FULLTEXT ignores very short tokens; longer terms work, and the API falls back to substring matching for very short queries |
