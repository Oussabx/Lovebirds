/* Checkout — delivery details, cash on delivery, order placement */
(function () {
  const { $, $$, ICONS, money, Cart, toast } = window.LB;

  const form = $('[data-checkout]');
  if (!form) return;

  const CUSTOMER_KEY = 'lovebirds.customer.v1';
  const ORDER_KEY = 'lovebirds.lastOrder.v1';

  const itemsBox = $('[data-summary-items]');
  const emptyBox = $('[data-checkout-empty]');
  const gridBox = $('[data-checkout-grid]');

  /* ---------------------------------------------------------- fields */
  function fillCountries() {
    const country = $('#country');
    if (!country) return;
    const chosen = country.value;
    const list = (CONFIG.countries || []).slice();
    country.innerHTML = '<option value="" disabled' + (chosen ? '' : ' selected') + '>Select a country</option>' +
      list.map(c => '<option value="' + c + '"' + (c === chosen ? ' selected' : '') + '>' + c + '</option>').join('');
  }

  function fillLabels() {
    const labels = (COPY.checkout && COPY.checkout.labels) || {};
    Object.keys(labels).forEach(name => {
      const label = document.querySelector('label[for="' + name + '"]');
      if (!label) return;
      const optional = label.querySelector('span');
      label.textContent = labels[name];
      if (optional) label.appendChild(optional);
    });
  }

  function restoreSaved() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY)); } catch (e) { saved = null; }
    if (!saved) return;
    Object.keys(saved).forEach(key => {
      const field = form.elements[key];
      if (field && typeof saved[key] === 'string' && !field.value) field.value = saved[key];
    });
    const box = form.elements['saveInfo'];
    if (box) box.checked = true;
    const hint = $('[data-saved-hint]');
    if (hint) hint.hidden = false;
  }

  /* ---------------------------------------------------------- summary */
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
    set('[data-sum-count]', Cart.count() + ' ' + (Cart.count() === 1 ? 'item' : 'items'));
    set('[data-mobile-total]', money(tot));

    const free = $('[data-sum-free]');
    if (free) {
      const left = (CONFIG.freeShippingOver || 0) - sub;
      free.hidden = !CONFIG.freeShippingOver || left <= 0;
      const txt = $('[data-sum-free-text]');
      if (txt) txt.textContent = 'Add ' + money(Math.max(0, left)) + ' more for free delivery';
    }
    const cta = $('[data-complete]');
    if (cta && !cta.dataset.busy) {
      cta.innerHTML = ((COPY.checkout && COPY.checkout.completeLabel) || 'Complete order') + ' · ' + money(tot);
    }
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

  function validate(name, showError) {
    const input = form.elements[name];
    const rule = RULES[name];
    if (!input || !rule) return true;
    const value = (input.value || '').trim();
    const ok = value !== '' && (!rule.test || rule.test(value));
    const wrap = input.closest('.field');
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
      const wrap = input.closest('.field');
      if (wrap && wrap.classList.contains('is-invalid')) validate(name);
    });
    if (input.tagName === 'SELECT') input.addEventListener('change', () => validate(name));
  });

  /* ---------------------------------------------------------- submit */
  function localOrder(customer, note) {
    return {
      id: 'LB-' + Date.now().toString(36).slice(-5).toUpperCase() + Math.floor(Math.random() * 90 + 10),
      placedAt: new Date().toISOString(),
      status: 'new',
      payment: CONFIG.paymentNote || 'Cash on delivery',
      currency: CONFIG.currency,
      customer: customer,
      note: note,
      lines: Cart.lines().map(l => ({ id: l.id, name: l.product.name, qty: l.qty, price: l.product.price, total: l.total })),
      subtotal: Cart.subtotal(),
      shipping: Cart.shipping(),
      total: Cart.total(),
      offline: true
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!Cart.count()) { renderSummary(); return; }

    const bad = Object.keys(RULES).filter(n => !validate(n));
    if (bad.length) {
      const first = form.elements[bad[0]];
      first.focus();
      first.scrollIntoView({ behavior: window.LB.reduced ? 'auto' : 'smooth', block: 'center' });
      toast('Please check the highlighted details', ICONS.close);
      return;
    }

    const customer = {};
    ['country', 'firstName', 'lastName', 'address', 'apartment', 'city', 'phone', 'email'].forEach(key => {
      const el = form.elements[key];
      customer[key] = el ? el.value.trim() : '';
    });
    const note = form.elements['note'] ? form.elements['note'].value.trim() : '';

    try {
      if (form.elements['saveInfo'] && form.elements['saveInfo'].checked) {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
      } else {
        localStorage.removeItem(CUSTOMER_KEY);
      }
    } catch (err) {}

    const button = $('[data-complete]');
    const restore = button ? button.innerHTML : '';
    if (button) {
      button.dataset.busy = '1';
      button.setAttribute('aria-disabled', 'true');
      button.innerHTML = 'Placing your order…';
    }

    let order = null;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customer,
          note: note,
          items: Cart.items().map(i => ({ id: i.id, qty: i.qty }))
        })
      });

      if (res.status === 404) {
        order = localOrder(customer, note);               // no backend deployed
      } else {
        const payload = await res.json().catch(() => null);
        if (res.ok && payload && payload.ok && payload.order) {
          order = payload.order;
        } else {
          const message = (payload && payload.error) || 'We could not place that order. Please try again.';
          toast(message, ICONS.close);
          if (button) {
            delete button.dataset.busy;
            button.removeAttribute('aria-disabled');
            button.innerHTML = restore;
          }
          return;
        }
      }
    } catch (err) {
      order = localOrder(customer, note);                 // offline or API unreachable
    }

    try { localStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch (err) {}
    Cart.clear();
    setTimeout(() => { location.href = 'order-confirmed.html'; }, 450);
  });

  function boot() {
    fillCountries();
    fillLabels();
    restoreSaved();
    renderSummary();
  }

  document.addEventListener('cart:change', renderSummary);
  document.addEventListener('content:change', boot);
  LBContent.ready.then(boot);
})();
