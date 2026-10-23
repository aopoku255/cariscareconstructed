import { NoSuchKey, S3Client, type PutObjectCommand } from '@aws-sdk/client-s3';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createR2Storage } from '../src/services/storage';

const config = {
  endpoint: 'https://account.r2.cloudflarestorage.com',
  accessKeyId: 'key',
  secretAccessKey: 'secret',
  bucket: 'carisca-media',
  publicUrl: 'https://media.example.org/',
};

const mockSend = () => vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({} as never);
const putInputs = (send: ReturnType<typeof mockSend>) => send.mock.calls.map(([cmd]) => (cmd as PutObjectCommand).input);

describe('R2 storage driver', () => {
  afterEach(() => vi.restoreAllMocks());

  it('writes public files to the public bucket, forcing downloads for non-viewable types', async () => {
    const send = mockSend();
    const r2 = createR2Storage(config);
    await r2.put('public', '2026/10/photo-ab12cd34.jpg', Buffer.from('x'), 'image/jpeg');
    await r2.put('public', '2026/10/data-ab12cd34.csv', Buffer.from('x'), 'text/csv');

    const [photo, csv] = putInputs(send);
    expect(photo).toMatchObject({ Bucket: 'carisca-media', Key: 'uploads/2026/10/photo-ab12cd34.jpg', ContentType: 'image/jpeg' });
    expect(photo.ContentDisposition).toBeUndefined();
    expect(photo.CacheControl).toContain('immutable');
    expect(csv.ContentDisposition).toBe('attachment');
  });

  it('builds public URLs from the media base URL', () => {
    expect(createR2Storage(config).publicUrl('2026/10/annual report.pdf')).toBe(
      'https://media.example.org/uploads/2026/10/annual%20report.pdf',
    );
  });

  it('never puts private files in the public bucket', async () => {
    const send = mockSend();
    await expect(createR2Storage(config).put('private', '2026/10/x.pdf', Buffer.from('x'), 'application/pdf')).rejects.toMatchObject({
      status: 400,
    });
    expect(send).not.toHaveBeenCalled();

    await createR2Storage({ ...config, privateBucket: 'carisca-private' }).put('private', '2026/10/x.pdf', Buffer.from('x'), 'application/pdf');
    expect(putInputs(send)[0].Bucket).toBe('carisca-private');
  });

  it('reports a missing object as null', async () => {
    vi.spyOn(S3Client.prototype, 'send').mockRejectedValue(new NoSuchKey({ message: 'missing', $metadata: {} }));
    await expect(createR2Storage(config).read('public', '2026/10/gone.jpg')).resolves.toBeNull();
  });
});
