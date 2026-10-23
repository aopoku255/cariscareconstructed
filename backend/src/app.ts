import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { csrfProtection, loadSession } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error';
import { buildOpenApiSpec } from './docs/openapi';
import { apiRouter } from './routes';
import { INLINE_FILE } from './services/storage';
import { logger } from './utils/logger';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.set('query parser', 'extended');

  app.use(
    helmet({
      // The API only returns JSON and files; a locked-down CSP is safe.
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  if (!env.isTest) {
    app.use(
      pinoHttp({
        logger,
        autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
        customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
        serializers: {
          req: (req) => ({ method: req.method, url: req.url }),
          res: (res) => ({ statusCode: res.statusCode }),
        },
      }),
    );
  }

  app.use(
    cors({
      origin: (origin, cb) => {
        // Non-browser clients (no Origin) are allowed; browsers must be on the allow-list.
        if (!origin || env.allowedOrigins.includes(origin.replace(/\/$/, ''))) return cb(null, true);
        cb(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
      maxAge: 600,
    }),
  );

  // Public uploads on the local disk (STORAGE_DRIVER=local). With R2 the bucket serves them directly;
  // this route keeps any files written to disk before the switch reachable.
  app.use(
    '/uploads',
    helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }),
    express.static(path.join(env.publicStorageDir, 'uploads'), {
      index: false,
      dotfiles: 'deny',
      fallthrough: false,
      maxAge: '30d',
      setHeaders: (res, filePath) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        // Uploaded files can never run script, even SVGs opened directly.
        res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox");
        if (!INLINE_FILE.test(filePath)) res.setHeader('Content-Disposition', 'attachment');
      },
    }),
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api/v1', loadSession, csrfProtection, apiRouter);

  if (env.docsEnabled) {
    const spec = buildOpenApiSpec();
    app.get('/api/openapi.json', (_req, res) => res.json(spec));
    app.use(
      '/api/docs',
      // Swagger UI needs its own scripts, inline styles and data-URI icons; everything stays same-origin.
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      }),
      swaggerUi.serve,
      swaggerUi.setup(spec, {
        customSiteTitle: 'CARISCA API documentation',
        swaggerOptions: { persistAuthorization: true, withCredentials: true, docExpansion: 'none' },
      }),
    );
  }

  app.get('/', (_req, res) =>
    res.json({ name: 'CARISCA website API', version: 'v1', health: '/api/v1/health', ...(env.docsEnabled ? { docs: '/api/docs' } : {}) }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
