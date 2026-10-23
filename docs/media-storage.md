# Media storage (local disk or Cloudflare R2)

The API stores uploaded images and documents in one of two places, chosen with `STORAGE_DRIVER` in `backend/.env`:

| Driver | Files live in | Public links look like | Use when |
| ------ | ------------- | ---------------------- | -------- |
| `local` (default) | `STORAGE_DIR/public/uploads` and `STORAGE_DIR/private/uploads` on the API server | `https://<API_PUBLIC_URL>/uploads/2026/10/photo-ab12cd34.jpg` | Development, or a server with a persistent disk |
| `r2` | Cloudflare R2 buckets | `https://<MEDIA_PUBLIC_URL>/uploads/2026/10/photo-ab12cd34.jpg` | Production: files are independent of where the API runs (cPanel, Render…) and are served by Cloudflare's network |

The database only stores the relative path (`2026/10/photo-ab12cd34.jpg`). The driver decides where the bytes go and how the public link is built.

## Setting up R2

1. **Create the public bucket.** In the Cloudflare dashboard, open **R2 Object Storage → Create bucket**. Name it, for example `carisca-media`. Leave the location on *Automatic*, or choose *Western Europe*.
2. **Make it publicly readable.** In the bucket, open **Settings → Public access**.
   - **Custom domain (recommended):** connect a subdomain such as `media.carisca.org`. The domain's DNS must be managed by Cloudflare. A custom domain gets Cloudflare caching and can carry the security headers described below.
   - **R2.dev subdomain:** enable it to get an address like `https://pub-xxxx.r2.dev`. Cloudflare rate-limits these addresses and intends them for testing only.
3. **Create a private bucket (optional).** Create `carisca-private` and leave public access **off**. Files uploaded with visibility *private* go there and are only downloadable by signed-in staff through the API. Without this bucket, private uploads are refused with a clear message.

   R2 public access applies to a whole bucket, which is why private files can't share the public one.
4. **Create an API token.** Open **R2 Object Storage → Manage API tokens → Create API token**.
   - Permission: **Object Read & Write**, limited to the bucket(s) above.
   - Copy the **Access Key ID** and **Secret Access Key**; Cloudflare shows the secret only once.
   - Note your **Account ID**, shown on the R2 overview page.
5. **Configure the API** on the server that runs it (cPanel `.env`, or the Render dashboard):

   ```
   STORAGE_DRIVER=r2
   R2_ACCOUNT_ID=<account id>
   R2_ACCESS_KEY_ID=<access key id>
   R2_SECRET_ACCESS_KEY=<secret access key>
   R2_BUCKET=carisca-media
   R2_PRIVATE_BUCKET=carisca-private        # optional
   MEDIA_PUBLIC_URL=https://media.carisca.org
   ```

   For a bucket created in the EU jurisdiction, also set `R2_ENDPOINT=https://<account id>.eu.r2.cloudflarestorage.com`.

   The API refuses to start if `STORAGE_DRIVER=r2` and any required value is missing, and lists the missing ones.
6. **Configure the website.** Set `MEDIA_PUBLIC_URL` to the same address on the website host (Vercel: **Settings → Environment Variables**), then redeploy. Next.js only displays images from hosts it was built with, so a restart is not enough.

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
