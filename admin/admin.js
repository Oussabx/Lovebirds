/* ==========================================================================
   lovebirds — dashboard
   Everything on the storefront is edited here and saved to /api/content.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (value) => String(value == null ? '' : value)
    .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const SVG = (p) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  const ICON = {
    grid: SVG('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'),
    bag: SVG('<path d="M4.2 8h15.6l-1 12.4a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8Z"/><path d="M8.6 8V6.2a3.4 3.4 0 1 1 6.8 0V8"/>'),
    gift: SVG('<path d="M3.5 9.5h17v3h-17z"/><path d="M4.8 12.5h14.4v8H4.8z"/><path d="M12 9.5v11"/><path d="M12 9.5S10.3 4 7.8 4a2.3 2.3 0 0 0 0 5.5ZM12 9.5S13.7 4 16.2 4a2.3 2.3 0 0 1 0 5.5Z"/>'),
    tag: SVG('<path d="M3.5 11.2V4.5a1 1 0 0 1 1-1h6.7L20.5 12l-8 8Z"/><circle cx="8" cy="8" r="1.4"/>'),
    text: SVG('<path d="M5 6.5h14M5 12h10M5 17.5h7"/>'),
    brush: SVG('<path d="M5 16c0-2 1.5-3 3-3 2 0 3 1.2 3 3s-1 4-4 4c-2 0-3-1-3-2 1 0 1-2 1-2Z"/><path d="M11.5 14 20 5.5a1.8 1.8 0 0 0-2.5-2.5L9 11.5"/>'),
    cog: SVG('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M4.7 7.3 7 8.6M17 15.4l2.3 1.3M4.7 16.7 7 15.4M17 8.6l2.3-1.3"/>'),
    image: SVG('<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4.5 17 4.7-4.4 3.4 3 2.7-2.3 4.2 3.7"/>'),
    key: SVG('<circle cx="8.5" cy="12" r="3.8"/><path d="M12.3 12H21l-1.6 2.4L17.8 12"/>'),
    trash: SVG('<path d="M4.5 6.5h15M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5M6.5 6.5 7.4 20a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-13.5"/>'),
    edit: SVG('<path d="M4 20h4L19.5 8.5a2.6 2.6 0 0 0-3.7-3.7L4.3 16.4Z"/><path d="m15 6 3.7 3.7"/>'),
    copy: SVG('<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2"/>'),
    up: SVG('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    down: SVG('<path d="M12 5v14M18 13l-6 6-6-6"/>'),
    close: SVG('<path d="M6 6l12 12M18 6 6 18"/>'),
    plus: SVG('<path d="M12 5v14M5 12h14"/>'),
    refresh: SVG('<path d="M20 11a8 8 0 1 0-1.2 5.3"/><path d="M20 5.5V11h-5.5"/>'),
    chevron: SVG('<path d="M6 9l6 6 6-6"/>'),
    chat: SVG('<path d="M21 11.5a8.4 8.4 0 0 1-11.9 7.6L3.4 21l1.9-5.6A8.4 8.4 0 1 1 21 11.5Z"/>'),
    download: SVG('<path d="M12 4v11M7.5 11 12 15.5 16.5 11"/><path d="M5 19.5h14"/>')
  };

  const VIEWS = [
    { id: 'overview',   label: 'Overview',       icon: ICON.grid },
    { id: 'orders',     label: 'Orders',         icon: ICON.bag },
    { id: 'products',   label: 'Products',       icon: ICON.gift },
    { id: 'categories', label: 'Categories',     icon: ICON.tag },
    { id: 'content',    label: 'Text & pages',   icon: ICON.text },
    { id: 'appearance', label: 'Appearance',     icon: ICON.brush },
    { id: 'settings',   label: 'Shop settings',  icon: ICON.cog },
    { id: 'media',      label: 'Images',         icon: ICON.image },
    { id: 'account',    label: 'Account & backup', icon: ICON.key }
  ];

  const SUBTITLES = {
    overview: 'How the shop is doing today',
    orders: 'Everything customers have sent you',
    products: 'The gifts in your shop',
    categories: 'How gifts are grouped',
    content: 'Every word on the site',
    appearance: 'Colours, fonts and corners',
    settings: 'Delivery, payment, contact details',
    media: 'Pictures you have uploaded',
    account: 'Password, backups and resets'
  };

  const state = {
    content: null,
    saved: '',
    orders: [],
    images: [],
    view: 'overview',
    store: 'redis',
    hasContent: false,
    orderFilter: 'all',
    productSearch: '',
    openSections: {}
  };

  /* ------------------------------------------------------------- paths */
  function getPath(object, path) {
    return String(path).split('.').reduce((node, key) => (node == null ? undefined : node[key]), object);
  }
  const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];

  function setPath(object, path, value) {
    const parts = String(path).split('.');
    if (parts.some(part => UNSAFE_KEYS.indexOf(part) > -1)) return;
    let node = object;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (node[key] == null || typeof node[key] !== 'object') node[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      node = node[key];
    }
    node[parts[parts.length - 1]] = value;
  }
  const clone = (value) => JSON.parse(JSON.stringify(value));

  /* ------------------------------------------------------------- api */
  async function api(path, options) {
    const opts = Object.assign({ credentials: 'same-origin' }, options || {});
    opts.headers = Object.assign({ 'X-LB-Admin': '1' }, opts.headers || {});
    if (opts.body && typeof opts.body !== 'string') {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(path, opts);
    let payload = null;
    try { payload = await res.json(); } catch (e) { payload = null; }
    if (res.status === 401 && !opts.skipGate) {
      openGate('Your session ended. Please sign in again.');
      throw new Error('Signed out');
    }
    if (!res.ok || !payload || payload.ok === false) {
      throw new Error((payload && payload.error) || ('Something went wrong (' + res.status + ')'));
    }
    if (payload.store) state.store = payload.store;
    return payload;
  }

  /* ------------------------------------------------------------- chrome */
  function toast(message, kind) {
    const box = $('[data-toasts]');
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast--' + kind : '');
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  function money(value) {
    const settings = (state.content && state.content.settings) || {};
    const amount = (Number(value) || 0).toFixed(2);
    return settings.currencyPosition === 'after'
      ? amount + ' ' + (settings.currency || '$')
      : (settings.currency || '$') + amount;
  }

  const dirty = () => state.content && JSON.stringify(state.content) !== state.saved;

  function refreshSaveState() {
    const isDirty = dirty();
    $('[data-save]').disabled = !isDirty;
    $('[data-discard]').hidden = !isDirty || !state.hasContent;
    $('[data-saved]').hidden = isDirty || !state.hasContent;
  }

  function markDirty() { refreshSaveState(); }

  let modalReturn = null;

  function modal(html, onOpen) {
    const host = $('[data-modal]');
    modalReturn = document.activeElement;
    host.innerHTML = '<div class="modal__card" role="dialog" aria-modal="true" tabindex="-1">' + html + '</div>';
    host.hidden = false;
    host.onclick = (e) => { if (e.target === host) closeModal(); };
    document.addEventListener('keydown', modalKeys);
    if (onOpen) onOpen(host);
    const card = $('.modal__card', host);
    const first = card.querySelector('input:not([type=hidden]), textarea, select, button');
    (first || card).focus();
  }

  function closeModal() {
    const host = $('[data-modal]');
    if (host.hidden) return;
    host.hidden = true;
    host.innerHTML = '';
    document.removeEventListener('keydown', modalKeys);
    if (modalReturn && modalReturn.focus) modalReturn.focus();
    modalReturn = null;
  }

  function modalKeys(e) {
    if (e.key === 'Escape') return closeModal();
    if (e.key !== 'Tab') return;
    const card = $('.modal__card');
    if (!card) return;
    const focusable = Array.from(card.querySelectorAll('a[href], button:not([disabled]), input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function confirmAction(message, onYes, danger) {
    modal([
      '<div class="modal__head"><h2>Are you sure?</h2></div>',
      '<p style="margin-bottom:22px">' + esc(message) + '</p>',
      '<div style="display:flex;gap:10px;justify-content:flex-end">',
      '<button class="btn btn--ghost" data-no>Cancel</button>',
      '<button class="btn ' + (danger ? 'btn--danger' : '') + '" data-yes>Yes, do it</button>',
      '</div>'
    ].join(''), (host) => {
      $('[data-no]', host).onclick = closeModal;
      $('[data-yes]', host).onclick = () => { closeModal(); onYes(); };
    });
  }

  /* ------------------------------------------------------------- login */
  function openGate(message) {
    $('[data-app]').hidden = true;
    $('[data-gate]').hidden = false;
    const error = $('[data-login-error]');
    if (message) { error.textContent = message; error.hidden = false; }
    const input = $('[data-login] input');
    if (input) { input.value = ''; input.focus(); }
  }

  async function checkSession() {
    try {
      const info = await fetch('/api/auth', { credentials: 'same-origin' }).then(r => r.json());
      if (info && info.store) state.store = info.store;
      if (info && info.authed) return true;
      if (info && info.configured === false) {
        $('[data-login-hint]').innerHTML =
          'No admin password is set yet. In Vercel open <strong>Settings → Environment Variables</strong>, add <strong>ADMIN_PASSWORD</strong>, then redeploy.';
        $('[data-login-hint]').hidden = false;
      }
    } catch (e) {
      $('[data-login-hint]').textContent = 'The dashboard API is not responding. Is the site deployed with its /api folder?';
      $('[data-login-hint]').hidden = false;
    }
    return false;
  }

  function initLogin() {
    $('[data-login]').addEventListener('submit', async (e) => {
      e.preventDefault();
      const button = $('[data-login-submit]');
      const error = $('[data-login-error]');
      const password = e.target.elements.password.value;
      button.disabled = true;
      button.textContent = 'Signing in…';
      error.hidden = true;
      try {
        const result = await api('/api/auth', { method: 'POST', skipGate: true, body: { action: 'login', password: password } });
        $('[data-gate]').hidden = true;
        await window.__LBADMIN.boot();
        if (result.weak) toast('That password is quite short — consider a longer one in Account.', 'bad');
      } catch (err) {
        error.textContent = err.message;
        error.hidden = false;
      } finally {
        button.disabled = false;
        button.textContent = 'Sign in';
      }
    });
  }

  /* ------------------------------------------------------------- loading */
  async function loadContent() {
    const payload = await api('/api/content?fresh=1');
    state.hasContent = Boolean(payload.content);
    state.content = payload.content ? payload.content : clone(window.LB_DEFAULT_CONTENT);
    state.saved = payload.content ? JSON.stringify(payload.content) : '';
  }

  async function loadOrders() {
    try {
      const payload = await api('/api/orders?limit=300');
      state.orders = payload.orders || [];
    } catch (e) { state.orders = []; }
  }

  async function loadImages() {
    try {
      const payload = await api('/api/media');
      state.images = payload.images || [];
    } catch (e) { state.images = []; }
  }

  function contentProblems(content) {
    const problems = [];
    [['products', 'product'], ['categories', 'category']].forEach(([key, word]) => {
      const seen = {};
      (content[key] || []).forEach((entry, i) => {
        const name = entry.name || (word + ' ' + (i + 1));
        if (!entry.id || !String(entry.id).trim()) problems.push('“' + name + '” needs a web address id.');
        else if (seen[entry.id]) problems.push('Two ' + key + ' share the id “' + entry.id + '” — ids must be unique.');
        else if (!/^[a-zA-Z0-9._~-]+$/.test(entry.id)) problems.push('The id “' + entry.id + '” can only use letters, numbers and dashes.');
        seen[entry.id] = true;
        if (key === 'products' && entry.price != null && (isNaN(Number(entry.price)) || Number(entry.price) < 0)) {
          problems.push('“' + name + '” needs a price of zero or more.');
        }
      });
    });
    const categoryIds = (content.categories || []).map(c => c.id);
    (content.products || []).forEach(product => {
      if (product.category && categoryIds.indexOf(product.category) === -1) {
        problems.push('“' + (product.name || product.id) + '” points at a category that no longer exists.');
      }
    });
    return problems;
  }

  async function save() {
    const problems = contentProblems(state.content);
    if (problems.length) {
      toast(problems[0], 'bad');
      return;
    }
    const button = $('[data-save]');
    button.disabled = true;
    button.textContent = 'Saving…';
    try {
      await api('/api/content', { method: 'PUT', body: { content: state.content } });
      state.saved = JSON.stringify(state.content);
      state.hasContent = true;
      toast('Saved — the shop is updated', 'good');
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      button.textContent = 'Save changes';
      refreshSaveState();
      renderSidebar();
    }
  }

  /* ------------------------------------------------------------- shell */
  function renderSidebar() {
    const newOrders = state.orders.filter(o => o.status === 'new').length;
    $('[data-nav]').innerHTML = VIEWS.map(view => [
      '<button class="side__item' + (view.id === state.view ? ' is-active' : '') + '" data-go="' + view.id + '">',
      view.icon, '<span>' + view.label + '</span>',
      view.id === 'orders' && newOrders ? '<span class="pill">' + newOrders + '</span>' : '',
      '</button>'
    ].join('')).join('');
  }

  function go(id) {
    state.view = id;
    location.hash = '#/' + id;
    document.body.classList.remove('side-open');
    renderSidebar();
    render();
  }

  function render() {
    const view = VIEWS.find(v => v.id === state.view) || VIEWS[0];
    $('[data-view-title]').textContent = view.label;
    $('[data-view-sub]').textContent = SUBTITLES[view.id] || '';

    const banner = $('[data-store-banner]');
    if (state.store === 'ephemeral') {
      banner.hidden = false;
      banner.innerHTML = '<strong>Demo mode — no database connected.</strong> Changes will disappear when the server restarts. ' +
        'Add a KV / Upstash Redis store to the project in Vercel (Storage → Create), then redeploy.';
    } else if (!state.hasContent) {
      banner.hidden = false;
      banner.className = 'banner banner--info';
      banner.innerHTML = 'You are looking at the starting content. Press <strong>Save changes</strong> to publish it, then edit away.';
    } else {
      banner.hidden = true;
      banner.className = 'banner banner--warn';
    }

    const views = window.__LBADMIN.views || {};
    if (state.view === 'content' && views.refreshCms && $('[data-cms-editor]')) {
      views.refreshCms();
      refreshSaveState();
      return;
    }
    $('[data-view]').innerHTML = (views[state.view] || viewOverview)();
    refreshSaveState();
    if (views.afterRender) views.afterRender(state.view);
  }

  /* ------------------------------------------------------------- overview */
  function viewOverview() {
    const orders = state.orders;
    const whatsapp = (state.content && state.content.settings && state.content.settings.whatsapp) || '';
    const live = orders.filter(o => o.status !== 'cancelled');
    const revenue = live.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const newCount = orders.filter(o => o.status === 'new').length;
    const average = live.length ? revenue / live.length : 0;
    const week = Date.now() - 7 * 864e5;
    const weekOrders = orders.filter(o => new Date(o.placedAt).getTime() > week);

    const recent = orders.slice(0, 6).map(order => [
      '<button class="list__row" data-order="' + esc(order.id) + '" style="width:100%;text-align:left">',
      '<div class="list__main"><div class="list__title">' + esc(order.customer.firstName + ' ' + order.customer.lastName) + ' · ' + esc(order.id) + '</div>',
      '<div class="list__meta">' + esc(order.customer.city) + ' · ' + new Date(order.placedAt).toLocaleDateString() + '</div></div>',
      '<span class="status status--' + esc(order.status) + '">' + esc(order.status) + '</span>',
      '<strong style="margin-left:12px">' + money(order.total) + '</strong>',
      '</button>'
    ].join('')).join('');

    return [
      '<div class="grid grid--stats">',
      stat('Orders', orders.length, orders.length ? newCount + ' waiting for you' : 'No orders yet'),
      stat('Revenue', money(revenue), 'Excluding cancelled'),
      stat('This week', weekOrders.length, weekOrders.length === 1 ? 'order' : 'orders'),
      stat('Average order', money(average), 'Per order'),
      '</div>',

      '<div class="card" style="margin-top:18px">',
      '<div class="card__head"><h2>Latest orders</h2>',
      '<button class="btn btn--ghost btn--sm" data-go="orders">See all</button></div>',
      orders.length ? '<div class="list">' + recent + '</div>'
        : '<div class="empty"><h3>No orders yet</h3><p>When someone checks out, their order lands here.</p></div>',
      '</div>',

      '<div class="card">',
      '<div class="card__head"><h2>Your shop right now</h2></div>',
      '<div class="grid grid--2">',
      '<div><div class="stat__label">Gifts on sale</div><div class="stat__value">' + (state.content.products || []).filter(p => p.active !== false).length + '</div>',
      '<p class="card__sub">' + (state.content.products || []).length + ' in the catalogue · ' + (state.content.categories || []).length + ' categories</p></div>',
      '<div><div class="stat__label">WhatsApp</div><div class="stat__value" style="font-size:1.3rem;margin-top:14px">' +
        (whatsapp ? esc(whatsapp) : 'Not set') + '</div>',
      '<p class="card__sub">' + (whatsapp ? 'Chat buttons are live' : 'Add a number in Shop settings to switch the chat buttons on') + '</p></div>',
      '</div>',
      '<div class="btn-row" style="margin-top:20px">',
      '<button class="btn btn--sm" data-go="products">Add or edit gifts</button>',
      '<button class="btn btn--ghost btn--sm" data-go="content">Edit the words</button>',
      '<button class="btn btn--ghost btn--sm" data-go="appearance">Change the colours</button>',
      '</div></div>'
    ].join('');
  }

  function stat(label, value, note) {
    return '<div class="stat"><div class="stat__label">' + esc(label) + '</div>' +
      '<div class="stat__value">' + esc(value) + '</div>' +
      '<div class="stat__note">' + esc(note || '') + '</div></div>';
  }

  /* ------------------------------------------------------------- orders */
  const STATUSES = ['new', 'confirmed', 'packed', 'delivered', 'cancelled'];

  function viewOrders() {
    const counts = { all: state.orders.length };
    STATUSES.forEach(s => { counts[s] = state.orders.filter(o => o.status === s).length; });
    const list = state.orderFilter === 'all'
      ? state.orders
      : state.orders.filter(o => o.status === state.orderFilter);

    const tabs = ['all'].concat(STATUSES).map(id =>
      '<button class="tab' + (state.orderFilter === id ? ' is-active' : '') + '" data-order-filter="' + id + '">' +
      (id === 'all' ? 'All' : id.charAt(0).toUpperCase() + id.slice(1)) + ' (' + (counts[id] || 0) + ')</button>'
    ).join('');

    const rows = list.map(order => [
      '<div class="list__row">',
      '<div class="list__main">',
      '<div class="list__title">' + esc(order.customer.firstName + ' ' + order.customer.lastName) + ' · <span style="color:var(--muted)">' + esc(order.id) + '</span></div>',
      '<div class="list__meta">' + esc(order.customer.city + ', ' + order.customer.country) + ' · ' +
        (order.lines || []).reduce((n, l) => n + l.qty, 0) + ' items · ' +
        new Date(order.placedAt).toLocaleString() + '</div>',
      '</div>',
      '<span class="status status--' + esc(order.status) + '">' + esc(order.status) + '</span>',
      '<strong style="min-width:84px;text-align:right">' + money(order.total) + '</strong>',
      '<div class="list__actions"><button class="iconbtn" data-order="' + esc(order.id) + '" title="Open">' + ICON.edit + '</button></div>',
      '</div>'
    ].join('')).join('');

    return [
      '<div class="card">',
      '<div class="card__head"><h2>Orders</h2>',
      '<button class="btn btn--ghost btn--sm" data-orders-csv>' + ICON.download + ' Export CSV</button>',
      '<button class="btn btn--ghost btn--sm" data-orders-refresh style="margin-left:8px">' + ICON.refresh + ' Refresh</button></div>',
      '<div class="tabs">' + tabs + '</div>',
      list.length ? '<div class="list">' + rows + '</div>'
        : '<div class="empty"><h3>Nothing here</h3><p>No orders with this status yet.</p></div>',
      '</div>'
    ].join('');
  }

  function openOrder(id) {
    const order = state.orders.find(o => o.id === id);
    if (!order) return;
    const c = order.customer;
    const address = [c.firstName + ' ' + c.lastName, c.address, c.apartment, c.city, c.country, c.phone].filter(Boolean).join('\n');
    const wa = (c.phone || '').replace(/\D/g, '');

    modal([
      '<div class="modal__head"><div><h2>' + esc(order.id) + '</h2>',
      '<p class="card__sub">' + new Date(order.placedAt).toLocaleString() + ' · ' + esc(order.payment) + '</p></div>',
      '<button class="iconbtn" data-close aria-label="Close">' + ICON.close + '</button></div>',

      '<div class="tabs">' + STATUSES.map(s =>
        '<button class="tab' + (order.status === s ? ' is-active' : '') + '" data-set-status="' + s + '">' +
        s.charAt(0).toUpperCase() + s.slice(1) + '</button>').join('') + '</div>',

      '<div class="grid grid--2" style="margin-bottom:18px">',
      '<div class="card" style="padding:16px"><div class="stat__label">Deliver to</div>',
      '<p style="white-space:pre-line;margin:8px 0 12px">' + esc(address) + '</p>',
      '<div class="btn-row">',
      '<button class="btn btn--ghost btn--tiny" data-copy="' + esc(address).replace(/\n/g, '&#10;') + '">Copy address</button>',
      wa ? '<a class="btn btn--ghost btn--tiny" href="https://wa.me/' + esc(wa) + '" target="_blank" rel="noopener">WhatsApp</a>' : '',
      '<a class="btn btn--ghost btn--tiny" href="tel:' + esc(c.phone) + '">Call</a>',
      '</div></div>',
      '<div class="card" style="padding:16px"><div class="stat__label">Contact</div>',
      '<p style="margin:8px 0"><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a><br>' + esc(c.phone) + '</p>',
      order.note ? '<div class="stat__label" style="margin-top:12px">Note for the card</div><p style="margin-top:6px">' + esc(order.note) + '</p>' : '',
      order.notified ? '<div class="stat__label" style="margin-top:12px">WhatsApp alert</div><p style="margin-top:6px;font-size:.86rem">' +
        (order.notified.sent ? 'Sent to you via ' + esc(order.notified.provider) : 'Not sent — ' + esc(order.notified.error || order.notified.skipped || 'unknown reason')) +
        '</p>' : '',
      '</div></div>',

      '<div class="card" style="padding:16px;margin-bottom:18px"><div class="stat__label">Items</div>',
      '<div class="list" style="margin-top:10px">',
      (order.lines || []).map(l => '<div class="list__row"><div class="list__main"><div class="list__title">' + esc(l.name) + '</div>' +
        '<div class="list__meta">' + money(l.price) + ' × ' + l.qty + '</div></div><strong>' + money(l.total) + '</strong></div>').join(''),
      '</div>',
      '<div style="display:flex;justify-content:space-between;margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">',
      '<span>Subtotal</span><span>' + money(order.subtotal) + '</span></div>',
      '<div style="display:flex;justify-content:space-between"><span>Delivery</span><span>' + (order.shipping ? money(order.shipping) : 'Free') + '</span></div>',
      '<div style="display:flex;justify-content:space-between;font-size:1.1rem;margin-top:6px"><strong>Total to collect</strong><strong>' + money(order.total) + '</strong></div>',
      '</div>',

      '<label class="field"><span>Private note</span><textarea data-admin-note placeholder="Anything you need to remember about this order">' + esc(order.adminNote || '') + '</textarea></label>',
      '<div class="btn-row btn-row--spread">',
      '<button class="btn btn--danger btn--sm" data-delete-order>Delete order</button>',
      '<button class="btn btn--sm" data-save-note>Save note</button>',
      '</div>'
    ].join(''), (host) => {
      $('[data-close]', host).onclick = closeModal;
      $$('[data-set-status]', host).forEach(btn => {
        btn.onclick = async () => {
          try {
            const payload = await api('/api/orders', { method: 'PATCH', body: { id: order.id, status: btn.dataset.setStatus } });
            Object.assign(order, payload.order);
            closeModal();
            renderSidebar();
            render();
            toast('Marked as ' + payload.order.status, 'good');
          } catch (err) { toast(err.message, 'bad'); }
        };
      });
      const copyBtn = $('[data-copy]', host);
      if (copyBtn) copyBtn.onclick = () => {
        navigator.clipboard.writeText(address).then(() => toast('Address copied', 'good'), () => toast('Could not copy', 'bad'));
      };
      $('[data-save-note]', host).onclick = async () => {
        try {
          const payload = await api('/api/orders', { method: 'PATCH', body: { id: order.id, adminNote: $('[data-admin-note]', host).value } });
          Object.assign(order, payload.order);
          toast('Note saved', 'good');
        } catch (err) { toast(err.message, 'bad'); }
      };
      $('[data-delete-order]', host).onclick = () => {
        closeModal();
        confirmAction('Delete order ' + order.id + '? This cannot be undone.', async () => {
          try {
            await api('/api/orders?id=' + encodeURIComponent(order.id), { method: 'DELETE' });
            state.orders = state.orders.filter(o => o.id !== order.id);
            renderSidebar();
            render();
            toast('Order deleted', 'good');
          } catch (err) { toast(err.message, 'bad'); }
        }, true);
      };
    });
  }

  function ordersCsv() {
    const header = ['Order', 'Date', 'Status', 'Name', 'Phone', 'Email', 'Country', 'City', 'Address', 'Apartment', 'Items', 'Subtotal', 'Delivery', 'Total', 'Card note'];
    const rows = state.orders.map(o => [
      o.id, new Date(o.placedAt).toISOString(), o.status,
      o.customer.firstName + ' ' + o.customer.lastName, o.customer.phone, o.customer.email,
      o.customer.country, o.customer.city, o.customer.address, o.customer.apartment || '',
      (o.lines || []).map(l => l.qty + '× ' + l.name).join(' | '),
      o.subtotal, o.shipping, o.total, o.note || ''
    ]);
    /* A cell beginning = + - @ or a control character is executed as a formula by
       spreadsheet apps, so customer-supplied text gets a leading apostrophe. */
    const safeCell = (cell) => {
      const text = String(cell == null ? '' : cell);
      return (/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""');
    };
    const csv = [header].concat(rows)
      .map(row => row.map(cell => '"' + safeCell(cell) + '"').join(','))
      .join('\r\n');
    download(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), 'lovebirds-orders.csv');
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* shared with admin-views.js */
  window.__LBADMIN = {
    views: { overview: viewOverview, orders: viewOrders },
    $, $$, esc, ICON, state, getPath, setPath, clone, api, toast, money, modal, closeModal,
    confirmAction, markDirty, render, go, renderSidebar, loadImages, loadOrders, loadContent,
    save, download, openOrder, ordersCsv, openGate, checkSession, initLogin, refreshSaveState, stat, VIEWS
  };
})();
