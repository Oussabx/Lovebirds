/* Home page — every section is drawn from the live content */
(function () {
  const { $, ICONS, productCard, observe, refreshParallax } = window.LB;

  function icon(name) { return ICONS[name] || ICONS.heart; }

  function render() {
    const home = COPY.home || {};

    const cats = $('[data-categories]');
    if (cats) {
      cats.innerHTML = CATEGORIES.map(c => [
        '<a class="cat-card" href="categories.html?cat=' + c.id + '">',
        '<div class="cat-card__media"><img src="' + c.image + '" alt="' + c.name + '" loading="lazy" width="640" height="640"></div>',
        '<div class="cat-card__body"><h3>' + c.name + '</h3><p>' + (c.blurb || '') + '</p></div>',
        '</a>'
      ].join('')).join('');
    }

    const feat = $('[data-featured]');
    if (feat) {
      let picks = PRODUCTS.filter(p => p.featured);
      if (!picks.length) picks = PRODUCTS.slice(0, 8);
      feat.innerHTML = picks.slice(0, 8).map(p => productCard(p)).join('');
    }

    const stats = $('[data-hero-stats]');
    if (stats && home.hero) {
      stats.innerHTML = (home.hero.stats || []).filter(s => s && (String(s.value || '').trim() || String(s.label || '').trim())).map(s =>
        '<div><strong>' + s.value + '</strong><span>' + s.label + '</span></div>').join('');
    }

    const marquee = $('[data-marquee]');
    if (marquee) {
      const items = (home.marquee || []).filter(text => String(text || '').trim()).map(text =>
        '<span>' + text + '</span>' + ICONS.heart).join('');
      marquee.innerHTML = '<div class="marquee__group">' + items + '</div><div class="marquee__group">' + items + '</div>';
    }

    const storyImages = $('[data-story-images]');
    if (storyImages && home.story) {
      const images = home.story.images || [];
      storyImages.innerHTML = images.map((src, i) =>
        '<img src="' + src + '" alt="" width="640" height="640" loading="lazy" data-parallax="' + (i % 2 ? '-0.04' : '0.04') + '">'
      ).join('') + (home.story.note
        ? '<span class="story__note">' + String(home.story.note).replace(/\n/g, '<br>') + '</span>' : '');
    }

    const points = $('[data-story-points]');
    if (points && home.story) {
      points.innerHTML = (home.story.points || []).filter(p => p && String(p.text || '').trim()).map(p =>
        '<li>' + icon(p.icon) + ' ' + p.text + '</li>').join('');
    }

    const values = $('[data-values]');
    if (values && home.values) {
      values.innerHTML = (home.values.items || []).filter(v => v && (String(v.title || '').trim() || String(v.text || '').trim())).map(v => [
        '<div class="value"><div class="value__icon">' + icon(v.icon) + '</div>',
        '<h3>' + v.title + '</h3><p>' + v.text + '</p></div>'
      ].join('')).join('');
    }

    const quotes = $('[data-quotes]');
    if (quotes && home.quotes) {
      quotes.innerHTML = (home.quotes.items || []).filter(q => q && String(q.text || '').trim()).map(q => [
        '<blockquote class="quote"><div class="quote__stars">',
        ICONS.star.repeat(Math.max(1, Math.min(5, Number(q.stars) || 5))),
        '</div><p>“' + q.text + '”</p><footer>' + q.author + '</footer></blockquote>'
      ].join('')).join('');
    }

    observe();
    refreshParallax();
  }

  LBContent.ready.then(render);
  document.addEventListener('content:change', render);
})();
