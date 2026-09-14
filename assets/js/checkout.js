/* Checkout — delivery details, cash on delivery, order summary */
(function () {
  const { $, $$, ICONS, money, Cart, toast } = window.LB;

  const form = $('[data-checkout]');
  if (!form) return;

  const CUSTOMER_KEY = 'lovebirds.customer.v1';
  const ORDER_KEY = 'lovebirds.lastOrder.v1';

  const COUNTRIES = [
    'Lebanon', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bahrain', 'Belgium', 'Brazil', 'Canada',
    'Chile', 'Colombia', 'Cyprus', 'Czechia', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Ghana',
    'Greece', 'India', 'Indonesia', 'Iraq', 'Ireland', 'Italy', 'Japan', 'Jordan', 'Kenya', 'Kuwait',
    'Libya', 'Malaysia', 'Malta', 'Mauritania', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand',
    'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Palestine', 'Philippines', 'Poland', 'Portugal', 'Qatar',
    'Romania', 'Saudi Arabia', 'Senegal', 'Singapore', 'South Africa', 'Spain', 'Sudan', 'Sweden',
    'Switzerland', 'Syria', 'Tunisia', 'Türkiye', 'United Arab Emirates', 'United Kingdom',
    'United States', 'Yemen', 'Other'
  ];

  /* ---------------------------------------------------------- country list */
  const country = $('#country');
  if (country) {
    country.innerHTML = '<option value="" disabled selected>Select a country</option>' +
      COUNTRIES.map(c => '<option value="' + c + '">' + c + '</option>').join('');
  }

  /* ---------------------------------------------------------- saved details */
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY)); } catch (e) { saved = null; }
  if (saved) {
    Object.keys(saved).forEach(k => {
      const field = form.elements[k];
      if (field && typeof saved[k] === 'string') field.value = saved[k];
    });
    const box = form.elements['saveInfo'];
    if (box) box.checked = true;
    const hint = $('[data-saved-hint]');
    if (hint) hint.hidden = false;
  }

  /* ---------------------------------------------------------- summary */
  const itemsBox = $('[data-summary-items]');
  const emptyBox = $('[data-checkout-empty]');
  const gridBox = $('[data-checkout-grid]');

  function renderSummary() {
    const lines = Cart.lines();

    if (!lines.length) {
      if (gridBox) gridBox.hidden = true;
      if (emptyBox) emptyBox.hidden = false;
      return;
    }
    if (gridBox) gridBox.hidden = false;
    if (emptyBox) emptyBox.hidden = true;

    if (itemsBox) {
      itemsBox.innerHTML = lines.map(l => [
        '<div class="summary__item">',
        '<div class="summary__thumb"><img src="' + l.product.images[0] + '" alt="' + l.product.name + '" width="120" height="120"><span class="summary__qty">' + l.qty + '</span></div>',
        '<div><div class="summary__name">' + l.product.name + '</div><div class="summary__meta">' + categoryName(l.product.category) + '</div></div>',
        '<div class="summary__price">' + money(l.total) + '</div>',
        '</div>'
      ].join('')).join('');
    }

    const sub = Cart.subtotal(), ship = Cart.shipping(), tot = Cart.total();
    const set = (sel, val) => { const el = $(sel); if (el) el.textContent = val; };
    set('[data-sum-subtotal]', money(sub));
    set('[data-sum-shipping]', ship === 0 ? 'Free' : money(ship));
    set('[data-sum-total]', money(tot));
    set('[data-sum-count]', Cart.count() + (Cart.count() === 1 ? ' item' : ' items'));
    set('[data-mobile-total]', money(tot));

    const free = $('[data-sum-free]');
    if (free) {
      const left = CONFIG.freeShippingOver - sub;
      free.hidden = left <= 0;
      const txt = $('[data-sum-free-text]');
      if (txt) txt.textContent = 'Add ' + money(Math.max(0, left)) + ' more for free delivery';
    }
    const cta = $('[data-complete]');
    if (cta) cta.innerHTML = 'Complete order · ' + money(tot);
  }

  /* ---------------------------------------------------------- mobile summary */
  const toggle = $('[data-summary-toggle]');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      $('.summary').classList.toggle('is-open', !open);
      $('[data-summary-toggle-label]').textContent = open ? 'Show order summary' : 'Hide order summary';
    });
  }

  /* ---------------------------------------------------------- validation */
  const RULES = {
    country:   { msg: 'Please choose a delivery country.' },
    firstName: { msg: 'Please enter your first name.' },
    lastName:  { msg: 'Please enter your last name.' },
    address:   { msg: 'Please enter your street address.' },
    city:      { msg: 'Please enter your city.' },
    phone:     { msg: 'Please enter a phone number we can call on delivery.',
                 test: v => v.replace(/\D/g, '').length >= 6 },
    email:     { msg: 'Please enter a valid email address.',
                 test: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) }
  };

  function fieldOf(input) { return input.closest('.field'); }

  function validate(name, showError) {
    const input = form.elements[name];
    const rule = RULES[name];
    if (!input || !rule) return true;
    const value = (input.value || '').trim();
    const ok = value !== '' && (!rule.test || rule.test(value));
    const wrap = fieldOf(input);
    if (wrap) {
      wrap.classList.toggle('is-invalid', !ok && showError !== false);
      const err = wrap.querySelector('.err');
      if (err) err.textContent = rule.msg;
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    }
    return ok;
  }

  Object.keys(RULES).forEach(name => {
    const input = form.elements[name];
    if (!input) return;
    input.addEventListener('blur', () => { if (input.value.trim()) validate(name); });
    input.addEventListener('input', () => {
      const wrap = fieldOf(input);
      if (wrap && wrap.classList.contains('is-invalid')) validate(name);
    });
    if (input.tagName === 'SELECT') input.addEventListener('change', () => validate(name));
  });

  /* ---------------------------------------------------------- submit */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!Cart.count()) { renderSummary(); return; }

    const names = Object.keys(RULES);
    const bad = names.filter(n => !validate(n));
    if (bad.length) {
      const first = form.elements[bad[0]];
      first.focus();
      first.scrollIntoView({ behavior: window.LB.reduced ? 'auto' : 'smooth', block: 'center' });
      toast('Please check the highlighted details', ICONS.close);
      return;
    }

    const data = {};
    ['country', 'firstName', 'lastName', 'address', 'apartment', 'city', 'phone', 'email'].forEach(k => {
      const el = form.elements[k];
      data[k] = el ? el.value.trim() : '';
    });

    const wantsSave = form.elements['saveInfo'] && form.elements['saveInfo'].checked;
    try {
      if (wantsSave) localStorage.setItem(CUSTOMER_KEY, JSON.stringify(data));
      else localStorage.removeItem(CUSTOMER_KEY);
    } catch (err) {}

    const order = {
      id: 'LB-' + Date.now().toString(36).slice(-5).toUpperCase() + Math.floor(Math.random() * 90 + 10),
      placedAt: new Date().toISOString(),
      payment: 'Cash on delivery',
      customer: data,
      lines: Cart.lines().map(l => ({ id: l.id, name: l.product.name, qty: l.qty, price: l.product.price, total: l.total })),
      subtotal: Cart.subtotal(),
      shipping: Cart.shipping(),
      total: Cart.total()
    };

    try { localStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch (err) {}

    const btn = $('[data-complete]');
    if (btn) { btn.setAttribute('aria-disabled', 'true'); btn.innerHTML = 'Placing your order…'; }

    Cart.clear();
    setTimeout(() => { location.href = 'order-confirmed.html'; }, 550);
  });

  document.addEventListener('cart:change', renderSummary);
  renderSummary();
})();
