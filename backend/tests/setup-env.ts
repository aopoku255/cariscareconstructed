import os from 'node:os';
import path from 'node:path';

// Must run before any application module reads its configuration.
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'carisca_test';
// Point tests at a dedicated (normally local) server, independent of the DB_* values in .env.
for (const key of ['HOST', 'PORT', 'USER', 'PASSWORD'] as const) {
  const value = process.env[`TEST_DB_${key}`];
  if (value !== undefined) process.env[`DB_${key}`] = value;
}
process.env.STORAGE_DRIVER = 'local';
process.env.STORAGE_DIR = path.join(os.tmpdir(), 'carisca-test-storage');
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.LOG_LEVEL = 'silent';
process.env.SMTP_HOST = '';
process.env.MAIL_FROM = '';
