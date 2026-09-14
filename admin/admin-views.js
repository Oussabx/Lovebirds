/* ==========================================================================
   lovebirds — dashboard views
   ========================================================================== */
(function () {
  'use strict';
  const A = window.__LBADMIN;
  const { $, $$, esc, ICON, state, getPath, setPath, clone, api, toast, money,
          modal, closeModal, confirmAction, markDirty, render, go, renderSidebar,
          loadImages, loadOrders, loadContent, save, download, openOrder, ordersCsv,
          openGate, checkSession, initLogin, VIEWS } = A;

  const get = (path) => getPath(state.content, path);
  const ICON_NAMES = ['heart', 'gift', 'truck', 'cash', 'shield', 'pen', 'spark', 'chat', 'mail', 'clock', 'pin', 'star', 'bag', 'check'];
  const FONTS_DISPLAY = ['Fraunces', 'Playfair Display', 'Cormorant Garamond', 'DM Serif Display', 'Lora', 'Libre Baskerville', 'Marcellus', 'Bodoni Moda'];
  const FONTS_SANS = ['Jost', 'Inter', 'Work Sans', 'Karla', 'Nunito Sans', 'Manrope', 'Poppins', 'Outfit'];
  const FONTS_SCRIPT = ['Parisienne', 'Dancing Script', 'Sacramento', 'Great Vibes', 'Allura', 'Petit Formal Script'];
  const ARTWORK = ['p-mugs', 'p-candle', 'p-journal', 'p-keychain', 'p-giftbox', 'p-teddy', 'p-bouquet',
                   'p-cards', 'p-tote', 'p-frame', 'p-chocolate', 'p-memorybox', 'scene-wrap', 'scene-note']
                   .map(n => 'assets/img/' + n + '.svg');

  const slugify = (text) => String(text || '')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);

  const uniqueId = (base, list, skipIndex) => {
    let candidate = base || 'item';
    let n = 2;
    while (list.some((entry, i) => i !== skipIndex && entry.id === candidate)) candidate = base + '-' + n++;
    return candidate;
  };

  const previewSrc = (path) => (!path ? '' : (/^(https?:|\/)/.test(path) ? path : '/' + path));

  function mix(hexA, hexB, amount) {
    const toRgb = (hex) => {
      let value = String(hex || '').replace('#', '');
      if (value.length === 3) value = value.split('').map(c => c + c).join('');
      return /^[0-9a-f]{6}$/i.test(value)
        ? [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)]
        : null;
    };
    const a = toRgb(hexA), b = toRgb(hexB);
    if (!a || !b) return hexA;
    return '#' + a.map((channel, i) => {
      const value = Math.round(channel + (b[i] - channel) * amount);
      return ('0' + value.toString(16)).slice(-2);
    }).join('');
  }

  /* ------------------------------------------------------------- fields */
  const hint = (text) => text ? '<span class="field__hint">' + esc(text) + '</span>' : '';

  function fText(path, label, opts) {
    opts = opts || {};
    return '<label class="field"><span>' + esc(label) + '</span>' +
      '<input type="text" data-bind="' + path + '" value="' + esc(get(path) || '') + '"' +
      (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '') + '>' + hint(opts.hint) + '</label>';
  }
  function fArea(path, label, opts) {
    opts = opts || {};
    return '<label class="field"><span>' + esc(label) + '</span>' +
      '<textarea data-bind="' + path + '"' + (opts.rows ? ' rows="' + opts.rows + '"' : '') +
      (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '') + '>' + esc(get(path) || '') + '</textarea>' +
      hint(opts.hint) + '</label>';
  }
  function fNum(path, label, opts) {
    opts = opts || {};
    const value = get(path);
    return '<label class="field"><span>' + esc(label) + '</span>' +
      '<input type="number" data-bind="' + path + '" data-type="number" value="' + (value == null ? '' : esc(value)) + '"' +
      (opts.step ? ' step="' + opts.step + '"' : ' step="any"') + (opts.min != null ? ' min="' + opts.min + '"' : '') + '>' +
      hint(opts.hint) + '</label>';
  }
  function fSelect(path, label, options, opts) {
    opts = opts || {};
    const current = get(path);
    return '<label class="field"><span>' + esc(label) + '</span><select data-bind="' + path + '">' +
      options.map(o => {
        const value = typeof o === 'string' ? o : o.value;
        const text = typeof o === 'string' ? o : o.label;
        return '<option value="' + esc(value) + '"' + (String(current) === String(value) ? ' selected' : '') + '>' + esc(text) + '</option>';
      }).join('') + '</select>' + hint(opts.hint) + '</label>';
  }
  function fSwitch(path, label) {
    return '<label class="switch"><input type="checkbox" data-bind="' + path + '" data-type="bool"' +
      (get(path) ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
  }
  function luminance(hex) {
    const h = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    const rgb = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
      .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  function contrast(a, b) {
    const l1 = luminance(a), l2 = luminance(b);
    if (l1 === null || l2 === null) return null;
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function contrastNote(path, value) {
    const theme = state.content.theme || {};
    const checks = {
      'theme.wine': { against: theme.creamLight, need: 4.5, what: 'headings and buttons on the page' },
      'theme.wineSoft': { against: theme.creamLight, need: 3, what: 'the handwritten accents' },
      'theme.ink': { against: theme.creamLight, need: 4.5, what: 'body text' },
      'theme.gold': { against: theme.creamLight, need: 3, what: 'the review stars' }
    };
    const check = checks[path];
    if (!check || !check.against) return '';
    const ratio = contrast(value, check.against);
    if (ratio === null) return '';
    if (ratio >= check.need) return '<span class="field__hint" style="color:var(--ok)">' + ratio.toFixed(1) + ':1 — easy to read</span>';
    return '<span class="field__hint" style="color:var(--warn)">' + ratio.toFixed(1) + ':1 — a little faint for ' + check.what + '</span>';
  }

  function fColour(path, label) {
    const value = get(path) || '#000000';
    return '<div class="field"><span class="field__label">' + esc(label) + '</span><div class="colour">' +
      '<input type="color" data-colour="' + path + '" value="' + esc(value) + '" aria-label="' + esc(label) + ' colour picker">' +
      '<input type="text" data-bind="' + path + '" data-colour-text="' + path + '" value="' + esc(value) + '" aria-label="' + esc(label) + ' hex value">' +
      '</div>' + contrastNote(path, value) + '</div>';
  }
  function fImage(path, label) {
    const value = get(path) || '';
    return '<div class="field"><span class="field__label">' + esc(label) + '</span><div class="picker">' +
      '<img src="' + esc(previewSrc(value)) + '" alt="" onerror="this.style.opacity=.25">' +
      '<div class="picker__actions">' +
      '<button class="btn btn--ghost btn--tiny" data-pick="' + path + '">Choose image</button>' +
      '<button class="btn btn--ghost btn--tiny" data-clear="' + path + '">Clear</button>' +
      '</div></div><span class="field__hint">' + esc(value || 'No image set') + '</span></div>';
  }
  function fStrings(path, label, opts) {
    opts = opts || {};
    const list = get(path) || [];
    return '<div class="field" data-strings="' + path + '"><span class="field__label">' + esc(label) + '</span>' +
      '<div>' + list.map((item, i) =>
        '<span class="tag">' + esc(item) + '<button data-string-remove="' + path + '" data-index="' + i + '" aria-label="Remove">×</button></span>'
      ).join('') + (list.length ? '' : '<span class="field__hint">Nothing yet</span>') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:8px">' +
      '<input type="text" data-string-input="' + path + '" aria-label="Add to ' + esc(label) + '" placeholder="' + esc(opts.placeholder || 'Add an item and press Enter') + '">' +
      '<button class="btn btn--ghost btn--sm" data-string-add="' + path + '">Add</button></div>' +
      hint(opts.hint) + '</div>';
  }
  function fObjects(path, label, fields, opts) {
    opts = opts || {};
    const list = get(path) || [];
    const rows = list.map((item, i) => [
      '<div class="subform">',
      '<div class="subform__head"><strong>' + esc(label) + ' ' + (i + 1) + '</strong>',
      '<div class="list__actions">',
      '<button class="iconbtn" data-move="' + path + '" data-index="' + i + '" data-dir="-1" title="Move up" aria-label="Move ' + esc(label) + ' ' + (i + 1) + ' up">' + ICON.up + '</button>',
      '<button class="iconbtn" data-move="' + path + '" data-index="' + i + '" data-dir="1" title="Move down" aria-label="Move ' + esc(label) + ' ' + (i + 1) + ' down">' + ICON.down + '</button>',
      '<button class="iconbtn iconbtn--danger" data-remove-item="' + path + '" data-index="' + i + '" title="Remove" aria-label="Remove ' + esc(label) + ' ' + (i + 1) + '">' + ICON.trash + '</button>',
      '</div></div>',
      fields.map(field => {
        const full = path + '.' + i + '.' + field.k;
        if (field.t === 'area') return fArea(full, field.l, { rows: 3 });
        if (field.t === 'number') return fNum(full, field.l);
        if (field.t === 'image') return fImage(full, field.l);
        if (field.t === 'icon') return fSelect(full, field.l, ICON_NAMES);
        if (field.t === 'select') return fSelect(full, field.l, field.options);
        return fText(full, field.l);
      }).join(''),
      '</div>'
    ].join('')).join('');

    return '<div class="field"><span class="field__label">' + esc(label) + '</span>' +
      (rows || '<p class="field__hint" style="margin-bottom:10px">Nothing here yet.</p>') +
      '<button class="btn btn--ghost btn--sm" data-add-item="' + path + '" data-template="' +
      esc(JSON.stringify(opts.template || fields.reduce((o, f) => (o[f.k] = '', o), {}))) + '">' + ICON.plus + ' Add ' + esc(label.toLowerCase()) + '</button></div>';
  }

  function fGallery(path, productIndex) {
    const list = (get(path) || []).filter(Boolean);
    const tiles = list.map((src, i) => [
      '<div class="media" style="width:96px">',
      '<img src="' + esc(previewSrc(src)) + '" alt="" style="aspect-ratio:1">',
      '<div class="media__bar" style="justify-content:center">',
      '<button class="iconbtn" data-gallery-swap="' + path + '" data-index="' + i + '" aria-label="Replace picture ' + (i + 1) + '" title="Replace">' + ICON.edit + '</button>',
      '<button class="iconbtn iconbtn--danger" data-gallery-remove="' + path + '" data-index="' + i + '" aria-label="Remove picture ' + (i + 1) + '" title="Remove">' + ICON.trash + '</button>',
      '</div></div>'
    ].join('')).join('');

    return '<div class="field"><span class="field__label">Gallery pictures</span>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start">' + tiles +
      '<button class="btn btn--ghost btn--tiny" data-add-gallery="' + productIndex + '" style="height:96px;width:96px;flex-direction:column;gap:4px">' +
      ICON.plus + '<span>Add</span></button></div>' +
      '<span class="field__hint">The first picture is the one shoppers see first.</span></div>';
  }

  function card(title, body, actions) {
    return '<div class="card"><div class="card__head"><h2>' + esc(title) + '</h2>' + (actions || '') + '</div>' + body + '</div>';
  }

  /* ------------------------------------------------------------- products */
  function viewProducts() {
    const search = state.productSearch.toLowerCase();
    const products = state.content.products || [];
    const shown = products
      .map((p, index) => ({ p: p, index: index }))
      .filter(entry => !search || (entry.p.name + ' ' + entry.p.id).toLowerCase().indexOf(search) > -1);

    const rows = shown.map(({ p, index }) => [
      '<div class="list__row">',
      '<img src="' + esc(previewSrc(p.image)) + '" alt="">',
      '<div class="list__main">',
      '<div class="list__title">' + esc(p.name) + (p.featured ? ' ★' : '') + '</div>',
      '<div class="list__meta">' + money(p.price) + ' · ' + esc(categoryLabel(p.category)) +
        (p.active === false ? ' · <span style="color:var(--bad)">hidden</span>' : '') + '</div>',
      '</div>',
      '<div class="list__actions">',
      '<button class="iconbtn" data-move="products" data-index="' + index + '" data-dir="-1" title="Move up" aria-label="Move ' + esc(p.name) + ' up">' + ICON.up + '</button>',
      '<button class="iconbtn" data-move="products" data-index="' + index + '" data-dir="1" title="Move down" aria-label="Move ' + esc(p.name) + ' down">' + ICON.down + '</button>',
      '<button class="iconbtn" data-duplicate="' + index + '" title="Duplicate" aria-label="Duplicate ' + esc(p.name) + '">' + ICON.copy + '</button>',
      '<button class="iconbtn" data-edit-product="' + index + '" title="Edit" aria-label="Edit ' + esc(p.name) + '">' + ICON.edit + '</button>',
      '<button class="iconbtn iconbtn--danger" data-delete-product="' + index + '" title="Delete" aria-label="Delete ' + esc(p.name) + '">' + ICON.trash + '</button>',
      '</div></div>'
    ].join('')).join('');

    return card('Products', [
      '<label class="field"><span>Search</span><input type="text" data-product-search value="' + esc(state.productSearch) + '" placeholder="Find a gift by name" aria-label="Search products"></label>',
      shown.length ? '<div class="list">' + rows + '</div>'
        : '<div class="empty"><h3>No gifts here</h3><p>Add your first product to fill the shop.</p></div>'
    ].join(''), '<button class="btn btn--sm" data-add-product>' + ICON.plus + ' Add product</button>');
  }

  const categoryLabel = (id) => {
    const found = (state.content.categories || []).find(c => c.id === id);
    return found ? found.name : (id || 'Uncategorised');
  };

  function editProduct(index) {
    const product = state.content.products[index];
    if (!product) return;
    const base = 'products.' + index;
    const categories = (state.content.categories || []).map(c => ({ value: c.id, label: c.name }));

    modal([
      '<div class="modal__head"><h2>' + esc(product.name || 'New product') + '</h2>',
      '<button class="iconbtn" data-close aria-label="Close">' + ICON.close + '</button></div>',
      '<div class="row row--2">' + fText(base + '.name', 'Name') + fText(base + '.id', 'Web address id', { hint: 'Used in the link: product.html?id=…' }) + '</div>',
      fText(base + '.script', 'Handwritten line', { placeholder: 'Two cups, one slow morning.' }),
      '<div class="row row--3">' +
        fNum(base + '.price', 'Price', { min: 0, step: '0.01' }) +
        fNum(base + '.compareAt', 'Was (optional)', { min: 0, step: '0.01', hint: 'Shows a “save %” badge' }) +
        fSelect(base + '.category', 'Category', categories) +
      '</div>',
      '<div class="row row--2">' + fText(base + '.badge', 'Corner badge', { placeholder: 'Bestseller' }) +
        '<div>' + fSwitch(base + '.featured', 'Show on the home page') + fSwitch(base + '.active', 'Visible in the shop') + '</div></div>',
      fText(base + '.short', 'One-line description'),
      fArea(base + '.description', 'Full description', { rows: 5 }),
      fImage(base + '.image', 'Main picture'),
      fGallery(base + '.images', index),
      fStrings(base + '.includes', 'What’s inside (bullet list)'),
      fStrings(base + '.tags', 'Small tags'),
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">',
      '<button class="btn" data-close>Done</button></div>'
    ].join(''), (host) => {
      $$('[data-close]', host).forEach(btn => btn.onclick = () => { closeModal(); render(); });
    });
  }

  /* ------------------------------------------------------------- categories */
  function viewCategories() {
    const rows = (state.content.categories || []).map((c, index) => [
      '<div class="subform">',
      '<div class="subform__head"><strong>' + esc(c.name || 'Category') + '</strong>',
      '<div class="list__actions">',
      '<button class="iconbtn" data-move="categories" data-index="' + index + '" data-dir="-1" aria-label="Move ' + esc(c.name || 'category') + ' up">' + ICON.up + '</button>',
      '<button class="iconbtn" data-move="categories" data-index="' + index + '" data-dir="1" aria-label="Move ' + esc(c.name || 'category') + ' down">' + ICON.down + '</button>',
      '<button class="iconbtn iconbtn--danger" data-delete-category="' + index + '" aria-label="Delete the ' + esc(c.name || '') + ' category">' + ICON.trash + '</button>',
      '</div></div>',
      '<div class="row row--2">' + fText('categories.' + index + '.name', 'Name') +
        fText('categories.' + index + '.id', 'Id', { hint: 'Used in links — change with care' }) + '</div>',
      fText('categories.' + index + '.blurb', 'Caption on the tile'),
      fText('categories.' + index + '.intro', 'Line at the top of the category page'),
      fImage('categories.' + index + '.image', 'Tile picture'),
      '</div>'
    ].join('')).join('');

    return card('Categories', rows || '<div class="empty"><h3>No categories</h3></div>',
      '<button class="btn btn--sm" data-add-category>' + ICON.plus + ' Add category</button>');
  }

  /* ------------------------------------------------------------- content */
  const SECTIONS = [
    { id: 'hero', title: 'Home · the top of the page', fields: [
      { p: 'home.hero.eyebrow', l: 'Small line above the headline' },
      { p: 'home.hero.title', l: 'Headline' },
      { p: 'home.hero.titleScript', l: 'Headline — handwritten half' },
      { p: 'home.hero.lede', l: 'Intro paragraph', t: 'area' },
      { p: 'home.hero.ctaPrimary.label', l: 'Main button' },
      { p: 'home.hero.ctaPrimary.href', l: 'Main button link' },
      { p: 'home.hero.ctaSecondary.label', l: 'Second button' },
      { p: 'home.hero.ctaSecondary.href', l: 'Second button link' },
      { p: 'home.hero.image', l: 'Hero picture', t: 'image' },
      { p: 'home.hero.imageAlt', l: 'Picture description (for screen readers)' },
      { p: 'home.hero.chipScript', l: 'Floating note (handwritten)', t: 'area' },
      { p: 'home.hero.chipText', l: 'Floating note (with gift icon)', t: 'area' },
      { p: 'home.hero.stats', l: 'Three little facts', t: 'objects',
        fields: [{ k: 'value', l: 'Big text' }, { k: 'label', l: 'Caption' }] }
    ]},
    { id: 'marquee', title: 'Home · scrolling ribbon', fields: [
      { p: 'home.marquee', l: 'Phrases', t: 'strings' }
    ]},
    { id: 'homeSections', title: 'Home · section headings', fields: [
      { p: 'home.categoriesSection.eyebrow', l: 'Categories — eyebrow' },
      { p: 'home.categoriesSection.title', l: 'Categories — title' },
      { p: 'home.categoriesSection.lede', l: 'Categories — text', t: 'area' },
      { p: 'home.featured.eyebrow', l: 'Featured — eyebrow' },
      { p: 'home.featured.title', l: 'Featured — title' },
      { p: 'home.featured.ctaLabel', l: 'Featured — button' }
    ]},
    { id: 'band', title: 'Home · sunset band', fields: [
      { p: 'home.band.eyebrow', l: 'Eyebrow' },
      { p: 'home.band.title', l: 'Title', t: 'area' },
      { p: 'home.band.text', l: 'Text', t: 'area' },
      { p: 'home.band.ctaLabel', l: 'Button' },
      { p: 'home.band.ctaHref', l: 'Button link' }
    ]},
    { id: 'story', title: 'Home · story section', fields: [
      { p: 'home.story.eyebrow', l: 'Eyebrow' },
      { p: 'home.story.title', l: 'Title' },
      { p: 'home.story.lede', l: 'Text', t: 'area' },
      { p: 'home.story.note', l: 'Handwritten note', t: 'area' },
      { p: 'home.story.images', l: 'Two pictures', t: 'strings' },
      { p: 'home.story.linkLabel', l: 'Link text' },
      { p: 'home.story.linkHref', l: 'Link address' },
      { p: 'home.story.points', l: 'Points', t: 'objects',
        fields: [{ k: 'icon', l: 'Icon', t: 'icon' }, { k: 'text', l: 'Text' }] }
    ]},
    { id: 'values', title: 'Home · promise cards', fields: [
      { p: 'home.values.eyebrow', l: 'Eyebrow' },
      { p: 'home.values.title', l: 'Title' },
      { p: 'home.values.items', l: 'Cards', t: 'objects',
        fields: [{ k: 'icon', l: 'Icon', t: 'icon' }, { k: 'title', l: 'Title' }, { k: 'text', l: 'Text', t: 'area' }] }
    ]},
    { id: 'quotes', title: 'Home · reviews', fields: [
      { p: 'home.quotes.eyebrow', l: 'Eyebrow' },
      { p: 'home.quotes.title', l: 'Title' },
      { p: 'home.quotes.items', l: 'Reviews', t: 'objects',
        fields: [{ k: 'text', l: 'Review', t: 'area' }, { k: 'author', l: 'Who said it' }, { k: 'stars', l: 'Stars (1–5)', t: 'number' }] }
    ]},
    { id: 'homeCta', title: 'Home · closing invitation', fields: [
      { p: 'home.cta.eyebrow', l: 'Eyebrow' },
      { p: 'home.cta.title', l: 'Title', t: 'area' },
      { p: 'home.cta.text', l: 'Text', t: 'area' },
      { p: 'home.cta.waLabel', l: 'WhatsApp button' },
      { p: 'home.cta.secondaryLabel', l: 'Second button' },
      { p: 'home.cta.secondaryHref', l: 'Second button link' }
    ]},
    { id: 'shop', title: 'Shop page', fields: [
      { p: 'shop.eyebrow', l: 'Eyebrow' },
      { p: 'shop.title', l: 'Title' },
      { p: 'shop.lede', l: 'Intro', t: 'area' },
      { p: 'shop.filterLabel', l: 'Filter label' },
      { p: 'shop.allLabel', l: '“All gifts” chip' },
      { p: 'shop.cta.eyebrow', l: 'Bottom block — eyebrow' },
      { p: 'shop.cta.title', l: 'Bottom block — title' },
      { p: 'shop.cta.text', l: 'Bottom block — text', t: 'area' },
      { p: 'shop.cta.waLabel', l: 'Bottom block — WhatsApp button' },
      { p: 'shop.cta.secondaryLabel', l: 'Bottom block — second button' }
    ]},
    { id: 'product', title: 'Product page', fields: [
      { p: 'product.addLabel', l: 'Add to cart button' },
      { p: 'product.whatsappLabel', l: 'WhatsApp button' },
      { p: 'product.quantityLabel', l: 'Quantity label' },
      { p: 'product.assurances', l: 'Reassurance lines', t: 'objects',
        fields: [{ k: 'icon', l: 'Icon', t: 'icon' }, { k: 'text', l: 'Text' }] },
      { p: 'product.tabDescription', l: 'First panel title' },
      { p: 'product.tabIncludes', l: 'Second panel title' },
      { p: 'product.tabDelivery', l: 'Third panel title' },
      { p: 'product.deliveryText', l: 'Delivery & returns text', t: 'area' },
      { p: 'product.relatedEyebrow', l: 'Related — eyebrow' },
      { p: 'product.relatedTitle', l: 'Related — title' }
    ]},
    { id: 'cart', title: 'Cart drawer', fields: [
      { p: 'cart.title', l: 'Title' },
      { p: 'cart.emptyTitle', l: 'Empty — title' },
      { p: 'cart.emptyText', l: 'Empty — text', t: 'area' },
      { p: 'cart.browseLabel', l: 'Empty — button' },
      { p: 'cart.subtotalLabel', l: 'Subtotal label' },
      { p: 'cart.note', l: 'Small note under the total' },
      { p: 'cart.checkoutLabel', l: 'Checkout button' },
      { p: 'cart.continueLabel', l: 'Keep shopping button' },
      { p: 'cart.freeAway', l: 'Free delivery — still to go' },
      { p: 'cart.freeDone', l: 'Free delivery — reached' },
      { p: 'cart.addedToast', l: 'Added message' },
      { p: 'cart.whatsappSoon', l: 'Message when WhatsApp is not set up' }
    ]},
    { id: 'checkout', title: 'Checkout page', fields: [
      { p: 'checkout.eyebrow', l: 'Eyebrow' },
      { p: 'checkout.title', l: 'Title' },
      { p: 'checkout.deliveryTitle', l: 'Delivery section title' },
      { p: 'checkout.paymentTitle', l: 'Payment section title' },
      { p: 'checkout.paymentNote', l: 'Payment note' },
      { p: 'checkout.codTitle', l: 'Cash on delivery — title' },
      { p: 'checkout.codText', l: 'Cash on delivery — text', t: 'area' },
      { p: 'checkout.saveLabel', l: 'Save details checkbox' },
      { p: 'checkout.completeLabel', l: 'Complete order button' },
      { p: 'checkout.summaryTitle', l: 'Summary title' },
      { p: 'checkout.secureNote', l: 'Privacy note', t: 'area' },
      { p: 'checkout.emptyTitle', l: 'Empty cart — title' },
      { p: 'checkout.emptyText', l: 'Empty cart — text' }
    ]},
    { id: 'checkoutLabels', title: 'Checkout · field labels', fields: [
      { p: 'checkout.labels.country', l: 'Country' },
      { p: 'checkout.labels.firstName', l: 'First name' },
      { p: 'checkout.labels.lastName', l: 'Last name' },
      { p: 'checkout.labels.address', l: 'Address' },
      { p: 'checkout.labels.apartment', l: 'Apartment / floor' },
      { p: 'checkout.labels.city', l: 'City' },
      { p: 'checkout.labels.phone', l: 'Phone' },
      { p: 'checkout.labels.email', l: 'Email' },
      { p: 'checkout.labels.note', l: 'Card note' }
    ]},
    { id: 'confirm', title: 'Thank-you page', fields: [
      { p: 'confirm.thanks', l: 'Greeting' },
      { p: 'confirm.title', l: 'Title' },
      { p: 'confirm.text', l: 'Text', t: 'area' },
      { p: 'confirm.keepLabel', l: 'Keep browsing button' },
      { p: 'confirm.askLabel', l: 'Ask about order button' }
    ]},
    { id: 'contact', title: 'Contact page', fields: [
      { p: 'contact.eyebrow', l: 'Eyebrow' },
      { p: 'contact.title', l: 'Title' },
      { p: 'contact.lede', l: 'Intro', t: 'area' },
      { p: 'contact.formTitle', l: 'Form title' },
      { p: 'contact.formLede', l: 'Form intro' },
      { p: 'contact.sendLabel', l: 'Send button' },
      { p: 'contact.sentMessage', l: 'Message after sending' },
      { p: 'contact.info', l: 'Contact blocks', t: 'objects',
        fields: [{ k: 'icon', l: 'Icon', t: 'icon' }, { k: 'title', l: 'Title' },
                 { k: 'text', l: 'Text', t: 'area' }, { k: 'link', l: 'Link (optional)' }] }
    ]},
    { id: 'faq', title: 'Questions & answers', fields: [
      { p: 'contact.faqEyebrow', l: 'Eyebrow' },
      { p: 'contact.faqTitle', l: 'Title' },
      { p: 'contact.faq', l: 'Questions', t: 'objects',
        fields: [{ k: 'q', l: 'Question' }, { k: 'a', l: 'Answer', t: 'area' }] }
    ]},
    { id: 'footer', title: 'Footer', fields: [
      { p: 'footer.about', l: 'About line', t: 'area' },
      { p: 'footer.contactTitle', l: 'Contact column title' },
      { p: 'footer.bottomNote', l: 'Bottom line' },
      { p: 'footer.columns', l: 'Link columns', t: 'objects',
        fields: [{ k: 'title', l: 'Column title' }] }
    ]}
  ];

  function viewContent() {
    return SECTIONS.map(section => {
      const open = state.openSections[section.id];
      const body = open ? section.fields.map(renderField).join('') +
        (section.id === 'footer' ? footerLinksEditor() : '') : '';
      return [
        '<div class="card">',
        '<div class="card__head" style="margin-bottom:' + (open ? '18px' : '0') + '">',
        '<h2>' + esc(section.title) + '</h2>',
        '<button class="btn btn--ghost btn--sm" data-section="' + section.id + '">' + (open ? 'Close' : 'Edit') + '</button>',
        '</div>', body, '</div>'
      ].join('');
    }).join('');
  }

  function renderField(field) {
    if (field.t === 'area') return fArea(field.p, field.l, { rows: 3 });
    if (field.t === 'image') return fImage(field.p, field.l);
    if (field.t === 'strings') return fStrings(field.p, field.l);
    if (field.t === 'number') return fNum(field.p, field.l);
    if (field.t === 'objects') return fObjects(field.p, field.l, field.fields);
    return fText(field.p, field.l);
  }

  function footerLinksEditor() {
    return (state.content.footer.columns || []).map((column, ci) =>
      '<div class="subform"><div class="subform__head"><strong>' + esc(column.title || 'Column') + ' links</strong></div>' +
      fObjects('footer.columns.' + ci + '.links', 'Link', [{ k: 'label', l: 'Text' }, { k: 'href', l: 'Address' }]) +
      '</div>').join('');
  }

  /* ------------------------------------------------------------- appearance */
  function viewAppearance() {
    const theme = state.content.theme || {};
    const swatches = ['wine', 'wineDeep', 'wineSoft', 'blush', 'cream', 'creamLight', 'ink', 'gold']
      .map(key => '<div style="text-align:center"><div style="height:54px;border-radius:10px;border:1px solid var(--line);background:' +
        esc(theme[key] || '#fff') + '"></div><div class="field__hint" style="margin-top:6px">' + esc(key) + '</div></div>').join('');

    return [
      card('Colours',
        '<div class="row row--2">' +
        fColour('theme.wine', 'Main colour') + fColour('theme.wineDeep', 'Dark shade') +
        fColour('theme.wineSoft', 'Soft shade') + fColour('theme.blush', 'Blush') +
        fColour('theme.cream', 'Cream') + fColour('theme.creamLight', 'Page background') +
        fColour('theme.ink', 'Text colour') + fColour('theme.gold', 'Accent / stars') +
        '</div>' +
        '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(90px,1fr));margin-top:10px">' + swatches + '</div>' +
        '<button class="btn btn--ghost btn--sm" style="margin-top:16px" data-match-shades>Match the dark &amp; soft shades to the main colour</button>'),
      card('Type & shape',
        '<div class="row row--3">' +
        fSelect('theme.fontDisplay', 'Headings', FONTS_DISPLAY) +
        fSelect('theme.fontSans', 'Body text', FONTS_SANS) +
        fSelect('theme.fontScript', 'Handwriting', FONTS_SCRIPT) +
        '</div>' +
        fNum('theme.radius', 'Corner roundness (px)', { min: 0, step: '1', hint: '0 for square corners, 24 for the current look' }) +
        '<p class="field__hint">Fonts come from Google Fonts and load automatically on the shop.</p>'),
      card('Preview',
        '<div style="background:' + esc(theme.creamLight) + ';border-radius:' + (theme.radius || 24) + 'px;padding:28px;border:1px solid var(--line)">' +
        '<p style="font-family:\'' + esc(theme.fontScript) + '\',cursive;font-size:1.6rem;color:' + esc(theme.wineSoft) + ';margin-bottom:6px">Small gifts. Big feelings.</p>' +
        '<h3 style="font-family:\'' + esc(theme.fontDisplay) + '\',serif;font-size:2rem;color:' + esc(theme.wine) + '">The perfect gift</h3>' +
        '<p style="font-family:\'' + esc(theme.fontSans) + '\',sans-serif;color:' + esc(theme.ink) + ';margin:10px 0 18px">This is how your body text will look on the shop.</p>' +
        '<span style="display:inline-block;background:' + esc(theme.wine) + ';color:' + esc(theme.creamLight) +
        ';border-radius:999px;padding:12px 26px;font-size:.8rem;letter-spacing:.18em;text-transform:uppercase">Shop now</span>' +
        '</div>',
        '<button class="btn btn--ghost btn--sm" data-reset-theme>Reset colours</button>')
    ].join('');
  }

  /* ------------------------------------------------------------- settings */
  function viewSettings() {
    return [
      card('The basics',
        '<div class="row row--2">' + fText('settings.brand', 'Shop name') + fText('settings.tagline', 'Tagline') + '</div>' +
        '<div class="row row--3">' + fText('settings.currency', 'Currency symbol') +
        fSelect('settings.currencyPosition', 'Symbol position', [{ value: 'before', label: 'Before the number ($10)' }, { value: 'after', label: 'After the number (10 $)' }]) +
        fText('settings.deliveryTime', 'Delivery time') + '</div>'),

      card('WhatsApp',
        fText('settings.whatsapp', 'WhatsApp number', { placeholder: '9613123456', hint: 'Digits only, with the country code. Leave empty to keep the chat buttons switched off.' }) +
        fArea('settings.whatsappGreeting', 'Message the chat opens with', { rows: 2 }) +
        fText('navWhatsappLabel', 'Button label')),

      card('Contact details',
        '<div class="row row--2">' + fText('settings.email', 'Email address') + fText('settings.phone', 'Phone (optional)') + '</div>' +
        fText('settings.hours', 'Opening hours') +
        '<div class="row row--3">' + fText('settings.socials.instagram', 'Instagram link') +
        fText('settings.socials.facebook', 'Facebook link') + fText('settings.socials.tiktok', 'TikTok link') + '</div>'),

      card('Delivery & payment',
        '<div class="row row--2">' + fNum('settings.shippingFlat', 'Delivery fee', { min: 0, step: '0.01' }) +
        fNum('settings.freeShippingOver', 'Free delivery over', { min: 0, step: '0.01', hint: 'Set to 0 to switch free delivery off' }) + '</div>' +
        fText('settings.paymentNote', 'Payment note', { hint: 'Shown in the footer and on the order' }) +
        fStrings('settings.countries', 'Countries you deliver to', { placeholder: 'Add a country' })),

      card('Order alerts on WhatsApp',
        fSwitch('settings.notifications.whatsappEnabled', 'Message me on WhatsApp when an order arrives') +
        fSwitch('settings.notifications.includeCustomer', 'Include the customer’s name, address and phone in that message') +
        '<div class="field__hint" data-notify-status style="margin-top:4px">Checking…</div>' +
        '<button class="btn btn--ghost btn--sm" style="margin-top:14px" data-notify-test>Send a test message</button>'),

      card('Announcement bar',
        fSwitch('settings.announcement.enabled', 'Show a bar at the very top of the site') +
        fText('settings.announcement.text', 'Bar text')),

      card('Menu',
        '<p class="field__hint" style="margin-bottom:14px">The three links in the navigation bar.</p>' +
        fObjects('nav', 'Menu link', [{ k: 'label', l: 'Text' }, { k: 'href', l: 'Address' }]))
    ].join('');
  }

  /* ------------------------------------------------------------- media */
  function viewMedia() {
    const tiles = state.images.map(image => [
      '<div class="media">',
      '<img src="' + esc(image.url) + '" alt="' + esc(image.name) + '" loading="lazy">',
      '<div class="media__bar"><span class="media__name">' + esc(image.name) + '</span>',
      '<button class="iconbtn" data-copy-url="' + esc(image.url) + '" title="Copy link" aria-label="Copy the link to ' + esc(image.name) + '">' + ICON.copy + '</button>',
      '<button class="iconbtn iconbtn--danger" data-delete-image="' + esc(image.id) + '" title="Delete" aria-label="Delete ' + esc(image.name) + '">' + ICON.trash + '</button>',
      '</div></div>'
    ].join('')).join('');

    return card('Your pictures', [
      '<p class="field__hint" style="margin-bottom:16px">Upload photos here, then pick them for products, categories or the home page. Big photos are shrunk automatically.</p>',
      '<input type="file" accept="image/*" multiple data-upload hidden>',
      state.images.length ? '<div class="grid grid--media">' + tiles + '</div>'
        : '<div class="empty"><h3>No pictures yet</h3><p>Upload your product photos and they will appear here.</p></div>'
    ].join(''), '<button class="btn btn--sm" data-upload-trigger>' + ICON.plus + ' Upload pictures</button>');
  }

  async function bindNotify() {
    const box = $('[data-notify-status]');
    if (!box) return;
    try {
      const info = await api('/api/notify');
      box.innerHTML = info.ready
        ? '<span style="color:var(--ok)">●</span> Ready — ' + esc(info.providerName) + ' will message ' + esc(info.to) +
          (info.enabled ? '' : ' <strong>(alerts are switched off above)</strong>')
        : '<span style="color:var(--warn)">●</span> ' + esc(info.reason || 'Not set up yet.') +
          ' Add the provider keys in Vercel — the README lists them.';
    } catch (err) {
      box.textContent = err.message;
    }
  }

  function bindMedia() {
    const input = $('[data-upload]');
    const trigger = $('[data-upload-trigger]');
    if (!input || !trigger) return;
    trigger.onclick = () => input.click();
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      toast('Uploading ' + files.length + ' picture' + (files.length > 1 ? 's' : '') + '…');
      for (const file of files) {
        try {
          const dataUrl = await shrink(file);
          await api('/api/media', { method: 'POST', body: { name: file.name, dataUrl: dataUrl } });
        } catch (err) { toast(file.name + ': ' + err.message, 'bad'); }
      }
      await loadImages();
      render();
      toast('Pictures uploaded', 'good');
    };
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read that file'));
      reader.readAsDataURL(file);
    });
  }

  async function shrink(file) {
    const dataUrl = await readFile(file);
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') return dataUrl;
    if (file.size < 260 * 1024) return dataUrl;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const max = 1400;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  /* ------------------------------------------------------------- account */
  function viewAccount() {
    return [
      card('Change password',
        '<label class="field"><span>Current password</span><input type="password" data-pw-current autocomplete="current-password"></label>' +
        '<label class="field"><span>New password</span><input type="password" data-pw-next autocomplete="new-password"></label>' +
        '<label class="field"><span>Repeat new password</span><input type="password" data-pw-again autocomplete="new-password"></label>' +
        '<button class="btn btn--sm" data-pw-save>Change password</button>' +
        '<p class="field__hint" style="margin-top:10px">Changing it signs you out of every other device. The ADMIN_PASSWORD variable in Vercel stops being used once you set a password here.</p>'),

      card('Backup',
        '<p class="field__hint" style="margin-bottom:14px">Download everything — products, text, colours and settings — as one file, or restore it later.</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn btn--ghost btn--sm" data-export>' + ICON.download + ' Download backup</button>' +
        '<button class="btn btn--ghost btn--sm" data-import-trigger>Restore from a backup</button>' +
        '<input type="file" accept="application/json" data-import hidden>' +
        '</div>'),

      card('Start again',
        '<p class="field__hint" style="margin-bottom:14px">Undo puts back the version before your last save. Reset throws away everything you have saved and returns the shop to the content it shipped with.</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn btn--ghost btn--sm" data-undo>Undo my last save</button>' +
        '<button class="btn btn--danger btn--sm" data-reset>Reset the whole shop</button>' +
        '</div>'),

      card('Connection',
        '<p>Storage: <strong>' + (state.store === 'redis' ? 'connected database' : 'demo mode (no database)') + '</strong></p>' +
        '<p class="field__hint" style="margin-top:6px">' +
        (state.store === 'redis'
          ? 'Everything you save is stored safely and shown to every visitor.'
          : 'Add a KV / Upstash Redis store in Vercel (Storage → Create), redeploy, and this will switch to a real database.') +
        '</p>')
    ].join('');
  }

  /* ------------------------------------------------------------- image picker */
  function openPicker(path) {
    const artName = (src) => src.split('/').pop().replace(/^(p|scene)-/, '').replace(/\.svg$/, '').replace(/-/g, ' ');
    const library = state.images.map(image =>
      '<button class="media" data-choose="' + esc(image.url) + '" style="padding:0;border:1px solid var(--line)" aria-label="Use ' + esc(image.name) + '">' +
      '<img src="' + esc(image.url) + '" alt="' + esc(image.name) + '" loading="lazy"></button>').join('');
    const art = ARTWORK.map(src =>
      '<button class="media" data-choose="' + esc(src) + '" style="padding:0;border:1px solid var(--line)" aria-label="Use the ' + esc(artName(src)) + ' illustration">' +
      '<img src="/' + esc(src) + '" alt="" loading="lazy"></button>').join('');

    modal([
      '<div class="modal__head"><h2>Choose a picture</h2><button class="iconbtn" data-close aria-label="Close">' + ICON.close + '</button></div>',
      '<label class="field"><span>Paste a link</span><div style="display:flex;gap:8px">',
      '<input type="text" data-url-input placeholder="https://…" aria-label="Image link"><button class="btn btn--sm" data-url-use>Use</button></div></label>',
      '<div class="card__head" style="margin:18px 0 10px"><h2 style="font-size:1rem">Your uploads</h2>',
      '<button class="btn btn--ghost btn--sm" data-picker-upload>Upload new</button>',
      '<input type="file" accept="image/*" data-picker-file hidden></div>',
      state.images.length ? '<div class="grid grid--media">' + library + '</div>'
        : '<p class="field__hint">Nothing uploaded yet.</p>',
      '<h2 style="font-size:1rem;margin:22px 0 10px">Built-in artwork</h2>',
      '<div class="grid grid--media">' + art + '</div>'
    ].join(''), (host) => {
      $('[data-close]', host).onclick = closeModal;
      const finish = (value) => {
        setPath(state.content, path, value);
        closeModal();
        markDirty();
        render();
        const product = /^products\.(\d+)\./.exec(path);
        if (product) editProduct(Number(product[1]));
      };
      $$('[data-choose]', host).forEach(btn => { btn.onclick = () => finish(btn.dataset.choose); });
      $('[data-url-use]', host).onclick = () => {
        const value = $('[data-url-input]', host).value.trim();
        if (value) finish(value);
      };
      const file = $('[data-picker-file]', host);
      $('[data-picker-upload]', host).onclick = () => file.click();
      file.onchange = async () => {
        if (!file.files || !file.files[0]) return;
        try {
          const dataUrl = await shrink(file.files[0]);
          const payload = await api('/api/media', { method: 'POST', body: { name: file.files[0].name, dataUrl: dataUrl } });
          await loadImages();
          finish(payload.image.url);
          toast('Picture uploaded', 'good');
        } catch (err) { toast(err.message, 'bad'); }
      };
    });
  }

  /* ------------------------------------------------------------- events */
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-bind]');
    if (el) {
      let value = el.type === 'checkbox' ? el.checked : el.value;
      if (el.dataset.type === 'number') value = value === '' ? null : Number(value);
      setPath(state.content, el.dataset.bind, value);

      /* While an id is still the generated placeholder, keep it in step with the name. */
      const named = /^(products|categories)\.(\d+)\.name$/.exec(el.dataset.bind);
      if (named) {
        const list = state.content[named[1]];
        const index = Number(named[2]);
        const entry = list[index];
        if (entry && /^(gift|new)-[a-z0-9]{4,}$/.test(entry.id || '')) {
          entry.id = uniqueId(slugify(value) || entry.id, list, index);
          const idInput = document.querySelector('[data-bind="' + named[1] + '.' + index + '.id"]');
          if (idInput) idInput.value = entry.id;
        }
        const title = document.querySelector('.modal__head h2');
        if (title && named[1] === 'products') title.textContent = value || 'Product';
        const heading = el.closest('.subform');
        if (heading) {
          const label = heading.querySelector('.subform__head strong');
          if (label) label.textContent = value || 'Untitled';
        }
      }

      if (el.dataset.colourText) {
        const swatch = document.querySelector('[data-colour="' + el.dataset.colourText + '"]');
        if (swatch && /^#[0-9a-f]{6}$/i.test(value)) swatch.value = value;
      }
      markDirty();
      return;
    }
    const colour = e.target.closest('[data-colour]');
    if (colour) {
      setPath(state.content, colour.dataset.colour, colour.value);
      const text = document.querySelector('[data-colour-text="' + colour.dataset.colour + '"]');
      if (text) text.value = colour.value;
      markDirty();
      return;
    }
    const search = e.target.closest('[data-product-search]');
    if (search) {
      state.productSearch = search.value;
      const list = $('[data-view] .list');
      render();
      const again = $('[data-product-search]');
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    }
  });

  function closeSide() {
    document.body.classList.remove('side-open');
    const toggle = document.querySelector('[data-side-toggle]');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('side-open')) closeSide();
    const input = e.target.closest('[data-string-input]');
    if (input && e.key === 'Enter') { e.preventDefault(); addString(input.dataset.stringInput, input); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (!$('[data-save]').disabled) save();
    }
  });

  function addString(path, input) {
    const value = input.value.trim();
    if (!value) return;
    const list = get(path) || [];
    list.push(value);
    setPath(state.content, path, list);
    markDirty();
    render();
  }

  document.addEventListener('click', async (e) => {
    const t = e.target;
    const hit = (sel) => t.closest(sel);

    const nav = hit('[data-go]');
    if (nav) return go(nav.dataset.go);

    if (hit('[data-save]')) return save();
    if (hit('[data-side-toggle]')) {
      const open = document.body.classList.toggle('side-open');
      t.closest('[data-side-toggle]').setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }
    if (hit('[data-side-close]')) return closeSide();

    if (hit('[data-discard]')) {
      return confirmAction('Throw away the changes you have not saved?', async () => {
        await loadContent();
        render();
        toast('Changes discarded');
      });
    }

    if (hit('[data-logout]')) {
      return confirmAction('Sign out of the dashboard?', async () => {
        try { await api('/api/auth', { method: 'POST', body: { action: 'logout' } }); } catch (err) {}
        location.reload();
      });
    }

    const section = hit('[data-section]');
    if (section) {
      state.openSections[section.dataset.section] = !state.openSections[section.dataset.section];
      return render();
    }

    const orderBtn = hit('[data-order]');
    if (orderBtn) return openOrder(orderBtn.dataset.order);

    const filter = hit('[data-order-filter]');
    if (filter) { state.orderFilter = filter.dataset.orderFilter; return render(); }

    if (hit('[data-orders-refresh]')) { await loadOrders(); renderSidebar(); render(); return toast('Orders refreshed'); }
    if (hit('[data-orders-csv]')) return ordersCsv();

    /* products */
    if (hit('[data-add-product]')) {
      const list = state.content.products;
      list.unshift({
        id: 'gift-' + Date.now().toString(36), name: 'New gift', script: '', price: 20, compareAt: null,
        category: (state.content.categories[0] || {}).id || 'everyone', badge: '',
        image: 'assets/img/scene-wrap.svg', images: [], short: '', description: '',
        includes: [], tags: [], active: true, featured: false
      });
      markDirty(); render();
      return editProduct(0);
    }
    const editBtn = hit('[data-edit-product]');
    if (editBtn) return editProduct(Number(editBtn.dataset.editProduct));

    const dup = hit('[data-duplicate]');
    if (dup) {
      const index = Number(dup.dataset.duplicate);
      const copy = clone(state.content.products[index]);
      copy.id = copy.id + '-copy';
      copy.name = copy.name + ' (copy)';
      state.content.products.splice(index + 1, 0, copy);
      markDirty(); return render();
    }
    const delProduct = hit('[data-delete-product]');
    if (delProduct) {
      const index = Number(delProduct.dataset.deleteProduct);
      const product = state.content.products[index];
      return confirmAction('Delete “' + product.name + '”? Past orders keep their details.', () => {
        state.content.products.splice(index, 1);
        markDirty(); render();
      }, true);
    }
    const swap = hit('[data-gallery-swap]');
    if (swap) {
      closeModal();
      return openPicker(swap.dataset.gallerySwap + '.' + swap.dataset.index);
    }
    const removeShot = hit('[data-gallery-remove]');
    if (removeShot) {
      const list = get(removeShot.dataset.galleryRemove) || [];
      list.splice(Number(removeShot.dataset.index), 1);
      markDirty();
      const modalOpen = document.querySelector('.modal__card');
      if (modalOpen) { const i = /products\.(\d+)/.exec(removeShot.dataset.galleryRemove); closeModal(); render(); if (i) editProduct(Number(i[1])); }
      else render();
      return;
    }
    const gallery = hit('[data-add-gallery]');
    if (gallery) {
      const index = Number(gallery.dataset.addGallery);
      const list = state.content.products[index].images || [];
      list.push('');
      setPath(state.content, 'products.' + index + '.images', list);
      closeModal();
      return openPicker('products.' + index + '.images.' + (list.length - 1));
    }

    /* categories */
    if (hit('[data-add-category]')) {
      state.content.categories.push({ id: 'new-' + Date.now().toString(36), name: 'New category', blurb: '', intro: '', image: 'assets/img/p-cards.svg' });
      markDirty(); return render();
    }
    const delCategory = hit('[data-delete-category]');
    if (delCategory) {
      const index = Number(delCategory.dataset.deleteCategory);
      const category = state.content.categories[index];
      const used = state.content.products.filter(p => p.category === category.id).length;
      if (used) return toast(used + ' product' + (used > 1 ? 's are' : ' is') + ' still in this category. Move them first.', 'bad');
      return confirmAction('Delete the “' + category.name + '” category?', () => {
        state.content.categories.splice(index, 1);
        markDirty(); render();
      }, true);
    }

    /* generic list controls */
    const move = hit('[data-move]');
    if (move) {
      const list = get(move.dataset.move);
      const index = Number(move.dataset.index);
      const target = index + Number(move.dataset.dir);
      if (target < 0 || target >= list.length) return;
      list.splice(target, 0, list.splice(index, 1)[0]);
      markDirty(); return render();
    }
    const removeItem = hit('[data-remove-item]');
    if (removeItem) {
      const list = get(removeItem.dataset.removeItem);
      list.splice(Number(removeItem.dataset.index), 1);
      markDirty(); return render();
    }
    const addItem = hit('[data-add-item]');
    if (addItem) {
      const list = get(addItem.dataset.addItem) || [];
      list.push(JSON.parse(addItem.dataset.template));
      setPath(state.content, addItem.dataset.addItem, list);
      markDirty(); return render();
    }
    const stringAdd = hit('[data-string-add]');
    if (stringAdd) {
      const input = document.querySelector('[data-string-input="' + stringAdd.dataset.stringAdd + '"]');
      return addString(stringAdd.dataset.stringAdd, input);
    }
    const stringRemove = hit('[data-string-remove]');
    if (stringRemove) {
      const list = get(stringRemove.dataset.stringRemove);
      list.splice(Number(stringRemove.dataset.index), 1);
      markDirty(); return render();
    }

    /* images */
    const pick = hit('[data-pick]');
    if (pick) return openPicker(pick.dataset.pick);
    const clear = hit('[data-clear]');
    if (clear) { setPath(state.content, clear.dataset.clear, ''); markDirty(); return render(); }
    const copyUrl = hit('[data-copy-url]');
    if (copyUrl) {
      return navigator.clipboard.writeText(location.origin + copyUrl.dataset.copyUrl)
        .then(() => toast('Link copied', 'good'), () => toast('Could not copy', 'bad'));
    }
    const delImage = hit('[data-delete-image]');
    if (delImage) {
      return confirmAction('Delete this picture? Anything still using it will show a blank space.', async () => {
        try {
          await api('/api/media?id=' + encodeURIComponent(delImage.dataset.deleteImage), { method: 'DELETE' });
          await loadImages(); render(); toast('Picture deleted', 'good');
        } catch (err) { toast(err.message, 'bad'); }
      }, true);
    }

    /* notifications */
    if (hit('[data-notify-test]')) {
      const button = t.closest('[data-notify-test]');
      const label = button.textContent;
      button.disabled = true;
      button.textContent = 'Sending…';
      try {
        const result = await api('/api/notify', { method: 'POST', body: {} });
        toast('Test sent to ' + result.to + ' via ' + result.provider, 'good');
      } catch (err) { toast(err.message, 'bad'); }
      button.disabled = false;
      button.textContent = label;
      return;
    }

    /* appearance */
    if (hit('[data-match-shades]')) {
      const base = state.content.theme.wine;
      state.content.theme.wineDeep = mix(base, '#000000', 0.3);
      state.content.theme.wineSoft = mix(base, '#ffffff', 0.24);
      markDirty(); render();
      return toast('Shades matched', 'good');
    }
    if (hit('[data-reset-theme]')) {
      return confirmAction('Put the original colours back?', () => {
        state.content.theme = clone(window.LB_DEFAULT_CONTENT.theme);
        markDirty(); render();
      });
    }

    /* account */
    if (hit('[data-pw-save]')) {
      const current = $('[data-pw-current]').value;
      const next = $('[data-pw-next]').value;
      const again = $('[data-pw-again]').value;
      if (next !== again) return toast('The two new passwords do not match.', 'bad');
      try {
        await api('/api/auth', { method: 'POST', body: { action: 'password', current: current, next: next } });
        toast('Password changed', 'good');
        render();
      } catch (err) { toast(err.message, 'bad'); }
      return;
    }
    if (hit('[data-export]')) {
      const stamp = new Date().toISOString().slice(0, 10);
      return download(new Blob([JSON.stringify(state.content, null, 2)], { type: 'application/json' }),
        'lovebirds-backup-' + stamp + '.json');
    }
    if (hit('[data-import-trigger]')) return $('[data-import]').click();
    if (hit('[data-undo]')) {
      return confirmAction('Put back the version from before your last save?', async () => {
        try {
          const payload = await api('/api/content', { method: 'POST', body: { action: 'undo' } });
          state.content = payload.content;
          state.saved = JSON.stringify(payload.content);
          render(); toast('Previous version restored', 'good');
        } catch (err) { toast(err.message, 'bad'); }
      });
    }
    if (hit('[data-reset]')) {
      return confirmAction('This deletes everything you have saved and puts the original shop back. Are you sure?', async () => {
        try {
          await api('/api/content', { method: 'POST', body: { action: 'reset' } });
          await loadContent();
          render(); toast('The shop is back to its original content', 'good');
        } catch (err) { toast(err.message, 'bad'); }
      }, true);
    }
  });

  document.addEventListener('change', (e) => {
    const importer = e.target.closest('[data-import]');
    if (!importer || !importer.files || !importer.files[0]) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.products)) throw new Error('That file is not a lovebirds backup.');
        state.content = parsed;
        markDirty();
        render();
        toast('Backup loaded — press Save changes to publish it', 'good');
      } catch (err) { toast(err.message, 'bad'); }
    };
    reader.readAsText(importer.files[0]);
  });

  window.addEventListener('beforeunload', (e) => {
    if (state.content && JSON.stringify(state.content) !== state.saved && state.saved) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  /* ------------------------------------------------------------- boot */
  A.views = Object.assign(A.views, {
    products: viewProducts, categories: viewCategories, content: viewContent,
    appearance: viewAppearance, settings: viewSettings, media: viewMedia, account: viewAccount,
    afterRender: (view) => {
      if (view === 'media') bindMedia();
      if (view === 'settings') bindNotify();
    }
  });

  A.boot = async function boot() {
    await loadContent();
    await Promise.all([loadOrders(), loadImages()]);
    $('[data-app]').hidden = false;
    const hash = (location.hash || '').replace('#/', '');
    state.view = VIEWS.some(v => v.id === hash) ? hash : 'overview';
    renderSidebar();
    render();
  };

  document.addEventListener('DOMContentLoaded', async () => {
    initLogin();
    if (await checkSession()) {
      $('[data-gate]').hidden = true;
      await A.boot();
    } else {
      openGate();
    }
  });
})();
