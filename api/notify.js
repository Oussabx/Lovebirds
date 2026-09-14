'use strict';
/* Notification settings check and test send — dashboard only. */
const L = require('./_lib');
const DEFAULTS = require('./_defaults');
const notify = require('./_notify');

async function settings() {
  const stored = await L.getJSON(L.CONTENT_KEY);
  const content = (stored && stored.content) || DEFAULTS;
  return content.settings || {};
}

const mask = (number) => {
  const value = String(number || '');
  if (value.length < 5) return value;
  return value.slice(0, 3) + '•'.repeat(Math.max(0, value.length - 6)) + value.slice(-3);
};

const NAMES = { meta: 'WhatsApp Cloud API (Meta)', twilio: 'Twilio', callmebot: 'CallMeBot' };

module.exports = L.handle(async (req, res) => {
  const method = (req.method || 'GET').toUpperCase();
  const session = await L.requireAdmin(req, res);
  if (!session) return;

  const current = await settings();
  const status = notify.detect(current);

  if (method === 'GET') {
    return L.ok(res, {
      ready: status.ready,
      provider: status.provider,
      providerName: status.provider ? NAMES[status.provider] : null,
      to: mask(status.to),
      reason: status.reason,
      enabled: !(current.notifications && current.notifications.whatsappEnabled === false)
    });
  }

  if (method === 'POST') {
    try {
      const result = await notify.sendTest(current);
      return L.ok(res, { sent: true, provider: NAMES[result.provider], to: mask(result.to) });
    } catch (err) {
      return L.fail(res, 400, err.message);
    }
  }

  return L.fail(res, 405, 'Method not allowed');
});
