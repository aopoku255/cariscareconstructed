import { Router } from 'express';
import multer from 'multer';
import { Op, type WhereOptions } from 'sequelize';
import { z } from 'zod';
import { requirePermission } from '../../middleware/auth';
import { MediaAsset, User } from '../../models';
import { audit } from '../../services/audit.service';
import { deleteAsset, findUsages, MAX_UPLOAD_BYTES, replaceFile, storeUpload } from '../../services/media.service';
import { revalidateFrontend } from '../../services/revalidate.service';
import { storage } from '../../services/storage';
import { badRequest, notFound } from '../../utils/errors';
import { listQuerySchema, optText, paginate } from '../../validators/common';

export const mediaRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 10 },
});

export const mediaMetaSchema = z.object({
  alt_text: optText(500),
  caption: optText(1000),
  title: optText(255),
  visibility: z.enum(['public', 'private']).optional(),
});

const loadAsset = async (id: string) => {
  const asset = await MediaAsset.findByPk(Number(id));
  if (!asset) throw notFound('File not found');
  return asset;
};

mediaRouter.get('/', requirePermission('media.read'), async (req, res) => {
  const q = listQuerySchema.parse(req.query);
  const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined;
  const where: WhereOptions = {
    ...(kind && ['image', 'document', 'video', 'other'].includes(kind) ? { kind } : {}),
    ...(q.q
      ? {
          [Op.or]: [
            { original_name: { [Op.like]: `%${q.q}%` } },
            { title: { [Op.like]: `%${q.q}%` } },
            { alt_text: { [Op.like]: `%${q.q}%` } },
          ],
        }
      : {}),
  };
  const { rows, count } = await MediaAsset.findAndCountAll({
    where,
    order: [['created_at', 'desc']],
    include: [{ model: User, as: 'uploader', attributes: ['id', 'name'] }],
    ...paginate(q.page, q.pageSize),
  });
  res.json({ data: rows, meta: { page: q.page, pageSize: q.pageSize, total: count, totalPages: Math.ceil(count / q.pageSize) } });
});

mediaRouter.get('/:id', requirePermission('media.read'), async (req, res) => {
  const asset = await loadAsset(String(req.params.id));
  res.json({ data: { ...asset.toJSON(), usages: await findUsages(asset) } });
});

/** Streams a private file to an authorised user. Public files are served statically. */
mediaRouter.get('/:id/download', requirePermission('media.read'), async (req, res) => {
  const asset = await loadAsset(String(req.params.id));
  const file = await storage.read(asset.visibility, asset.storage_path);
  if (!file) throw notFound('File missing from storage');
  res.setHeader('Content-Type', asset.mime_type);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.attachment(asset.original_name);
  file.pipe(res);
});

mediaRouter.post('/', requirePermission('media.create'), upload.single('file'), async (req, res) => {
  if (!req.file) throw badRequest('Choose a file to upload.', { field: 'file' });
  const meta = mediaMetaSchema.parse(req.body ?? {});
  const asset = await storeUpload(req.file, { ...meta, uploaded_by: req.auth!.user.id });
  await audit(req, 'upload', { type: 'media', id: asset.id, summary: asset.original_name });
  res.status(201).json({ data: asset });
});

mediaRouter.patch('/:id', requirePermission('media.update'), async (req, res) => {
  const asset = await loadAsset(String(req.params.id));
  const meta = mediaMetaSchema.omit({ visibility: true }).partial().parse(req.body ?? {});
  await asset.update(meta);
  await audit(req, 'update', { type: 'media', id: asset.id, summary: asset.original_name }, meta);
  void revalidateFrontend(['media']);
  res.json({ data: asset });
});

mediaRouter.post('/:id/replace', requirePermission('media.update'), upload.single('file'), async (req, res) => {
  if (!req.file) throw badRequest('Choose a replacement file.', { field: 'file' });
  const asset = await loadAsset(String(req.params.id));
  const previous = asset.original_name;
  await replaceFile(asset, req.file);
  await audit(req, 'replace_file', { type: 'media', id: asset.id, summary: `${previous} → ${asset.original_name}` });
  // Every page referencing this asset now shows the new file.
  void revalidateFrontend(['home', 'articles', 'events', 'publications', 'staff', 'pages', 'media']);
  res.json({ data: asset });
});

mediaRouter.delete('/:id', requirePermission('media.delete'), async (req, res) => {
  const asset = await loadAsset(String(req.params.id));
  await deleteAsset(asset);
  await audit(req, 'delete', { type: 'media', id: asset.id, summary: asset.original_name });
  res.status(204).end();
});
