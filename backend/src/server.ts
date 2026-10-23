import fs from 'node:fs';
import path from 'node:path';
import { env } from './config/env';
import { sequelize } from './models';
import { purgeExpiredSessions } from './services/auth.service';
import { createApp } from './app';
import { logger } from './utils/logger';

async function main() {
  // Only the local driver writes to disk; the WordPress importer creates its own cache folder.
  if (env.STORAGE_DRIVER === 'local') {
    for (const dir of [path.join(env.publicStorageDir, 'uploads'), path.join(env.privateStorageDir, 'uploads')]) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  await sequelize.authenticate();
  const app = createApp();
  // cPanel/Passenger supplies the port (or a socket path) through PORT.
  const server = app.listen(process.env.PORT || env.PORT, () => {
    logger.info({ port: process.env.PORT || env.PORT, env: env.NODE_ENV }, 'CARISCA API listening');
  });

  // Housekeeping without a separate cron process: purge expired sessions hourly.
  const timer = setInterval(() => void purgeExpiredSessions().catch(() => undefined), 3_600_000);
  timer.unref();

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => void sequelize.close().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start API');
  process.exit(1);
});
