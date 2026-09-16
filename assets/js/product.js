/* Product detail page */
(function () {
  const { $, $$, ICONS, money, productCard, observe } = window.LB;

  const root = $('[data-pdp]');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  const crumb = ICONS.chevron.replace('viewBox', 'style="transform:rotate(-90deg)" viewBox');
  const icon = name => ICONS[name] || ICONS.heart;

  function accItem(title, html, open) {
    return [
      '<div class="acc__item">',
      '<button class="acc__btn" aria-expanded="' + (open ? 'true' : 'false') + '">' + title + ICONS.plus + '</button>',
      '<div class="acc__panel"' + (open ? '' : ' style="height:0"') + '><div class="acc__panel-inner">' + html + '</div></div>',
      '</div>'
    ].join('');
  }

  function render() {
    const p = id ? getProduct(id) : null;
    const labels = COPY.product || {};

    if (!p) {
      root.innerHTML = [
        '<div class="pdp__empty">',
        '<h1>We couldn’t find that gift</h1>',
        '<p class="lede center" style="margin:16px auto 28px">It may have been renamed or is resting for the season. Everything else is waiting for you in the shop.</p>',
        '<a class="btn btn--lg" href="categories.html">Browse all gifts</a>',
        '</div>'
      ].join('');
      const relatedEmpty = $('[data-related-section]');
      if (relatedEmpty) relatedEmpty.hidden = true;
      return;
    }

    document.title = p.name + ' · ' + (CONFIG.brand || 'lovebirds');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', p.short || '');

    let qty = 1;
    const save = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;

    root.innerHTML = [
      '<div class="wrap">',
      '<nav class="breadcrumb" aria-label="Breadcrumb">',
      '<a href="index.html">Home</a>' + crumb,
      '<a href="categories.html?cat=' + p.category + '">' + categoryName(p.category) + '</a>' + crumb,
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
      p.script ? '<p class="pdp__script">' + p.script + '</p>' : '',
      '<div class="pdp__price"><span class="now">' + money(p.price) + '</span>' +
        (p.compareAt ? '<span class="was">' + money(p.compareAt) + '</span><span class="save">Save ' + save + '%</span>' : '') +
      '</div>',
      '<p class="pdp__desc">' + (p.description || p.short || '') + '</p>',

      '<div class="pdp__qty">',
      '<span class="label">' + (labels.quantityLabel || 'Quantity') + '</span>',
      '<div class="qty qty--lg">',
      '<button data-q="-1" aria-label="Decrease quantity">' + ICONS.minus + '</button>',
      '<span data-qty>1</span>',
      '<button data-q="1" aria-label="Increase quantity">' + ICONS.plus + '</button>',
      '</div></div>',

      '<div class="pdp__actions">',
      '<button class="btn btn--lg btn--block" data-add="' + p.id + '" data-qty="1">' + ICONS.bag + ' ' + (labels.addLabel || 'Add to cart') + '</button>',
      '<button class="btn btn--wa btn--lg btn--block" data-wa data-wa-text="Hi ' + (CONFIG.brand || 'lovebirds') + '! I would like to order the ' + p.name + '.">' + ICONS.chat + ' ' + (labels.whatsappLabel || 'Buy on WhatsApp') + '</button>',
      '</div>',

      '<ul class="pdp__assure">',
      (labels.assurances || []).filter(a => a && String(a.text || '').trim())
        .map(a => '<li>' + icon(a.icon) + ' ' + a.text + '</li>').join(''),
      '</ul>',

      '<div class="acc">',
      accItem(labels.tabDescription || 'Description', '<p>' + (p.description || '') + '</p>', true),
      p.includes.filter(Boolean).length ? accItem(labels.tabIncludes || 'What’s inside', '<ul>' + p.includes.filter(Boolean).map(i => '<li>' + i + '</li>').join('') + '</ul>', false) : '',
      accItem(labels.tabDelivery || 'Delivery & returns', '<p>' + (labels.deliveryText || '') + '</p>', false),
      '</div>',

      '</div></div></div>'
    ].join('');

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

    const qtyEl = $('[data-qty]', root);
    const addBtn = $('[data-add]', root);
    $$('[data-q]', root).forEach(btn => {
      btn.addEventListener('click', () => {
        qty = Math.min(99, Math.max(1, qty + parseInt(btn.dataset.q, 10)));
        qtyEl.textContent = qty;
        addBtn.dataset.qty = qty;
      });
    });

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

    const rel = $('[data-related]');
    if (rel) {
      let list = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id);
      if (list.length < 3) list = list.concat(PRODUCTS.filter(x => x.category !== p.category && x.id !== p.id));
      rel.innerHTML = list.slice(0, 4).map(x => productCard(x)).join('');
    }

    observe();
  }

  LBContent.ready.then(render);
  document.addEventListener('content:change', render);
})();
