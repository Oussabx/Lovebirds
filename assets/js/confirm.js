/* Order confirmation — reads the order placed at checkout */
(function () {
  const { $, ICONS, money } = window.LB;

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
      '<span class="eyebrow">' + (labels.thanks || 'Thank you') + ', ' + (c.firstName || '') + '</span>',
      '<h1>' + (labels.title || 'Your order is on its way') + '</h1>',
      '<p class="lede center" style="margin:14px auto 0">' + (labels.text || '') + '</p>',
      '<span class="confirm__id">Order ' + order.id + '</span>',
      '</div>',

      '<div class="confirm__details">',
      '<div><h3>Delivering to</h3><p>' + [(c.firstName || '') + ' ' + (c.lastName || ''), c.address, c.apartment, c.city, c.country].filter(Boolean).join('<br>') + '</p></div>',
      '<div><h3>Contact &amp; payment</h3><p>' + [c.phone, c.email].filter(Boolean).join('<br>') + '<br><br>' + (order.payment || '') + '<br>Placed ' + when + '</p></div>',
      '</div>',

      order.note ? '<div class="confirm__lines" style="border-top:0;padding-top:0"><div><h3 style="font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Note on the card</h3><p style="font-family:var(--font-script);font-size:1.4rem;color:var(--wine)">' + order.note + '</p></div></div>' : '',

      '<div class="confirm__lines">',
      (order.lines || []).map(l => '<div class="confirm__line"><span>' + l.name + ' × ' + l.qty + '</span><span>' + money(l.total) + '</span></div>').join(''),
      '<div class="confirm__line"><span>Subtotal</span><span>' + money(order.subtotal) + '</span></div>',
      '<div class="confirm__line"><span>Delivery</span><span>' + (order.shipping === 0 ? 'Free' : money(order.shipping)) + '</span></div>',
      '<div class="confirm__line confirm__line--total"><span>Total to pay on delivery</span><strong>' + money(order.total) + '</strong></div>',
      '</div>',

      '<div class="center mt-4" style="display:grid;gap:12px;justify-items:center">',
      '<a class="btn btn--lg" href="categories.html">' + (labels.keepLabel || 'Keep browsing') + '</a>',
      '<button class="btn btn--ghost btn--wa" data-wa data-wa-text="Hi! I just placed order ' + order.id + '.">' + ICONS.chat + ' ' + (labels.askLabel || 'Ask about this order') + '</button>',
      '</div>',
      '</div>'
    ].join('');

    window.LB.observe(root);
  }

  LBContent.ready.then(render);
  document.addEventListener('content:change', render);
})();
