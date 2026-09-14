/* ==========================================================================
   lovebirds — shared runtime
   nav · reveal animations · parallax · cart store · drawer · toasts
   ========================================================================== */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------- icons */
  const S = (p, o = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${o}>${p}</svg>`;
  const ICONS = {
    heart:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.6-4.9-10-9.2C.4 8.7 1.8 4.9 5 3.8 7.3 3 9.8 3.9 12 6.2 14.2 3.9 16.7 3 19 3.8c3.2 1.1 4.6 4.9 3 8C19.6 16.1 12 21 12 21Z"/></svg>',
    heartLine: S('<path d="M12 20.3 4.6 12.6a4.7 4.7 0 0 1 .3-6.9 4.7 4.7 0 0 1 6.4.5l.7.8.7-.8a4.7 4.7 0 0 1 6.4-.5 4.7 4.7 0 0 1 .3 6.9Z"/>'),
    bag:    S('<path d="M4.2 8h15.6l-1 12.4a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8Z"/><path d="M8.6 8V6.2a3.4 3.4 0 1 1 6.8 0V8"/>'),
    close:  S('<path d="M6 6l12 12M18 6 6 18"/>'),
    plus:   S('<path d="M12 5v14M5 12h14"/>'),
    minus:  S('<path d="M5 12h14"/>'),
    arrow:  S('<path d="M4 12h16M14 6l6 6-6 6"/>'),
    chevron:S('<path d="M6 9l6 6 6-6"/>'),
    check:  S('<path d="M4 12.5 9.5 18 20 6.5"/>'),
    star:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9Z"/></svg>',
    chat:   S('<path d="M21 11.5a8.4 8.4 0 0 1-11.9 7.6L3.4 21l1.9-5.6A8.4 8.4 0 1 1 21 11.5Z"/><path d="M8.6 11.4h.01M12 11.4h.01M15.4 11.4h.01"/>'),
    truck:  S('<path d="M2.5 6.5h11v10h-11z"/><path d="M13.5 10h4l3 3v3.5h-7z"/><circle cx="6.5" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>'),
    gift:   S('<path d="M3.5 9.5h17v3h-17z"/><path d="M4.8 12.5h14.4v8H4.8z"/><path d="M12 9.5v11"/><path d="M12 9.5S10.3 4 7.8 4a2.3 2.3 0 0 0 0 5.5ZM12 9.5S13.7 4 16.2 4a2.3 2.3 0 0 1 0 5.5Z"/>'),
    shield: S('<path d="M12 2.8 20 6v6c0 4.6-3.3 7.9-8 9.2C7.3 19.9 4 16.6 4 12V6Z"/><path d="M8.8 12.2 11 14.5l4.2-4.4"/>'),
    pin:    S('<path d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10.4" r="2.6"/>'),
    mail:   S('<path d="M3 6.5h18v11H3z"/><path d="m3.6 7.2 8.4 6 8.4-6"/>'),
    clock:  S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.3 2"/>'),
    cash:   S('<path d="M2.8 6.8h18.4v10.4H2.8z"/><circle cx="12" cy="12" r="2.8"/><path d="M6 10v4M18 10v4"/>'),
    spark:  S('<path d="M12 3.2 13.8 9l5.8 1.8-5.8 1.9L12 18.5l-1.8-5.8L4.4 10.8 10.2 9Z"/>')
  };

  /* ------------------------------------------------------------- helpers */
  const copy = (path, fallback) =>
    (window.LBContent ? window.LBContent.get(path, fallback) : fallback);

  function money(n) {
    const value = Number(n).toFixed(2);
    return CONFIG.currencyPosition === 'after'
      ? value + ' ' + CONFIG.currency
      : CONFIG.currency + value;
  }

  function waLink(text) {
    if (!CONFIG || !CONFIG.whatsapp) return null;
    return 'https://wa.me/' + CONFIG.whatsapp.replace(/\D/g, '') + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  /* ------------------------------------------------------------- toasts */
  let toastBox;
  function toast(message, icon) {
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.className = 'toasts';
      toastBox.setAttribute('role', 'status');
      toastBox.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastBox);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = (icon || ICONS.heart) + '<span>' + message + '</span>';
    toastBox.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, 2800);
  }

  /* ------------------------------------------------------------- cart store */
  const KEY = 'lovebirds.cart.v1';
  const FAV = 'lovebirds.favs.v1';

  const store = {
    read() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; }
      catch (e) { return []; }
    },
    write(items) {
      try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
      document.dispatchEvent(new CustomEvent('cart:change'));
    }
  };

  const Cart = {
    items() { return store.read().filter(i => getProduct(i.id)); },
    lines() {
      return this.items().map(i => {
        const p = getProduct(i.id);
        return { id: p.id, product: p, qty: i.qty, total: p.price * i.qty };
      });
    },
    count() { return this.items().reduce((n, i) => n + i.qty, 0); },
    subtotal() { return this.lines().reduce((n, l) => n + l.total, 0); },
    shipping() {
      const sub = this.subtotal();
      if (!sub) return 0;
      return sub >= CONFIG.freeShippingOver ? 0 : CONFIG.shippingFlat;
    },
    total() { return this.subtotal() + this.shipping(); },
    add(id, qty) {
      qty = Math.max(1, parseInt(qty, 10) || 1);
      const items = store.read();
      const found = items.find(i => i.id === id);
      if (found) found.qty = Math.min(99, found.qty + qty);
      else items.push({ id: id, qty: qty });
      store.write(items);
    },
    setQty(id, qty) {
      qty = parseInt(qty, 10) || 0;
      let items = store.read();
      if (qty <= 0) items = items.filter(i => i.id !== id);
      else {
        const found = items.find(i => i.id === id);
        if (found) found.qty = Math.min(99, qty);
      }
      store.write(items);
    },
    remove(id) { store.write(store.read().filter(i => i.id !== id)); },
    clear() { store.write([]); }
  };

  const Favs = {
    all() { try { return JSON.parse(localStorage.getItem(FAV)) || []; } catch (e) { return []; } },
    has(id) { return this.all().indexOf(id) > -1; },
    toggle(id) {
      const list = this.all();
      const i = list.indexOf(id);
      if (i > -1) list.splice(i, 1); else list.push(id);
      try { localStorage.setItem(FAV, JSON.stringify(list)); } catch (e) {}
      return i === -1;
    }
  };

  /* ------------------------------------------------------------- product card */
  function productCard(p, reveal) {
    const cat = categoryName(p.category);
    const fav = Favs.has(p.id) ? ' is-on' : '';
    return [
      '<article class="product-card"' + (reveal === false ? '' : ' data-reveal="scale"') + '>',
      p.badge ? '<span class="product-card__badge">' + p.badge + '</span>' : '',
      '<button class="product-card__fav' + fav + '" data-fav="' + p.id + '" aria-label="Save ' + p.name + '" aria-pressed="' + (fav ? 'true' : 'false') + '">' + ICONS.heart + '</button>',
      '<a class="product-card__media" href="product.html?id=' + p.id + '" tabindex="-1" aria-hidden="true">',
      '<img src="' + p.images[0] + '" alt="" loading="lazy" width="640" height="640">',
      '<img src="' + p.images[1] + '" alt="" loading="lazy" width="640" height="640">',
      '</a>',
      '<div class="product-card__body">',
      '<span class="product-card__cat">' + cat + '</span>',
      '<a class="product-card__link" href="product.html?id=' + p.id + '"><h3 class="product-card__title">' + p.name + '</h3></a>',
      '<p class="product-card__tag">' + p.short + '</p>',
      '<div class="product-card__foot">',
      '<span class="product-card__price">' + money(p.price) + '</span>',
      '<button class="product-card__add" data-add="' + p.id + '">Add to cart</button>',
      '</div></div></article>'
    ].join('');
  }

  /* ------------------------------------------------------------- reveal */
  let io;
  function observe(root) {
    const targets = $$('[data-reveal], .stagger', root || document)
      .filter(el => !el.classList.contains('is-in'));
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-in'));
      return;
    }
    if (!io) {
      io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });
    }
    targets.forEach(el => {
      if (el.dataset.delay) el.style.setProperty('--delay', el.dataset.delay);
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------- parallax */
  let pxEls = [];
  let ticking = false;
  function collectParallax() { pxEls = $$('[data-parallax]'); }
  function runParallax() {
    const vh = window.innerHeight;
    for (let i = 0; i < pxEls.length; i++) {
      const el = pxEls[i];
      const r = el.getBoundingClientRect();
      if (r.bottom < -250 || r.top > vh + 250) continue;
      const speed = parseFloat(el.dataset.parallax) || 0.18;
      const y = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    }
    ticking = false;
  }
  function onScroll() {
    const header = $('.header');
    if (header) header.classList.toggle('is-stuck', window.scrollY > 24);
    if (!reduced && !ticking) { ticking = true; requestAnimationFrame(runParallax); }
  }

  /* ------------------------------------------------------------- cart drawer */
  function drawerHTML() {
    return [
      '<div class="overlay" data-overlay hidden></div>',
      '<aside class="cart" id="cart-drawer" role="dialog" aria-modal="true" aria-label="' + copy('cart.title', 'Your cart') + '" aria-hidden="true">',
      '<header class="cart__head">',
      '<div><h2>' + copy('cart.title', 'Your cart') + '</h2><span class="count" data-cart-count-text>0 items</span></div>',
      '<button class="icon-btn" data-cart-close aria-label="Close cart">' + ICONS.close + '</button>',
      '</header>',
      '<div class="cart__body" data-cart-body></div>',
      '<footer class="cart__foot" data-cart-foot hidden>',
      '<div class="cart__ship" data-cart-ship></div>',
      '<div class="cart__row"><span>' + copy('cart.subtotalLabel', 'Subtotal') + '</span><strong data-cart-subtotal>' + money(0) + '</strong></div>',
      '<p class="cart__note">' + copy('cart.note', '') + '</p>',
      '<a class="btn btn--block btn--lg" href="checkout.html">' + copy('cart.checkoutLabel', 'Checkout') + ' ' + ICONS.arrow + '</a>',
      '<button class="btn btn--ghost btn--block mt-3" data-cart-close style="margin-top:12px">' + copy('cart.continueLabel', 'Continue shopping') + '</button>',
      '</footer></aside>'
    ].join('');
  }

  let lastFocus = null;

  function renderCart() {
    const body = $('[data-cart-body]');
    if (!body) return;
    const lines = Cart.lines();
    const count = Cart.count();

    $$('[data-cart-count]').forEach(el => {
      el.textContent = count;
      el.classList.toggle('is-on', count > 0);
      if (count > 0) {
        el.classList.remove('is-bump');
        void el.offsetWidth;
        el.classList.add('is-bump');
      }
    });
    const label = $('[data-cart-count-text]');
    if (label) {
      label.textContent = count + ' ' +
        (count === 1 ? copy('cart.itemWord', 'item') : copy('cart.itemsWord', 'items'));
    }

    const foot = $('[data-cart-foot]');
    if (!lines.length) {
      body.innerHTML = '<div class="empty">' + ICONS.heartLine +
        '<h3>' + copy('cart.emptyTitle', 'Nothing in here yet') + '</h3>' +
        '<p>' + copy('cart.emptyText', '') + '</p>' +
        '<a class="btn btn--ghost" href="categories.html">' + copy('cart.browseLabel', 'Shop gifts') + '</a></div>';
      if (foot) foot.hidden = true;
      return;
    }
    if (foot) foot.hidden = false;

    body.innerHTML = lines.map(l => [
      '<div class="cart-item" data-line="' + l.id + '">',
      '<a class="cart-item__media" href="product.html?id=' + l.id + '"><img src="' + l.product.images[0] + '" alt="' + l.product.name + '" width="160" height="160"></a>',
      '<div>',
      '<h3 class="cart-item__title">' + l.product.name + '</h3>',
      '<p class="cart-item__meta">' + categoryName(l.product.category) + ' · ' + money(l.product.price) + '</p>',
      '<div class="cart-item__foot">',
      '<div class="qty">',
      '<button data-dec="' + l.id + '" aria-label="Decrease quantity">' + ICONS.minus + '</button>',
      '<span>' + l.qty + '</span>',
      '<button data-inc="' + l.id + '" aria-label="Increase quantity">' + ICONS.plus + '</button>',
      '</div>',
      '<span class="cart-item__price">' + money(l.total) + '</span>',
      '</div>',
      '<button class="cart-item__remove" data-remove="' + l.id + '">Remove</button>',
      '</div></div>'
    ].join('')).join('');

    const sub = Cart.subtotal();
    const subEl = $('[data-cart-subtotal]');
    if (subEl) subEl.textContent = money(sub);

    const ship = $('[data-cart-ship]');
    if (ship) {
      const left = CONFIG.freeShippingOver - sub;
      const pct = Math.min(100, (sub / CONFIG.freeShippingOver) * 100);
      if (!CONFIG.freeShippingOver) { ship.innerHTML = ''; }
      else {
        ship.innerHTML = left > 0
          ? '<p>' + money(left) + ' ' + copy('cart.freeAway', 'away from free delivery') + '</p><div class="cart__ship-bar"><i style="width:' + pct + '%"></i></div>'
          : '<p>' + ICONS.check + ' ' + copy('cart.freeDone', 'You have free delivery') + '</p><div class="cart__ship-bar"><i style="width:100%"></i></div>';
      }
    }
  }

  function openCart() {
    const cart = $('#cart-drawer');
    const overlay = $('[data-overlay]');
    if (!cart) return;
    lastFocus = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(() => {
      cart.classList.add('is-open');
      overlay.classList.add('is-open');
    });
    cart.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    const close = $('[data-cart-close]', cart);
    if (close) close.focus();
  }

  function closeCart() {
    const cart = $('#cart-drawer');
    const overlay = $('[data-overlay]');
    if (!cart || !cart.classList.contains('is-open')) return;
    cart.classList.remove('is-open');
    overlay.classList.remove('is-open');
    cart.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    setTimeout(() => { if (!cart.classList.contains('is-open')) overlay.hidden = true; }, 600);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ------------------------------------------------------------- chrome */
  function applyChrome() {
    $$('[data-footer-links]').forEach(list => {
      const column = copy('footer.columns.' + list.dataset.footerLinks, null);
      if (!column || !Array.isArray(column.links)) return;
      list.innerHTML = column.links
        .map(link => '<li><a href="' + link.href + '">' + link.label + '</a></li>').join('');
    });
    const mail = copy('settings.email', '');
    $$('[data-mail]').forEach(a => { if (mail) a.setAttribute('href', 'mailto:' + mail); });
  }

  /* ------------------------------------------------------------- nav */
  function initNav() {
    const burger = $('[data-burger]');
    const menu = $('.mobile-menu');
    if (burger && menu) {
      burger.addEventListener('click', () => {
        const open = document.body.classList.toggle('menu-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('is-locked', open);
      });
      $$('a, button', menu).forEach(el => el.addEventListener('click', () => {
        document.body.classList.remove('menu-open', 'is-locked');
        burger.setAttribute('aria-expanded', 'false');
      }));
    }
    // current page highlight
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('[data-nav]').forEach(a => {
      const target = (a.getAttribute('href') || '').split('?')[0].toLowerCase();
      if (target === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* ------------------------------------------------------------- boot */
  function init() {
    // inject drawer + overlay once per page
    const holder = document.createElement('div');
    holder.innerHTML = drawerHTML();
    while (holder.firstChild) document.body.appendChild(holder.firstChild);

    initNav();
    applyChrome();
    renderCart();
    observe();
    collectParallax();
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { collectParallax(); onScroll(); }, { passive: true });
    document.addEventListener('cart:change', renderCart);
    document.addEventListener('content:change', () => { applyChrome(); renderCart(); });

    // year stamps
    $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

    // delegated clicks
    document.addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      if (add) {
        e.preventDefault();
        const p = getProduct(add.dataset.add);
        if (!p) return;
        Cart.add(p.id, add.dataset.qty || 1);
        toast(p.name + ' ' + copy('cart.addedToast', 'added to your cart'));
        openCart();
        return;
      }
      const fav = e.target.closest('[data-fav]');
      if (fav) {
        e.preventDefault();
        const on = Favs.toggle(fav.dataset.fav);
        fav.classList.toggle('is-on', on);
        fav.setAttribute('aria-pressed', on ? 'true' : 'false');
        toast(on ? copy('cart.savedToast', 'Saved') : copy('cart.unsavedToast', 'Removed'));
        return;
      }
      if (e.target.closest('[data-cart-open]')) { e.preventDefault(); openCart(); return; }
      if (e.target.closest('[data-cart-close]') || e.target.closest('[data-overlay]')) { closeCart(); return; }

      const inc = e.target.closest('[data-inc]');
      if (inc) { const l = Cart.lines().find(x => x.id === inc.dataset.inc); if (l) Cart.setQty(l.id, l.qty + 1); return; }
      const dec = e.target.closest('[data-dec]');
      if (dec) { const l = Cart.lines().find(x => x.id === dec.dataset.dec); if (l) Cart.setQty(l.id, l.qty - 1); return; }
      const rm = e.target.closest('[data-remove]');
      if (rm) { Cart.remove(rm.dataset.remove); toast(copy('cart.removedToast', 'Removed')); return; }

      const wa = e.target.closest('[data-wa]');
      if (wa) {
        const text = wa.dataset.waText ||
          (wa.hasAttribute('data-wa-greeting') ? copy('settings.whatsappGreeting', '') : '');
        const link = waLink(text);
        if (link) { window.open(link, '_blank', 'noopener'); }
        else { e.preventDefault(); toast(copy('cart.whatsappSoon', 'WhatsApp is not connected yet'), ICONS.chat); }
      }
    });

    // esc closes things
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      closeCart();
      if (document.body.classList.contains('menu-open')) {
        document.body.classList.remove('menu-open', 'is-locked');
        const b = $('[data-burger]');
        if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); }
      }
    });

    // keep focus inside the open drawer
    document.addEventListener('focusin', (e) => {
      const cart = $('#cart-drawer');
      if (cart && cart.classList.contains('is-open') && !cart.contains(e.target)) {
        const first = $('[data-cart-close]', cart);
        if (first) first.focus();
      }
    });

    // soft glow follows the pointer on buttons
    document.addEventListener('pointermove', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      btn.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  }

  /* ------------------------------------------------------------- export */
  window.LB = {
    $: $, $$: $$, ICONS: ICONS, money: money, waLink: waLink,
    Cart: Cart, Favs: Favs, toast: toast, productCard: productCard, copy: copy,
    observe: observe, refreshParallax: collectParallax,
    openCart: openCart, closeCart: closeCart, reduced: reduced
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
