import crypto from 'node:crypto';
import path from 'node:path';
import { imageSize } from 'image-size';
import { Op, type Model, type ModelStatic } from 'sequelize';
import { env } from '../config/env';
import {
  Article,
  CpdProgramme,
  Event,
  EventAttachment,
  Gallery,
  GalleryItem,
  HomepageSlide,
  LmiReport,
  MediaAsset,
  Newsletter,
  Page,
  Partner,
  Publication,
  ResearchProject,
  ResearchTheme,
  StaffProfile,
} from '../models';
import { badRequest, conflict } from '../utils/errors';
import { slugify } from '../utils/slug';
import { storage } from './storage';

type Kind = 'image' | 'document';

interface FileRule {
  kind: Kind;
  mime: string;
  /** Returns true when the buffer's leading bytes match the declared type. */
  sniff: (buf: Buffer) => boolean;
}

const startsWith = (buf: Buffer, bytes: number[], offset = 0) => bytes.every((b, i) => buf[offset + i] === b);
const isZip = (b: Buffer) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]);
const isOle = (b: Buffer) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const isPlainText = (b: Buffer) => !b.subarray(0, 4096).includes(0);

/** Allow-list keyed by lower-case extension. Anything not listed is rejected. */
const RULES: Record<string, FileRule> = {
  jpg: { kind: 'image', mime: 'image/jpeg', sniff: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  jpeg: { kind: 'image', mime: 'image/jpeg', sniff: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  png: { kind: 'image', mime: 'image/png', sniff: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47]) },
  gif: { kind: 'image', mime: 'image/gif', sniff: (b) => startsWith(b, [0x47, 0x49, 0x46, 0x38]) },
  webp: {
    kind: 'image',
    mime: 'image/webp',
    sniff: (b) => startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8),
  },
  svg: { kind: 'image', mime: 'image/svg+xml', sniff: (b) => isPlainText(b) && /<svg[\s>]/i.test(b.toString('utf8')) },
  pdf: { kind: 'document', mime: 'application/pdf', sniff: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d]) },
  docx: {
    kind: 'document',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sniff: isZip,
  },
  xlsx: { kind: 'document', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', sniff: isZip },
  pptx: {
    kind: 'document',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    sniff: isZip,
  },
  doc: { kind: 'document', mime: 'application/msword', sniff: isOle },
  xls: { kind: 'document', mime: 'application/vnd.ms-excel', sniff: isOle },
  ppt: { kind: 'document', mime: 'application/vnd.ms-powerpoint', sniff: isOle },
  csv: { kind: 'document', mime: 'text/csv', sniff: isPlainText },
  txt: { kind: 'document', mime: 'text/plain', sniff: isPlainText },
};

export const ALLOWED_EXTENSIONS = Object.keys(RULES);
export const MAX_UPLOAD_BYTES = Math.max(env.UPLOAD_MAX_IMAGE_MB, env.UPLOAD_MAX_DOCUMENT_MB) * 1024 * 1024;

/** Rejects SVGs that could execute script when opened directly. */
function assertSafeSvg(buf: Buffer) {
  const text = buf.toString('utf8');
  if (/<script|on[a-z]+\s*=|javascript:|<foreignObject|<iframe|<embed|<object/i.test(text)) {
    throw badRequest('SVG files containing scripts, event handlers or embedded content are not allowed.');
  }
}

export interface ValidatedFile {
  ext: string;
  rule: FileRule;
  width: number | null;
  height: number | null;
  checksum: string;
}

export function validateUpload(file: Express.Multer.File): ValidatedFile {
  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  const rule = RULES[ext];
  if (!rule) throw badRequest(`File type ".${ext || '?'}" is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}.`);
  if (!rule.sniff(file.buffer)) throw badRequest('File contents do not match its extension.');

  const limitMb = rule.kind === 'image' ? env.UPLOAD_MAX_IMAGE_MB : env.UPLOAD_MAX_DOCUMENT_MB;
  if (file.size > limitMb * 1024 * 1024) throw badRequest(`${rule.kind} files must be ${limitMb} MB or smaller.`);

  let width: number | null = null;
  let height: number | null = null;
  if (ext === 'svg') assertSafeSvg(file.buffer);
  if (rule.kind === 'image') {
    try {
      const dim = imageSize(file.buffer);
      width = dim.width ?? null;
      height = dim.height ?? null;
    } catch {
      if (ext !== 'svg') throw badRequest('The image could not be read.');
    }
  }
  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
  return { ext, rule, width, height, checksum };
}

/** Builds `YYYY/MM/<slug>-<random>.<ext>`, the storage path shared by every storage driver. */
function buildStoragePath(originalName: string, ext: string) {
  const now = new Date();
  const base = slugify(path.basename(originalName, path.extname(originalName)), 80);
  const name = `${base}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  return path.posix.join(String(now.getUTCFullYear()), String(now.getUTCMonth() + 1).padStart(2, '0'), name);
}

export async function storeUpload(
  file: Express.Multer.File,
  meta: {
    visibility?: 'public' | 'private';
    alt_text?: string | null;
    caption?: string | null;
    title?: string | null;
    uploaded_by?: number | null;
    source_url?: string | null;
  },
) {
  const v = validateUpload(file);
  const visibility = meta.visibility ?? 'public';
  const storagePath = buildStoragePath(file.originalname, v.ext);
  await storage.put(visibility, storagePath, file.buffer, v.rule.mime);
  try {
    return await MediaAsset.create({
      kind: v.rule.kind,
      visibility,
      filename: path.posix.basename(storagePath),
      original_name: file.originalname.slice(0, 255),
      title: meta.title ?? null,
      mime_type: v.rule.mime,
      size_bytes: file.size,
      width: v.width,
      height: v.height,
      alt_text: meta.alt_text ?? null,
      caption: meta.caption ?? null,
      storage_path: storagePath,
      checksum: v.checksum,
      source_url: meta.source_url ?? null,
      uploaded_by: meta.uploaded_by ?? null,
    });
  } catch (err) {
    await storage.remove(visibility, storagePath);
    throw err;
  }
}

/**
 * Replaces the file behind an existing media record. Every page that references the record
 * (including placeholder slots) picks up the new file without editing content.
 */
export async function replaceFile(asset: MediaAsset, file: Express.Multer.File) {
  const v = validateUpload(file);
  if (v.rule.kind !== asset.kind) throw badRequest(`Replacement must also be a ${asset.kind}.`);
  const storagePath = buildStoragePath(file.originalname, v.ext);
  await storage.put(asset.visibility, storagePath, file.buffer, v.rule.mime);
  const oldPath = asset.storage_path;
  await asset.update({
    filename: path.posix.basename(storagePath),
    original_name: file.originalname.slice(0, 255),
    mime_type: v.rule.mime,
    size_bytes: file.size,
    width: v.width,
    height: v.height,
    storage_path: storagePath,
    checksum: v.checksum,
  });
  await storage.remove(asset.visibility, oldPath);
  return asset;
}

const REFERENCES: Array<[ModelStatic<Model>, string, string]> = [
  [Page, 'hero_image_id', 'Page hero'],
  [Page, 'og_image_id', 'Page social image'],
  [HomepageSlide, 'image_id', 'Homepage slide'],
  [Article, 'featured_image_id', 'Article image'],
  [Article, 'attachment_id', 'Article attachment'],
  [Article, 'og_image_id', 'Article social image'],
  [ResearchTheme, 'image_id', 'Research theme'],
  [ResearchProject, 'image_id', 'Research project'],
  [Publication, 'cover_image_id', 'Publication cover'],
  [Publication, 'file_id', 'Publication file'],
  [LmiReport, 'file_id', 'LMI report file'],
  [LmiReport, 'cover_image_id', 'LMI report cover'],
  [StaffProfile, 'photo_id', 'Staff photo'],
  [Partner, 'logo_id', 'Partner logo'],
  [CpdProgramme, 'image_id', 'CPD programme'],
  [Event, 'image_id', 'Event image'],
  [Newsletter, 'cover_image_id', 'Newsletter cover'],
  [Newsletter, 'file_id', 'Newsletter file'],
  [Gallery, 'cover_image_id', 'Gallery cover'],
  [GalleryItem, 'media_id', 'Gallery item'],
  [EventAttachment, 'media_id', 'Event attachment'],
];

const RICH_TEXT: Array<[ModelStatic<Model>, string, string]> = [
  [Article, 'body', 'Article body'],
  [Page, 'body', 'Page body'],
  [Event, 'body', 'Event body'],
];

/** Lists where an asset is used (direct references and embeds in rich text). */
export async function findUsages(asset: MediaAsset) {
  const usages: Array<{ label: string; count: number }> = [];
  for (const [model, column, label] of REFERENCES) {
    const count = await model.count({ where: { [column]: asset.id } });
    if (count) usages.push({ label, count });
  }
  for (const [model, column, label] of RICH_TEXT) {
    const count = await model.count({ where: { [column]: { [Op.like]: `%${asset.filename}%` } } });
    if (count) usages.push({ label, count });
  }
  return usages;
}

export async function deleteAsset(asset: MediaAsset) {
  const usages = await findUsages(asset);
  if (usages.length) {
    throw conflict('This file is still in use. Remove it from the listed content first, or replace the file instead.', {
      usages,
    });
  }
  await asset.destroy({ force: true });
  await storage.remove(asset.visibility, asset.storage_path);
}
