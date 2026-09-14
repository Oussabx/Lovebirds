/* Categories / shop page — filtering and sorting over the live catalogue */
(function () {
  const { $, $$, productCard, observe, refreshParallax } = window.LB;

  const grid = $('[data-grid]');
  if (!grid) return;

  const chipsBox = $('[data-filters]');
  const countEl = $('[data-count]');
  const sortEl = $('[data-sort]');
  const titleEl = $('[data-cat-title]');
  const blurbEl = $('[data-cat-blurb]');

  const params = new URLSearchParams(location.search);
  let active = params.get('cat') || 'all';

  function chips() {
    const shop = COPY.shop || {};
    const list = [{ id: 'all', name: shop.allLabel || 'All gifts' }].concat(CATEGORIES);
    chipsBox.innerHTML = '<span class="filters__label">' + (shop.filterLabel || 'Shop for') + '</span>' +
      list.map(c => '<button class="chip' + (c.id === active ? ' is-active' : '') + '" data-cat="' + c.id + '">' + c.name + '</button>').join('');
  }

  function sorted(list) {
    const mode = sortEl ? sortEl.value : 'featured';
    const out = list.slice();
    if (mode === 'price-asc') out.sort((a, b) => a.price - b.price);
    else if (mode === 'price-desc') out.sort((a, b) => b.price - a.price);
    else if (mode === 'name') out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }

  function render() {
    const shop = COPY.shop || {};
    if (active !== 'all' && !getCategory(active)) active = 'all';

    const list = sorted(active === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === active));
    grid.innerHTML = list.length
      ? list.map(p => productCard(p)).join('')
      : '<div class="empty" style="grid-column:1/-1">' + window.LB.ICONS.heartLine +
        '<h3>Nothing here yet</h3><p>This category is waiting for its first gift.</p></div>';

    if (countEl) countEl.textContent = list.length + (list.length === 1 ? ' gift' : ' gifts');
    if (titleEl) titleEl.textContent = active === 'all' ? (shop.title || 'All gifts') : categoryName(active);
    if (blurbEl) {
      const category = getCategory(active);
      blurbEl.textContent = active === 'all' ? (shop.lede || '') : ((category && category.intro) || shop.lede || '');
    }
    observe(grid);
    refreshParallax();
  }

  chipsBox.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-cat]');
    if (!chip) return;
    active = chip.dataset.cat;
    $$('.chip', chipsBox).forEach(c => c.classList.toggle('is-active', c.dataset.cat === active));
    history.replaceState({}, '', active === 'all' ? location.pathname : location.pathname + '?cat=' + active);
    render();
  });

  if (sortEl) sortEl.addEventListener('change', render);

  function boot() { chips(); render(); }
  LBContent.ready.then(boot);
  document.addEventListener('content:change', boot);
})();
