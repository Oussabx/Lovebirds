'use strict';
/* Admin authentication: sign in, sign out, change password. */
const L = require('./_lib');

const MIN_PASSWORD = 8;

module.exports = L.handle(async (req, res) => {
  const method = (req.method || 'GET').toUpperCase();

  if (method === 'GET') {
    const session = await L.readSession(req);
    const record = await L.getJSON(L.AUTH_KEY);
    return L.ok(res, {
      authed: Boolean(session),
      configured: Boolean(record || process.env.ADMIN_PASSWORD)
    });
  }

  if (method !== 'POST') return L.fail(res, 405, 'Method not allowed');
  if (req.headers['x-lb-admin'] !== '1') return L.fail(res, 403, 'Missing admin header');

  const body = await L.readBody(req);
  const action = String(body.action || 'login');

  /* ------------------------------------------------------------- logout */
  if (action === 'logout') {
    await L.destroySession(req, res);
    return L.ok(res, { authed: false });
  }

  /* ------------------------------------------------------------- login */
  if (action === 'login') {
    const ip = L.clientIp(req);
    const limit = await L.rateLimit('login', ip, L.LOGIN_MAX, L.LOGIN_WINDOW);
    if (!limit.allowed) {
      return L.fail(res, 429, 'Too many attempts. Try again in a few minutes.');
    }

    const password = String(body.password || '');
    const record = await L.getJSON(L.AUTH_KEY);
    const envPassword = process.env.ADMIN_PASSWORD || '';

    if (!record && !envPassword) {
      return L.fail(res, 503, 'Admin password is not configured yet. Add an ADMIN_PASSWORD environment variable in Vercel and redeploy.', { configured: false });
    }

    let valid = false;
    let version = 1;

    if (record) {
      valid = L.samePassword(password, record);
      version = Number(record.version || 1);
    } else {
      valid = L.sameSecret(password, envPassword);
      if (valid) {
        /* First sign-in with the environment password: store a salted hash so
           the password can later be changed from the dashboard. */
        const created = Object.assign(L.makePassword(password), { version: 1, source: 'env' });
        await L.setJSON(L.AUTH_KEY, created);
        version = 1;
      }
    }

    if (!valid) {
      return L.fail(res, 401, 'That password is not right.', { remaining: limit.remaining });
    }

    await L.clearRateLimit('login', ip);
    await L.createSession(req, res, { v: version, ip: ip });
    return L.ok(res, { authed: true, weak: password.length < 10 });
  }

  /* ------------------------------------------------------------- password */
  if (action === 'password') {
    const session = await L.requireAdmin(req, res);
    if (!session) return;

    const current = String(body.current || '');
    const next = String(body.next || '');
    const record = await L.getJSON(L.AUTH_KEY);
    const envPassword = process.env.ADMIN_PASSWORD || '';

    const currentValid = record ? L.samePassword(current, record) : L.sameSecret(current, envPassword);
    if (!currentValid) return L.fail(res, 401, 'Your current password is not right.');
    if (next.length < MIN_PASSWORD) return L.fail(res, 400, 'Use at least ' + MIN_PASSWORD + ' characters.');
    if (next === current) return L.fail(res, 400, 'That is the password you already have.');

    const version = Number((record && record.version) || 1) + 1;
    await L.setJSON(L.AUTH_KEY, Object.assign(L.makePassword(next), { version: version, source: 'dashboard' }));
    await L.destroySession(req, res);
    await L.createSession(req, res, { v: version, ip: L.clientIp(req) });
    return L.ok(res, { changed: true });
  }

  return L.fail(res, 400, 'Unknown action');
});
