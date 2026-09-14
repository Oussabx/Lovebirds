'use strict';
/* Image library: the dashboard uploads pictures, the storefront serves them. */
const L = require('./_lib');

const INDEX = 'lb:images';
const MAX_BYTES = 2.4 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

module.exports = L.handle(async (req, res) => {
  const method = (req.method || 'GET').toUpperCase();
  const url = new URL(req.url, 'http://localhost');

  /* ------------------------------------------------------------- serve / list */
  if (method === 'GET') {
    const id = L.clean(url.searchParams.get('id'), 40);

    if (id) {
      const dataUrl = await L.cmd('GET', 'lb:img:' + id);
      if (!dataUrl) { res.statusCode = 404; return res.end('Not found'); }
      const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
      if (!match) { res.statusCode = 500; return res.end('Broken image'); }
      const buffer = Buffer.from(match[2], 'base64');
      res.statusCode = 200;
      res.setHeader('Content-Type', match[1]);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.end(buffer);
    }

    const session = await L.requireAdmin(req, res);
    if (!session) return;
    const ids = (await L.cmd('ZRANGE', INDEX, 0, 199, 'REV')) || [];
    if (!ids.length) return L.ok(res, { images: [] });
    const raw = await L.cmd('MGET', ...ids.map(x => 'lb:imgmeta:' + x));
    const images = (raw || []).map(entry => { try { return JSON.parse(entry); } catch (e) { return null; } }).filter(Boolean);
    return L.ok(res, { images: images });
  }

  /* ------------------------------------------------------------- upload */
  if (method === 'POST') {
    const session = await L.requireAdmin(req, res);
    if (!session) return;

    const body = await L.readBody(req);
    const dataUrl = String(body.dataUrl || '');
    const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!match) return L.fail(res, 400, 'That file could not be read as an image.');
    if (ALLOWED.indexOf(match[1]) === -1) return L.fail(res, 415, 'Use a JPG, PNG, WebP, GIF or SVG.');

    const bytes = Math.ceil(match[2].length * 0.75);
    if (bytes > MAX_BYTES) return L.fail(res, 413, 'That image is ' + Math.round(bytes / 1024) + ' KB. Keep it under 2 MB.');

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const meta = {
      id: id,
      name: L.clean(body.name, 120) || 'image',
      type: match[1],
      bytes: bytes,
      url: '/api/media?id=' + id,
      uploadedAt: new Date().toISOString()
    };
    await L.cmd('SET', 'lb:img:' + id, dataUrl);
    await L.setJSON('lb:imgmeta:' + id, meta);
    await L.cmd('ZADD', INDEX, Date.now(), id);
    return L.ok(res, { image: meta });
  }

  /* ------------------------------------------------------------- delete */
  if (method === 'DELETE') {
    const session = await L.requireAdmin(req, res);
    if (!session) return;
    const id = L.clean(url.searchParams.get('id'), 40);
    if (!id) return L.fail(res, 400, 'Which image?');
    await L.cmd('DEL', 'lb:img:' + id);
    await L.cmd('DEL', 'lb:imgmeta:' + id);
    await L.cmd('ZREM', INDEX, id);
    return L.ok(res, { deleted: id });
  }

  return L.fail(res, 405, 'Method not allowed');
});
