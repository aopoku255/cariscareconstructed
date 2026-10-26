# Media storage (local disk or Cloudflare R2)

The API stores uploaded images and documents in one of two places, chosen with `STORAGE_DRIVER` in `backend/.env`:

| Driver | Files live in | Public links look like | Use when |
| ------ | ------------- | ---------------------- | -------- |
| `local` (default) | `STORAGE_DIR/public/uploads` and `STORAGE_DIR/private/uploads` on the API server | `https://<API_PUBLIC_URL>/uploads/2026/10/photo-ab12cd34.jpg` | Development, or a server with a persistent disk |
| `r2` | Cloudflare R2 buckets | `https://<MEDIA_PUBLIC_URL>/uploads/2026/10/photo-ab12cd34.jpg` | Production: files are independent of where the API runs (cPanel, Render…) and are served by Cloudflare's network |

The database only stores the relative path (`2026/10/photo-ab12cd34.jpg`). The driver decides where the bytes go and how the public link is built.

## Setting up R2

1. **Create the bucket.** In the Cloudflare dashboard, go to **R2 Object Storage → Overview** and select **Create bucket**. Give it a name (e.g. `carisca-media`) and pick a location hint (*Automatic* or a region close to your users).

2. **Make the bucket publicly accessible.** You need a public URL for browsers to load images. Pick **one** of these options:

   **Option A — R2 public development URL (quickest).** In the Cloudflare dashboard, go to **R2 → your bucket → Settings → Public access** and enable the R2.dev subdomain. Cloudflare gives you a URL like `https://pub-900dc15efa6e4f0c84879fe16336a7b1.r2.dev`. That URL is your `MEDIA_PUBLIC_URL`. No Worker deploy needed.

   **Option B — Cloudflare Worker.** Deploy the included Worker for more control (custom headers, future access rules). From the repo root:

   ```bash
   cd r2-worker
   npx wrangler deploy
   ```

   Edit `wrangler.toml` first if your bucket name is different from `carisca-media`. After deploying, Wrangler prints the Worker URL (e.g. `https://carisca-media.<your-subdomain>.workers.dev`). That URL is your `MEDIA_PUBLIC_URL`.

   **Option C — Custom domain.** Add a custom route to the Worker or configure a Cloudflare DNS record for the R2 bucket (e.g. `media.carisca.knust.edu.gh`).

3. **Create an API token.** Go back to the **R2 Object Storage** overview page and select **Manage R2 API Tokens**. Choose **Create API token** under either *User API Tokens* or *Account API Tokens* (a user token is tied to your login; an account token can be shared with a team). Set the permission to **Object Read & Write** and limit it to the bucket you just created. After you confirm, copy the **Access Key ID** and **Secret Access Key** immediately — Cloudflare will not show the secret again. Your **Account ID** is on the R2 overview page or the token confirmation screen.

4. **Configure the API.** Wherever the API runs (cPanel `.env`, Render dashboard, etc.), set:

   ```
   STORAGE_DRIVER=r2
   R2_ACCOUNT_ID=<account id>
   R2_ACCESS_KEY_ID=<access key id>
   R2_SECRET_ACCESS_KEY=<secret access key>
   R2_BUCKET=carisca-media
   MEDIA_PUBLIC_URL=<the public URL from step 2: R2 dev URL, Worker URL, or custom domain>
   ```

   For a bucket created in the EU jurisdiction, also set `R2_ENDPOINT=https://<account id>.eu.r2.cloudflarestorage.com`.

   The API refuses to start if `STORAGE_DRIVER=r2` and any required value is missing, and lists the missing ones.

5. **Configure Vercel.** In the Vercel project, go to **Settings → Environment Variables** and add `MEDIA_PUBLIC_URL` with the same public URL from step 2. Then **redeploy** — Next.js only allows images from hosts it was built with, so a restart is not enough.

6. **Fill the live site.** Run `npm run import:wordpress -- --with-media` from this computer, with the live database and R2 settings in `backend/.env`. This computer already holds the WordPress downloads from the earlier import (`backend/storage/import-cache`), so they are uploaded to R2 rather than downloaded again.

7. **Private bucket (optional).** Back in Cloudflare, create a second R2 bucket (e.g. `carisca-private`) and leave public access **off**. Add `R2_PRIVATE_BUCKET=carisca-private` to the API config. Files uploaded with visibility *private* go there and are only downloadable by signed-in staff through the API. Without this bucket, private uploads are refused with a clear message. R2 public access applies to a whole bucket, which is why private files cannot share the public one.

## Filling the live site

The WordPress importer saves every image and document through the active driver, so with `STORAGE_DRIVER=r2` it uploads straight to the bucket:

```bash
cd backend
npm run import:wordpress -- --with-media      # from source, or
node dist/scripts/import-wordpress.js --with-media   # on a server with the built API
```

Run it with `.env` pointing at the **live database** and the R2 settings above.

Downloads are cached in `STORAGE_DIR/import-cache/`. Running the importer from a computer that has already imported once reuses that cache instead of downloading everything from the old site again.

The importer is safe to re-run: records that already exist are left untouched.

## Files already stored on disk

Switching an existing installation from `local` to `r2` changes every public link at once, to `MEDIA_PUBLIC_URL/uploads/<path>`. Copy the files into the bucket **before** switching, keeping the same paths under an `uploads/` prefix. For example, with `rclone` configured for R2:

```bash
rclone copy STORAGE_DIR/public/uploads r2:carisca-media/uploads
rclone copy STORAGE_DIR/private/uploads r2:carisca-private/uploads
```

Images embedded in article or page bodies store their full address. Bodies written before the switch keep pointing at `API_PUBLIC_URL/uploads/...`. The API keeps serving `/uploads` from disk for that reason, so leave the old files in place.

## Security and caching

The API sets these headers on each object as it uploads it:

- **`Content-Type`:** taken from the allow-list, never from the browser.
- **`Content-Disposition: attachment`:** for anything other than images and PDFs, so other documents download instead of opening.
- **`Cache-Control: public, max-age=31536000, immutable`:** every upload gets a new random name, so an object never changes after it's written.

The same checks as before apply to every upload: an extension allow-list, a magic-byte check and rejection of SVGs containing scripts.

R2 can't attach a `Content-Security-Policy` to individual objects. The local driver sends a sandbox CSP for uploads, and on a custom domain you can add the equivalent with a Cloudflare **Rules → Transform Rules → Modify Response Header** rule for `media.carisca.org`:

```
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox
```

Serving media from its own subdomain, separate from the website and the API, also means an uploaded file can never run in the context of the site's cookies.

## Backups

Objects in R2 are **not** part of cPanel or Render backups. Media rows in the database point to objects by path, so back up both together. You can copy the buckets with `rclone sync` on a schedule, and enable R2 object versioning or lifecycle rules if you need point-in-time recovery.
