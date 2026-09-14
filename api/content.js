'use strict';
/* Site content: public read, admin write, one-step undo and reset. */
const L = require('./_lib');

const MAX_BYTES = 900 * 1024;

module.exports = L.handle(async (req, res) => {
  const method = (req.method || 'GET').toUpperCase();
  const url = new URL(req.url, 'http://localhost');

  /* ------------------------------------------------------------- read */
  if (method === 'GET') {
    const stored = await L.getJSON(L.CONTENT_KEY);
    if (url.searchParams.get('fresh') === '1') res.setHeader('Cache-Control', 'no-store');
    else res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=10, stale-while-revalidate=60');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({
      ok: true,
      store: L.connected ? 'redis' : 'ephemeral',
      hasContent: Boolean(stored),
      updatedAt: stored ? stored.updatedAt : null,
      content: stored ? stored.content : null
    }));
  }

  /* ------------------------------------------------------------- write */
  if (method === 'PUT') {
    const session = await L.requireAdmin(req, res);
    if (!session) return;

    const body = await L.readBody(req);
    const content = body && body.content;
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      return L.fail(res, 400, 'Expected a content object');
    }
    if (!Array.isArray(content.products) || !Array.isArray(content.categories)) {
      return L.fail(res, 400, 'Content must include products and categories');
    }
    const serialised = JSON.stringify(content);
    if (serialised.length > MAX_BYTES) {
      return L.fail(res, 413, 'Content is too large (' + Math.round(serialised.length / 1024) + ' KB). Upload big images through the Media tab instead of pasting them in.');
    }

    const previous = await L.getJSON(L.CONTENT_KEY);
    if (previous) await L.setJSON(L.CONTENT_PREV_KEY, previous);
    const record = { content: content, updatedAt: new Date().toISOString() };
    await L.setJSON(L.CONTENT_KEY, record);
    return L.ok(res, { updatedAt: record.updatedAt, canUndo: Boolean(previous) });
  }

  /* ------------------------------------------------------------- undo / reset */
  if (method === 'POST') {
    const session = await L.requireAdmin(req, res);
    if (!session) return;

    const body = await L.readBody(req);
    const action = String(body.action || '');

    if (action === 'undo') {
      const previous = await L.getJSON(L.CONTENT_PREV_KEY);
      if (!previous) return L.fail(res, 404, 'There is nothing to undo.');
      const current = await L.getJSON(L.CONTENT_KEY);
      await L.setJSON(L.CONTENT_KEY, previous);
      if (current) await L.setJSON(L.CONTENT_PREV_KEY, current);
      return L.ok(res, { content: previous.content, updatedAt: previous.updatedAt });
    }

    if (action === 'reset') {
      const current = await L.getJSON(L.CONTENT_KEY);
      if (current) await L.setJSON(L.CONTENT_PREV_KEY, current);
      await L.cmd('DEL', L.CONTENT_KEY);
      return L.ok(res, { reset: true });
    }

    return L.fail(res, 400, 'Unknown action');
  }

  return L.fail(res, 405, 'Method not allowed');
});
