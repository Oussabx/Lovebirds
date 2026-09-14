/* Home page — category tiles + featured gifts */
(function () {
  const { $, productCard, observe } = window.LB;

  const cats = $('[data-categories]');
  if (cats) {
    cats.innerHTML = CATEGORIES.map(c => [
      '<a class="cat-card" href="categories.html?cat=' + c.id + '">',
      '<div class="cat-card__media"><img src="' + c.image + '" alt="' + c.name + '" loading="lazy" width="640" height="640"></div>',
      '<div class="cat-card__body"><h3>' + c.name + '</h3><p>' + c.blurb + '</p></div>',
      '</a>'
    ].join('')).join('');
  }

  const feat = $('[data-featured]');
  if (feat) {
    const picks = ['just-because-box', 'better-together-mugs', 'good-things-candle', 'little-bear-bundle',
                   'dried-bloom-posy', 'first-date-memory-box', 'you-matter-cards', 'heart-keychain-pair'];
    feat.innerHTML = picks.map(id => getProduct(id)).filter(Boolean).map(p => productCard(p)).join('');
  }

  observe();
})();
