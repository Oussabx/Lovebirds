'use strict';
/* ==========================================================================
   WhatsApp notification when an order arrives.

   Works with whichever provider you have configured, checked in this order:

   1. WhatsApp Cloud API (Meta — the official route)
        WHATSAPP_TOKEN          permanent access token
        WHATSAPP_PHONE_ID       the phone number id from Meta
        WHATSAPP_TEMPLATE       optional template name (needed for messages
                                sent outside a 24-hour conversation window)
        WHATSAPP_TEMPLATE_LANG  optional, defaults to en
        WHATSAPP_API_BASE       optional, for a BSP or on-premises endpoint
   2. Twilio
        TWILIO_ACCOUNT_SID
        TWILIO_AUTH_TOKEN
        TWILIO_WHATSAPP_FROM    e.g. +14155238886
   3. CallMeBot (free, third-party, personal numbers only)
        CALLMEBOT_API_KEY

   In every case the message goes to WHATSAPP_NOTIFY_TO, falling back to the
   shop's own WhatsApp number from the dashboard. Nothing is sent if no
   provider is configured — orders are unaffected either way.
   ========================================================================== */

const TIMEOUT_MS = 4500;
const digits = (value) => String(value || '').replace(/\D/g, '');

function detect(settings) {
  const target = digits(process.env.WHATSAPP_NOTIFY_TO || (settings && settings.whatsapp) || '');
  const base = { to: target, ready: false, provider: null, reason: '' };

  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) base.provider = 'meta';
  else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) base.provider = 'twilio';
  else if (process.env.CALLMEBOT_API_KEY) base.provider = 'callmebot';

  if (!base.provider) {
    base.reason = 'No WhatsApp provider is configured yet.';
    return base;
  }
  if (!target) {
    base.reason = 'No number to send to. Set WHATSAPP_NOTIFY_TO, or add your WhatsApp number in Shop settings.';
    return base;
  }
  base.ready = true;
  return base;
}

function withTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('The provider did not answer in time.')), TIMEOUT_MS))
  ]);
}

async function readError(res) {
  const body = await res.text().catch(() => '');
  try {
    const parsed = JSON.parse(body);
    const message = (parsed.error && (parsed.error.message || parsed.error.error_user_msg)) || parsed.message;
    if (message) return message;
  } catch (e) {}
  return body.slice(0, 240) || ('provider returned ' + res.status);
}

/* ------------------------------------------------------------- providers */
async function sendMeta(to, text, parts) {
  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
  const base = (process.env.WHATSAPP_API_BASE || 'https://graph.facebook.com').replace(/\/$/, '');
  const url = base + '/' + version + '/' + process.env.WHATSAPP_PHONE_ID + '/messages';
  const template = process.env.WHATSAPP_TEMPLATE;

  const payload = template
    ? {
        messaging_product: 'whatsapp', to: to, type: 'template',
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
          components: [{ type: 'body', parameters: parts.map(value => ({ type: 'text', text: String(value) })) }]
        }
      }
    : { messaging_product: 'whatsapp', to: to, type: 'text', text: { preview_url: false, body: text } };

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.WHATSAPP_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await readError(res));
  return 'meta';
}

async function sendTwilio(to, text) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const url = 'https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json';
  const form = new URLSearchParams({
    From: 'whatsapp:+' + digits(process.env.TWILIO_WHATSAPP_FROM),
    To: 'whatsapp:+' + to,
    Body: text
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(sid + ':' + process.env.TWILIO_AUTH_TOKEN).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  });
  if (!res.ok) throw new Error(await readError(res));
  return 'twilio';
}

async function sendCallMeBot(to, text) {
  const url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent('+' + to) +
    '&apikey=' + encodeURIComponent(process.env.CALLMEBOT_API_KEY) +
    '&text=' + encodeURIComponent(text);
  const res = await fetch(url);
  const body = await res.text().catch(() => '');
  if (!res.ok || /error|APIKey|not found/i.test(body.slice(0, 200))) {
    throw new Error(body.slice(0, 240) || ('provider returned ' + res.status));
  }
  return 'callmebot';
}

/* ------------------------------------------------------------- message */
function money(amount, settings) {
  const value = (Number(amount) || 0).toFixed(2);
  const symbol = (settings && settings.currency) || '$';
  return (settings && settings.currencyPosition === 'after') ? value + ' ' + symbol : symbol + value;
}

function buildMessage(order, settings) {
  const options = (settings && settings.notifications) || {};
  const items = (order.lines || []).reduce((n, line) => n + line.qty, 0);
  const shop = (settings && settings.brand) || 'lovebirds';

  const lines = [
    '🕊️ New ' + shop + ' order ' + order.id,
    (order.lines || []).map(l => l.qty + '× ' + l.name).join(', '),
    items + (items === 1 ? ' item · ' : ' items · ') + money(order.total, settings) + ' · ' + order.payment
  ];

  if (options.includeCustomer !== false) {
    const c = order.customer || {};
    lines.push('—');
    lines.push(c.firstName + ' ' + c.lastName);
    lines.push([c.address, c.apartment, c.city, c.country].filter(Boolean).join(', '));
    lines.push(c.phone);
    if (order.note) lines.push('Card note: ' + order.note);
  }

  return {
    text: lines.filter(Boolean).join('\n'),
    parts: [order.id, (order.customer || {}).firstName + ' ' + (order.customer || {}).lastName, money(order.total, settings)]
  };
}

/* ------------------------------------------------------------- send */
async function notifyOrder(order, settings) {
  const options = (settings && settings.notifications) || {};
  if (options.whatsappEnabled === false) return { sent: false, skipped: 'switched off in the dashboard' };

  const status = detect(settings);
  if (!status.ready) return { sent: false, skipped: status.reason };

  const message = buildMessage(order, settings);
  try {
    const provider = await withTimeout(
      status.provider === 'meta' ? sendMeta(status.to, message.text, message.parts)
        : status.provider === 'twilio' ? sendTwilio(status.to, message.text)
        : sendCallMeBot(status.to, message.text)
    );
    return { sent: true, provider: provider };
  } catch (err) {
    console.error('[lovebirds] WhatsApp notification failed:', err.message);
    return { sent: false, provider: status.provider, error: err.message };
  }
}

async function sendTest(settings) {
  const status = detect(settings);
  if (!status.ready) throw new Error(status.reason);
  const text = 'Test message from your ' + ((settings && settings.brand) || 'lovebirds') +
    ' dashboard. If you can read this, order alerts will reach you.';
  await withTimeout(
    status.provider === 'meta' ? sendMeta(status.to, text, ['TEST', 'Test order', money(0, settings)])
      : status.provider === 'twilio' ? sendTwilio(status.to, text)
      : sendCallMeBot(status.to, text)
  );
  return status;
}

module.exports = { detect, notifyOrder, sendTest, buildMessage };
