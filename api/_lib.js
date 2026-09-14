'use strict';
/* ==========================================================================
   lovebirds — shared server helpers
   Storage is Upstash/Vercel KV over its REST API (no npm dependencies).
   With no database configured the API still answers, but writes go to a
   temporary file and every response is tagged store:"ephemeral" so the
   dashboard can warn that changes will not survive.
   ========================================================================== */
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const connected = Boolean(REDIS_URL && REDIS_TOKEN);

const SESSION_TTL = 60 * 60 * 24 * 14;   // 14 days
const LOGIN_WINDOW = 900;                // 15 minutes
const LOGIN_MAX = 10;                    // attempts per window per IP
const ORDER_WINDOW = 3600;
const ORDER_MAX = 30;

/* ------------------------------------------------------------- dev store */
const DEV_FILE = path.join(os.tmpdir(), 'lovebirds-dev-store.json');
function devRead() {
  try { return JSON.parse(fs.readFileSync(DEV_FILE, 'utf8')); } catch (e) { return { kv: {}, z: {} }; }
}
function devWrite(d) { try { fs.writeFileSync(DEV_FILE, JSON.stringify(d)); } catch (e) {} }
function devAlive(entry) {
  if (!entry) return false;
  if (entry.exp && Date.now() > entry.exp) return false;
  return true;
}
function devCmd(args) {
  const d = devRead();
  const op = String(args[0]).toUpperCase();
  const key = args[1];
  let out = null;
  switch (op) {
    case 'GET': out = devAlive(d.kv[key]) ? d.kv[key].v : null; break;
    case 'MGET':
      out = args.slice(1).map(k => (devAlive(d.kv[k]) ? d.kv[k].v : null));
      break;
    case 'SET': {
      let exp = 0;
      const ex = args.findIndex(a => String(a).toUpperCase() === 'EX');
      if (ex > -1) exp = Date.now() + Number(args[ex + 1]) * 1000;
      d.kv[key] = { v: String(args[2]), exp: exp };
      out = 'OK';
      break;
    }
    case 'DEL': {
      let n = 0;
      args.slice(1).forEach(k => { if (d.kv[k]) { delete d.kv[k]; n++; } if (d.z[k]) { delete d.z[k]; n++; } });
      out = n;
      break;
    }
    case 'INCR': {
      const cur = devAlive(d.kv[key]) ? parseInt(d.kv[key].v, 10) || 0 : 0;
      d.kv[key] = { v: String(cur + 1), exp: d.kv[key] ? d.kv[key].exp : 0 };
      out = cur + 1;
      break;
    }
    case 'EXPIRE':
      if (d.kv[key]) d.kv[key].exp = Date.now() + Number(args[2]) * 1000;
      out = 1;
      break;
    case 'ZADD':
      d.z[key] = d.z[key] || {};
      d.z[key][String(args[3])] = Number(args[2]);
      out = 1;
      break;
    case 'ZREM':
      if (d.z[key]) delete d.z[key][String(args[2])];
      out = 1;
      break;
    case 'ZCARD': out = d.z[key] ? Object.keys(d.z[key]).length : 0; break;
    case 'ZRANGE': {
      const rev = args.some(a => String(a).toUpperCase() === 'REV');
      const entries = Object.entries(d.z[key] || {}).sort((a, b) => (rev ? b[1] - a[1] : a[1] - b[1]));
      const start = Number(args[2]) || 0;
      const stop = Number(args[3]);
      const end = stop < 0 ? entries.length + stop + 1 : stop + 1;
      out = entries.slice(start, end).map(e => e[0]);
      break;
    }
    default: throw new Error('dev store: unsupported command ' + op);
  }
  devWrite(d);
  return out;
}

/* ------------------------------------------------------------- redis */
async function cmd(...args) {
  if (!connected) return devCmd(args);
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(args.map(String))
  });
  if (!res.ok) throw new Error('storage error ' + res.status);
  const body = await res.json();
  if (body.error) throw new Error('storage error: ' + body.error);
  return body.result;
}

const getJSON = async (key) => {
  const raw = await cmd('GET', key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
};
const setJSON = (key, value, ttl) =>
  (ttl ? cmd('SET', key, JSON.stringify(value), 'EX', ttl) : cmd('SET', key, JSON.stringify(value)));

/* ------------------------------------------------------------- http helpers */
function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}
const ok = (res, payload) => json(res, 200, Object.assign({ ok: true, store: connected ? 'redis' : 'ephemeral' }, payload || {}));
const fail = (res, status, message, extra) => json(res, status, Object.assign({ ok: false, error: message, store: connected ? 'redis' : 'ephemeral' }, extra || {}));

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 5 * 1024 * 1024) throw new Error('payload too large');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (e) { return {}; }
}

const clientIp = (req) =>
  String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();

const isSecure = (req) =>
  Boolean(process.env.VERCEL) || String(req.headers['x-forwarded-proto'] || '').split(',')[0] === 'https';

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  const hit = raw.split(';').map(s => s.trim()).find(s => s.indexOf(name + '=') === 0);
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : '';
}

function writeCookie(req, res, name, value, maxAge) {
  const bits = [
    name + '=' + encodeURIComponent(value),
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=' + maxAge
  ];
  if (isSecure(req)) bits.push('Secure');
  res.setHeader('Set-Cookie', bits.join('; '));
}

/* ------------------------------------------------------------- rate limiting */
async function rateLimit(bucket, ip, max, windowSeconds) {
  const key = 'lb:rl:' + bucket + ':' + ip;
  const hits = await cmd('INCR', key);
  if (hits === 1) await cmd('EXPIRE', key, windowSeconds);
  return { allowed: hits <= max, hits: hits, remaining: Math.max(0, max - hits) };
}
const clearRateLimit = (bucket, ip) => cmd('DEL', 'lb:rl:' + bucket + ':' + ip);

/* ------------------------------------------------------------- passwords */
const SALT_BYTES = 16;
function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString('hex');
}
function makePassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  return { salt: salt, hash: hashPassword(password, salt), updatedAt: new Date().toISOString() };
}
function samePassword(password, record) {
  if (!record || !record.salt || !record.hash) return false;
  const candidate = Buffer.from(hashPassword(password, record.salt), 'hex');
  const stored = Buffer.from(record.hash, 'hex');
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
}
function sameSecret(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

/* ------------------------------------------------------------- sessions */
const SESSION_COOKIE = 'lb_admin';

async function createSession(req, res, meta) {
  const token = crypto.randomBytes(24).toString('hex');
  await setJSON('lb:sess:' + token, Object.assign({ created: Date.now() }, meta || {}), SESSION_TTL);
  writeCookie(req, res, SESSION_COOKIE, token, SESSION_TTL);
  return token;
}

async function readSession(req) {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token || !/^[a-f0-9]{48}$/.test(token)) return null;
  const session = await getJSON('lb:sess:' + token);
  return session ? Object.assign({ token: token }, session) : null;
}

async function destroySession(req, res) {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) await cmd('DEL', 'lb:sess:' + token);
  writeCookie(req, res, SESSION_COOKIE, '', 0);
}

/* Admin gate. Mutations must also carry the X-LB-Admin header, which a
   cross-site form post cannot set — belt and braces next to SameSite=Strict.
   Sessions carry the password version, so changing the password signs every
   other device out. */
async function requireAdmin(req, res) {
  const session = await readSession(req);
  if (!session) { fail(res, 401, 'Not signed in'); return null; }
  const record = await getJSON(AUTH_KEY);
  if (record && Number(session.v || 0) !== Number(record.version || 1)) {
    fail(res, 401, 'Session expired — the password was changed');
    return null;
  }
  const method = (req.method || 'GET').toUpperCase();
  if (method !== 'GET' && req.headers['x-lb-admin'] !== '1') {
    fail(res, 403, 'Missing admin header');
    return null;
  }
  return session;
}

/* ------------------------------------------------------------- misc */
const CONTENT_KEY = 'lb:content';
const CONTENT_PREV_KEY = 'lb:content:prev';
const AUTH_KEY = 'lb:auth';

function orderId() {
  const stamp = Date.now().toString(36).slice(-5).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return 'LB-' + stamp + rand;
}

const clean = (value, max) => String(value == null ? '' : value).trim().slice(0, max || 200);

function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      const message = err && err.message ? err.message : 'Server error';
      console.error('[lovebirds]', message);
      if (!res.headersSent) fail(res, 500, message);
    }
  };
}

module.exports = {
  connected, cmd, getJSON, setJSON,
  json, ok, fail, readBody, clientIp, readCookie, writeCookie,
  rateLimit, clearRateLimit, LOGIN_WINDOW, LOGIN_MAX, ORDER_WINDOW, ORDER_MAX,
  hashPassword, makePassword, samePassword, sameSecret,
  createSession, readSession, destroySession, requireAdmin, SESSION_TTL,
  CONTENT_KEY, CONTENT_PREV_KEY, AUTH_KEY, orderId, clean, handle
};
