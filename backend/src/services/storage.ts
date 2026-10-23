import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { DeleteObjectCommand, GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env';
import { badRequest } from '../utils/errors';

export type Visibility = 'public' | 'private';

/** Files a browser may display inline; everything else is served as a download. */
export const INLINE_FILE = /\.(jpe?g|png|gif|webp|svg|pdf)$/i;

/**
 * Where uploaded files live. `storagePath` is the `YYYY/MM/<name>.<ext>` value stored on
 * media_assets, so records stay valid whichever backend holds the bytes.
 */
export interface FileStorage {
  put(visibility: Visibility, storagePath: string, body: Buffer, contentType: string): Promise<void>;
  remove(visibility: Visibility, storagePath: string): Promise<void>;
  /** Opens a stored file for streaming, or returns null when it is missing. */
  read(visibility: Visibility, storagePath: string): Promise<Readable | null>;
  publicUrl(storagePath: string): string;
}

const encodePath = (storagePath: string) => storagePath.split('/').map(encodeURIComponent).join('/');

// ------------------------------------------------------------------ local disk (STORAGE_DIR)

/** Resolves a stored path inside the local storage root. */
export function localPath(visibility: Visibility, storagePath: string) {
  const root = path.resolve(visibility === 'public' ? env.publicStorageDir : env.privateStorageDir, 'uploads');
  const full = path.resolve(root, storagePath);
  // Defence in depth against path traversal via stored values.
  if (!full.startsWith(root + path.sep)) throw badRequest('Invalid storage path');
  return full;
}

const localStorage: FileStorage = {
  async put(visibility, storagePath, body) {
    const full = localPath(visibility, storagePath);
    await fsp.mkdir(path.dirname(full), { recursive: true });
    await fsp.writeFile(full, body, { flag: 'wx' });
  },
  async remove(visibility, storagePath) {
    try {
      await fsp.unlink(localPath(visibility, storagePath));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  },
  async read(visibility, storagePath) {
    const full = localPath(visibility, storagePath);
    try {
      await fsp.access(full);
    } catch {
      return null;
    }
    return fs.createReadStream(full);
  },
  publicUrl: (storagePath) => `${env.API_PUBLIC_URL.replace(/\/$/, '')}/uploads/${encodePath(storagePath)}`,
};

// ------------------------------------------------------------------ Cloudflare R2 (S3 API)

export interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Bucket with public access, served at `publicUrl`. */
  bucket: string;
  /** Bucket without public access; private uploads are refused when it is not set. */
  privateBucket?: string;
  publicUrl: string;
}

export function createR2Storage(config: R2Config): FileStorage {
  const client = new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    // R2 does not implement every optional S3 checksum; only send one when an operation requires it.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  // R2 public access applies to a whole bucket, so private files must never share the public one.
  const bucket = (visibility: Visibility) => {
    if (visibility === 'public') return config.bucket;
    if (!config.privateBucket) throw badRequest('Private files are not available: R2_PRIVATE_BUCKET is not configured.');
    return config.privateBucket;
  };
  const key = (storagePath: string) => `uploads/${storagePath}`;
  const base = config.publicUrl.replace(/\/$/, '');

  return {
    async put(visibility, storagePath, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket(visibility),
          Key: key(storagePath),
          Body: body,
          ContentType: contentType,
          ContentDisposition: INLINE_FILE.test(storagePath) ? undefined : 'attachment',
          // Every upload gets a new random name, so an object never changes once written.
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    },
    async remove(visibility, storagePath) {
      // Deleting a missing object succeeds, matching the local driver's ENOENT handling.
      await client.send(new DeleteObjectCommand({ Bucket: bucket(visibility), Key: key(storagePath) }));
    },
    async read(visibility, storagePath) {
      try {
        const res = await client.send(new GetObjectCommand({ Bucket: bucket(visibility), Key: key(storagePath) }));
        return (res.Body as Readable | undefined) ?? null;
      } catch (err) {
        if (err instanceof NoSuchKey) return null;
        throw err;
      }
    },
    publicUrl: (storagePath) => `${base}/${key(encodePath(storagePath))}`,
  };
}

export const storage: FileStorage =
  env.STORAGE_DRIVER === 'r2'
    ? createR2Storage({
        endpoint: env.r2Endpoint!,
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
        bucket: env.R2_BUCKET!,
        privateBucket: env.R2_PRIVATE_BUCKET,
        publicUrl: env.MEDIA_PUBLIC_URL!,
      })
    : localStorage;
