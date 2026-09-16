/* Order confirmation — reads the order placed at checkout */
(function () {
  const { $, ICONS, money, esc } = window.LB;

  const root = $('[data-confirm]');
  if (!root) return;

  function render() {
    const labels = COPY.confirm || {};
    let order = null;
    try { order = JSON.parse(localStorage.getItem('lovebirds.lastOrder.v1')); } catch (e) { order = null; }

    if (!order) {
      root.innerHTML = [
        '<div class="confirm__card center">',
        '<div class="confirm__badge">' + ICONS.heartLine + '</div>',
        '<h1>No order to show yet</h1>',
        '<p class="lede center" style="margin:14px auto 26px">Once you place an order its details will live here.</p>',
        '<a class="btn btn--lg" href="categories.html">Start browsing</a>',
        '</div>'
      ].join('');
      return;
    }

    const c = order.customer || {};
    const when = new Date(order.placedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

    root.innerHTML = [
      '<div class="confirm__card" data-reveal="scale">',
      '<div class="center">',
      '<div class="confirm__badge">' + ICONS.check + '</div>',
      '<span class="eyebrow">' + esc(labels.thanks || 'Thank you') + ', ' + esc(c.firstName || '') + '</span>',
      '<h1>' + esc(labels.title || 'Your order is on its way') + '</h1>',
      '<p class="lede center" style="margin:14px auto 0">' + esc(labels.text || '') + '</p>',
      '<span class="confirm__id">Order ' + esc(order.id) + '</span>',
      '</div>',

      '<div class="confirm__details">',
      '<div><h3>Delivering to</h3><p>' + [(c.firstName || '') + ' ' + (c.lastName || ''), c.address, c.apartment, c.city, c.country].filter(Boolean).map(esc).join('<br>') + '</p></div>',
      '<div><h3>Contact &amp; payment</h3><p>' + [c.phone, c.email].filter(Boolean).map(esc).join('<br>') + '<br><br>' + esc(order.payment || '') + '<br>Placed ' + esc(when) + '</p></div>',
      '</div>',

      order.note ? '<div class="confirm__lines" style="border-top:0;padding-top:0"><div><h3 style="font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Note on the card</h3><p style="font-family:var(--font-script);font-size:1.4rem;color:var(--wine)">' + esc(order.note) + '</p></div></div>' : '',

      '<div class="confirm__lines">',
      (order.lines || []).map(l => '<div class="confirm__line"><span>' + esc(l.name) + ' × ' + esc(l.qty) + '</span><span>' + money(l.total) + '</span></div>').join(''),
      '<div class="confirm__line"><span>Subtotal</span><span>' + money(order.subtotal) + '</span></div>',
      '<div class="confirm__line"><span>Delivery</span><span>' + (order.shipping === 0 ? 'Free' : money(order.shipping)) + '</span></div>',
      '<div class="confirm__line confirm__line--total"><span>Total to pay on delivery</span><strong>' + money(order.total) + '</strong></div>',
      '</div>',

      '<div class="confirm__actions">',
      '<a class="btn btn--lg" href="categories.html">' + esc(labels.keepLabel || 'Keep browsing') + '</a>',
      '<button class="btn btn--ghost btn--wa" data-wa data-wa-text="Hi! I just placed order ' + esc(order.id) + '.">' + ICONS.chat + ' ' + esc(labels.askLabel || 'Ask about this order') + '</button>',
      '</div>',
      '</div>'
    ].join('');

    window.LB.observe(root);
  }

  LBContent.ready.then(render);
  document.addEventListener('content:change', render);
})();
