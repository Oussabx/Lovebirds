/* Categories / shop page — filtering + sorting */
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
  if (active !== 'all' && !getCategory(active)) active = 'all';

  const BLURBS = {
    all: 'Every gift we make, in one place — small things that say the big thing.',
    couples: 'For the person who knows how you take your coffee.',
    friends: 'For the people who picked you back.',
    family: 'For the ones who were there first.',
    everyone: 'For no reason at all, which is the best reason.'
  };

  function chips() {
    const list = [{ id: 'all', name: 'All gifts' }].concat(CATEGORIES);
    chipsBox.innerHTML = '<span class="filters__label">Shop for</span>' + list.map(c =>
      '<button class="chip' + (c.id === active ? ' is-active' : '') + '" data-cat="' + c.id + '">' + c.name + '</button>'
    ).join('');
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
    const list = sorted(active === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === active));
    grid.innerHTML = list.map(p => productCard(p)).join('');
    if (countEl) countEl.textContent = list.length + (list.length === 1 ? ' gift' : ' gifts');
    if (titleEl) titleEl.textContent = active === 'all' ? 'All gifts' : categoryName(active);
    if (blurbEl) blurbEl.textContent = BLURBS[active] || BLURBS.all;
    observe(grid);
    refreshParallax();
  }

  chipsBox.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-cat]');
    if (!chip) return;
    active = chip.dataset.cat;
    $$('.chip', chipsBox).forEach(c => c.classList.toggle('is-active', c.dataset.cat === active));
    const url = active === 'all' ? location.pathname : location.pathname + '?cat=' + active;
    history.replaceState({}, '', url);
    render();
  });

  if (sortEl) sortEl.addEventListener('change', render);

  chips();
  render();
})();
