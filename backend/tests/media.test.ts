import { describe, expect, it } from 'vitest';
import { login } from './helpers';

// 1×1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

describe('media library', () => {
  it('accepts a valid image and records its dimensions', async () => {
    const { send } = await login('editor');
    const res = await send('post', '/api/v1/admin/media').attach('file', PNG, 'Pixel Test.png').field('alt_text', 'A pixel');
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ kind: 'image', mime_type: 'image/png', width: 1, height: 1, alt_text: 'A pixel' });
    expect(res.body.data.url).toMatch(/\/uploads\/\d{4}\/\d{2}\/pixel-test-[a-f0-9]{8}\.png$/);
  });

  it('rejects disallowed and disguised files', async () => {
    const { send } = await login('editor');
    expect((await send('post', '/api/v1/admin/media').attach('file', Buffer.from('MZ fake exe'), 'tool.exe')).status).toBe(400);
    expect((await send('post', '/api/v1/admin/media').attach('file', Buffer.from('<?php echo 1;'), 'shell.png')).status).toBe(400);
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect((await send('post', '/api/v1/admin/media').attach('file', svg, 'logo.svg')).status).toBe(400);
    const handler = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>');
    expect((await send('post', '/api/v1/admin/media').attach('file', handler, 'logo.svg')).status).toBe(400);
    // Attribute names that merely contain "on" (e.g. Figma exports) are not event handlers.
    const exported = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><pattern patternContentUnits="objectBoundingBox"/></svg>');
    expect((await send('post', '/api/v1/admin/media').attach('file', exported, 'export.svg')).status).toBe(201);
    // Path segments in the uploaded filename are discarded.
    const traversal = await send('post', '/api/v1/admin/media').attach('file', PNG, '../../etc/passwd.png');
    expect(traversal.status).toBe(201);
    expect(traversal.body.data.url).not.toMatch(/\.\./);
  });

  it('blocks deleting files that are in use and allows replacing them', async () => {
    const { send, agent } = await login('editor');
    const upload = await send('post', '/api/v1/admin/media').attach('file', PNG, 'cover.png');
    const mediaId = upload.body.data.id;
    await send('post', '/api/v1/admin/publications').send({ title: 'Uses cover', type: 'policy_brief', cover_image_id: mediaId });
    const del = await send('delete', `/api/v1/admin/media/${mediaId}`);
    expect(del.status).toBe(409);
    expect(del.body.error.details.usages[0].label).toBe('Publication cover');

    const replaced = await send('post', `/api/v1/admin/media/${mediaId}/replace`).attach('file', PNG, 'new-cover.png');
    expect(replaced.status).toBe(200);
    expect(replaced.body.data.id).toBe(mediaId);
    expect(replaced.body.data.original_name).toBe('new-cover.png');
    const detail = await agent.get(`/api/v1/admin/media/${mediaId}`);
    expect(detail.body.data.usages).toHaveLength(1);
  });

  it('does not let authors delete media', async () => {
    const { send } = await login('author');
    const up = await send('post', '/api/v1/admin/media').attach('file', PNG, 'mine.png');
    expect(up.status).toBe(201);
    expect((await send('delete', `/api/v1/admin/media/${up.body.data.id}`)).status).toBe(403);
  });
});
