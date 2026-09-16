'use strict';
/* Orders: the storefront creates them, the dashboard reads and updates them.
   Prices are always recomputed here from the catalogue — never trusted from
   the browser. */
const L = require('./_lib');
const DEFAULTS = require('./_defaults');
const notify = require('./_notify');

const STATUSES = ['new', 'confirmed', 'packed', 'delivered', 'cancelled'];
const INDEX = 'lb:orders';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function activeContent() {
  const stored = await L.getJSON(L.CONTENT_KEY);
  return (stored && stored.content) || DEFAULTS;
}

function money(n) { return Math.round(Number(n) * 100) / 100; }

module.exports = L.handle(async (req, res) => {
  const method = (req.method || 'GET').toUpperCase();
  const url = new URL(req.url, 'http://localhost');

  /* ------------------------------------------------------------- create */
  if (method === 'POST') {
    const ip = L.clientIp(req);
    const limit = await L.rateLimit('order', ip, L.ORDER_MAX, L.ORDER_WINDOW);
    if (!limit.allowed) return L.fail(res, 429, 'Too many orders from this connection. Please contact us directly.');

    const body = await L.readBody(req);
    const customerIn = body.customer || {};
    const itemsIn = Array.isArray(body.items) ? body.items : [];

    if (!itemsIn.length) return L.fail(res, 400, 'Your cart is empty.');
    if (itemsIn.length > 50) return L.fail(res, 400, 'Too many items in one order.');

    const customer = {
      country: L.clean(customerIn.country, 60),
      firstName: L.clean(customerIn.firstName, 60),
      lastName: L.clean(customerIn.lastName, 60),
      address: L.clean(customerIn.address, 200),
      apartment: L.clean(customerIn.apartment, 120),
      city: L.clean(customerIn.city, 80),
      phone: L.clean(customerIn.phone, 40),
      email: L.clean(customerIn.email, 120)
    };
    const required = ['country', 'firstName', 'lastName', 'address', 'city', 'phone', 'email'];
    const missing = required.filter(k => !customer[k]);
    if (missing.length) return L.fail(res, 400, 'Missing delivery details: ' + missing.join(', '));
    if (!EMAIL.test(customer.email)) return L.fail(res, 400, 'That email address does not look right.');
    if (customer.phone.replace(/\D/g, '').length < 6) return L.fail(res, 400, 'That phone number does not look right.');

    const content = await activeContent();
    const settings = content.settings || {};
    const catalogue = {};
    (content.products || []).forEach(p => { catalogue[p.id] = p; });

    const lines = [];
    for (const item of itemsIn) {
      const product = catalogue[String(item.id)];
      if (!product || product.active === false) return L.fail(res, 400, 'One of the gifts is no longer available.');
      const qty = Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1));
      const price = money(product.price);
      lines.push({ id: product.id, name: product.name, qty: qty, price: price, total: money(price * qty) });
    }

    const subtotal = money(lines.reduce((sum, line) => sum + line.total, 0));
    const threshold = Number(settings.freeShippingOver || 0);
    const flat = Number(settings.shippingFlat || 0);
    const shipping = (threshold && subtotal >= threshold) ? 0 : money(flat);

    const order = {
      id: L.orderId(),
      placedAt: new Date().toISOString(),
      status: 'new',
      payment: settings.paymentNote || 'Cash on delivery',
      currency: settings.currency || '$',
      customer: customer,
      note: L.clean(body.note, 400),
      lines: lines,
      subtotal: subtotal,
      shipping: shipping,
      total: money(subtotal + shipping),
      adminNote: ''
    };

    /* Store first so an order is never lost to a slow notification. */
    await L.setJSON('lb:order:' + order.id, order);
    await L.cmd('ZADD', INDEX, Date.now(), order.id);

    const notice = await notify.notifyOrder(order, settings);
    if (notice.sent || notice.error) {
      order.notified = notice;
      await L.setJSON('lb:order:' + order.id, order);
    }

    /* Whether the shop's WhatsApp alert went through — and whatever the
       provider said if it did not — is for the dashboard, not the customer. */
    const receipt = Object.assign({}, order);
    delete receipt.notified;
    delete receipt.adminNote;
    return L.ok(res, { order: receipt });
  }

  /* ------------------------------------------------------------- list */
  if (method === 'GET') {
    const session = await L.requireAdmin(req, res);
    if (!session) return;

    const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit'), 10) || 200));
    const ids = (await L.cmd('ZRANGE', INDEX, 0, limit - 1, 'REV')) || [];
    if (!ids.length) return L.ok(res, { orders: [], total: 0 });

    const raw = await L.cmd('MGET', ...ids.map(id => 'lb:order:' + id));
    const orders = (raw || []).map(entry => {
      try { return JSON.parse(entry); } catch (e) { return null; }
    }).filter(Boolean);

    return L.ok(res, { orders: orders, total: await L.cmd('ZCARD', INDEX) });
  }

  /* ------------------------------------------------------------- update */
  if (method === 'PATCH') {
    const session = await L.requireAdmin(req, res);
    if (!session) return;

    const body = await L.readBody(req);
    const id = L.clean(body.id, 40);
    if (!id) return L.fail(res, 400, 'Which order?');

    const order = await L.getJSON('lb:order:' + id);
    if (!order) return L.fail(res, 404, 'That order no longer exists.');

    if (body.status != null) {
      const status = String(body.status);
      if (STATUSES.indexOf(status) === -1) return L.fail(res, 400, 'Unknown status');
      order.status = status;
    }
    if (body.adminNote != null) order.adminNote = L.clean(body.adminNote, 600);
    order.updatedAt = new Date().toISOString();

    await L.setJSON('lb:order:' + id, order);
    return L.ok(res, { order: order });
  }

  /* ------------------------------------------------------------- delete */
  if (method === 'DELETE') {
    const session = await L.requireAdmin(req, res);
    if (!session) return;

    const id = L.clean(url.searchParams.get('id'), 40);
    if (!id) return L.fail(res, 400, 'Which order?');
    await L.cmd('DEL', 'lb:order:' + id);
    await L.cmd('ZREM', INDEX, id);
    return L.ok(res, { deleted: id });
  }

  return L.fail(res, 405, 'Method not allowed');
});
