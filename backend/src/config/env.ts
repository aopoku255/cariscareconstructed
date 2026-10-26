import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: process.env.DOTENV_PATH || path.resolve(__dirname, '../../.env') });

const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

/** Optional URL: trims whitespace and treats empty strings (common in .env files) as unset. */
const optUrl = z.preprocess(
  (v) => (typeof v === 'string' ? (v.trim() || undefined) : v),
  z.string().url().optional(),
);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  /** Public base URL of this API, e.g. https://api.carisca.knust.edu.gh (used to build media URLs). */
  API_PUBLIC_URL: z.string().url().default('http://localhost:5000'),
  /** Comma-separated list of browser origins allowed to call the API with credentials. */
  FRONTEND_URL: z.string().min(1).default('http://localhost:3000'),
  /** Set when the API is behind cPanel/Passenger or another reverse proxy. */
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_LOGGING: bool,
  DB_TIMEZONE: z.string().default('+00:00'),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_COOKIE_NAME: z.string().default('carisca_sid'),
  /** Optional parent domain for the session cookie, e.g. .carisca.knust.edu.gh. Leave empty for host-only. */
  COOKIE_DOMAIN: z.string().optional(),
  SESSION_IDLE_MINUTES: z.coerce.number().int().positive().default(120),
  SESSION_ABSOLUTE_HOURS: z.coerce.number().int().positive().default(12),

  /** Where uploaded files are kept: `local` (STORAGE_DIR) or `r2` (Cloudflare R2). */
  STORAGE_DRIVER: z.enum(['local', 'r2']).default('local'),
  STORAGE_DIR: z.string().default(path.resolve(__dirname, '../../storage')),
  /** Public base URL of the media bucket, e.g. https://media.carisca.org. Required for R2. */
  MEDIA_PUBLIC_URL: optUrl,
  R2_ACCOUNT_ID: z.string().optional(),
  /** Overrides the endpoint derived from R2_ACCOUNT_ID (e.g. an EU-jurisdiction bucket). */
  R2_ENDPOINT: optUrl,
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  /** Bucket with public access enabled, served at MEDIA_PUBLIC_URL. */
  R2_BUCKET: z.string().optional(),
  /** Bucket without public access, for files uploaded as private. Optional. */
  R2_PRIVATE_BUCKET: z.string().optional(),
  UPLOAD_MAX_IMAGE_MB: z.coerce.number().positive().default(5),
  UPLOAD_MAX_DOCUMENT_MB: z.coerce.number().positive().default(25),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_SECURE: bool,
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  /** Inbox that receives contact-form notifications (optional). */
  CONTACT_NOTIFY_EMAIL: z.string().optional(),

  /** Frontend on-demand revalidation endpoint and shared secret. */
  REVALIDATE_URL: optUrl,
  REVALIDATE_SECRET: z.string().optional(),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  /** Serve Swagger UI at /api/docs and the spec at /api/openapi.json. Defaults to on outside production. */
  API_DOCS_ENABLED: z.enum(['true', 'false']).optional(),
}).superRefine((v, ctx) => {
  if (v.STORAGE_DRIVER !== 'r2') return;
  const required = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'MEDIA_PUBLIC_URL'] as const;
  for (const key of required) {
    if (!v[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'Required when STORAGE_DRIVER=r2' });
  }
  if (!v.R2_ACCOUNT_ID && !v.R2_ENDPOINT) {
    ctx.addIssue({ code: 'custom', path: ['R2_ACCOUNT_ID'], message: 'Set R2_ACCOUNT_ID (or R2_ENDPOINT) when STORAGE_DRIVER=r2' });
  }
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast with a readable message; never print secret values.
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid backend environment configuration:\n${issues}`);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  allowedOrigins: raw.FRONTEND_URL.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
  /** The API's own origin (same-origin requests, e.g. from the Swagger UI page). */
  selfOrigin: new URL(raw.API_PUBLIC_URL).origin,
  docsEnabled: raw.API_DOCS_ENABLED ? raw.API_DOCS_ENABLED === 'true' : raw.NODE_ENV !== 'production',
  mailEnabled: Boolean(raw.SMTP_HOST && raw.MAIL_FROM),
  publicStorageDir: path.join(raw.STORAGE_DIR, 'public'),
  privateStorageDir: path.join(raw.STORAGE_DIR, 'private'),
  r2Endpoint: raw.R2_ENDPOINT ?? (raw.R2_ACCOUNT_ID ? `https://${raw.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined),
};

export type Env = typeof env;
