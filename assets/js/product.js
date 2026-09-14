/* Product detail page */
(function () {
  const { $, $$, ICONS, money, productCard, observe, toast } = window.LB;

  const root = $('[data-pdp]');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  const p = id ? getProduct(id) : null;

  if (!p) {
    root.innerHTML = [
      '<div class="pdp__empty">',
      '<h1>We couldn’t find that gift</h1>',
      '<p class="lede center" style="margin:16px auto 28px">It may have been renamed or is resting for the season. Everything else is waiting for you in the shop.</p>',
      '<a class="btn btn--lg" href="categories.html">Browse all gifts</a>',
      '</div>'
    ].join('');
    return;
  }

  document.title = p.name + ' · lovebirds';
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', p.short);

  let qty = 1;
  const save = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;

  root.innerHTML = [
    '<div class="wrap">',
    '<nav class="breadcrumb" aria-label="Breadcrumb">',
    '<a href="index.html">Home</a>' + ICONS.chevron.replace('viewBox', 'style="transform:rotate(-90deg)" viewBox'),
    '<a href="categories.html?cat=' + p.category + '">' + categoryName(p.category) + '</a>' + ICONS.chevron.replace('viewBox', 'style="transform:rotate(-90deg)" viewBox'),
    '<span>' + p.name + '</span>',
    '</nav>',
    '<div class="pdp__grid">',

    '<div class="gallery" data-reveal="scale">',
    '<div class="gallery__main"><img src="' + p.images[0] + '" alt="' + p.name + '" data-main width="640" height="640"></div>',
    '<div class="gallery__thumbs">' + p.images.map((src, i) =>
      '<button class="' + (i === 0 ? 'is-active' : '') + '" data-thumb="' + src + '" aria-label="View image ' + (i + 1) + '"><img src="' + src + '" alt="" width="160" height="160"></button>'
    ).join('') + '</div>',
    '</div>',

    '<div class="pdp__info" data-reveal="right">',
    '<span class="pdp__cat">' + categoryName(p.category) + '</span>',
    '<h1>' + p.name + '</h1>',
    '<p class="pdp__script">' + p.script + '</p>',
    '<div class="pdp__price"><span class="now">' + money(p.price) + '</span>' +
      (p.compareAt ? '<span class="was">' + money(p.compareAt) + '</span><span class="save">Save ' + save + '%</span>' : '') +
    '</div>',
    '<p class="pdp__desc">' + p.description + '</p>',

    '<div class="pdp__qty">',
    '<span class="label">Quantity</span>',
    '<div class="qty qty--lg">',
    '<button data-q="-1" aria-label="Decrease quantity">' + ICONS.minus + '</button>',
    '<span data-qty>1</span>',
    '<button data-q="1" aria-label="Increase quantity">' + ICONS.plus + '</button>',
    '</div></div>',

    '<div class="pdp__actions">',
    '<button class="btn btn--lg btn--block" data-add="' + p.id + '" data-qty="1">' + ICONS.bag + ' Add to cart</button>',
    '<button class="btn btn--wa btn--lg btn--block" data-wa data-wa-text="Hi lovebirds! I would like to order the ' + p.name + '.">' + ICONS.chat + ' Buy on WhatsApp</button>',
    '</div>',

    '<ul class="pdp__assure">',
    '<li>' + ICONS.truck + ' Delivered in 2–4 days, gift-wrapped by hand</li>',
    '<li>' + ICONS.cash + ' Cash on delivery — pay when it arrives</li>',
    '<li>' + ICONS.gift + ' Free hand-written note with every order</li>',
    '</ul>',

    '<div class="acc">',
    accItem('What makes it special', '<p>' + p.description + '</p>', true),
    accItem('What’s inside', '<ul>' + p.includes.map(i => '<li>' + i + '</li>').join('') + '</ul>', false),
    accItem('Delivery & returns', '<p>Orders leave us within 24 hours and arrive in 2–4 working days. Everything is wrapped in blush tissue and sealed with our sticker. Changed your mind? Tell us within 14 days and we’ll collect it — unopened gifts are fully refunded.</p>', false),
    '</div>',

    '</div></div></div>'
  ].join('');

  function accItem(title, html, open) {
    return [
      '<div class="acc__item">',
      '<button class="acc__btn" aria-expanded="' + (open ? 'true' : 'false') + '">' + title + ICONS.plus + '</button>',
      '<div class="acc__panel"' + (open ? '' : ' style="height:0"') + '><div class="acc__panel-inner">' + html + '</div></div>',
      '</div>'
    ].join('');
  }

  /* gallery */
  const main = $('[data-main]', root);
  $$('[data-thumb]', root).forEach(btn => {
    btn.addEventListener('click', () => {
      $$('[data-thumb]', root).forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      main.src = btn.dataset.thumb;
      main.style.animation = 'none';
      void main.offsetWidth;
      main.style.animation = '';
    });
  });

  /* quantity */
  const qtyEl = $('[data-qty]', root);
  const addBtn = $('[data-add]', root);
  $$('[data-q]', root).forEach(btn => {
    btn.addEventListener('click', () => {
      qty = Math.min(99, Math.max(1, qty + parseInt(btn.dataset.q, 10)));
      qtyEl.textContent = qty;
      addBtn.dataset.qty = qty;
    });
  });

  /* accordion */
  $$('.acc__btn', root).forEach(btn => {
    const panel = btn.nextElementSibling;
    if (btn.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto';
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (open) {
        panel.style.height = panel.scrollHeight + 'px';
        requestAnimationFrame(() => { panel.style.height = '0px'; });
      } else {
        panel.style.height = panel.scrollHeight + 'px';
        panel.addEventListener('transitionend', function done() {
          panel.style.height = 'auto';
          panel.removeEventListener('transitionend', done);
        });
      }
    });
  });

  /* related */
  const rel = $('[data-related]');
  if (rel) {
    let list = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id);
    if (list.length < 3) list = list.concat(PRODUCTS.filter(x => x.category !== p.category && x.id !== p.id));
    rel.innerHTML = list.slice(0, 4).map(x => productCard(x)).join('');
  }

  observe();
})();
