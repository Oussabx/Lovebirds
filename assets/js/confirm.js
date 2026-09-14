/* Order confirmation — reads the order placed at checkout */
(function () {
  const { $, ICONS, money } = window.LB;

  const root = $('[data-confirm]');
  if (!root) return;

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

  const c = order.customer;
  const when = new Date(order.placedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  root.innerHTML = [
    '<div class="confirm__card" data-reveal="scale">',
    '<div class="center">',
    '<div class="confirm__badge">' + ICONS.check + '</div>',
    '<span class="eyebrow">Thank you, ' + c.firstName + '</span>',
    '<h1>Your order is on its way</h1>',
    '<p class="lede center" style="margin:14px auto 0">We’ve got it. You’ll get a call before delivery, and you pay in cash when it arrives.</p>',
    '<span class="confirm__id">Order ' + order.id + '</span>',
    '</div>',

    '<div class="confirm__details">',
    '<div><h3>Delivering to</h3><p>' + [c.firstName + ' ' + c.lastName, c.address, c.apartment, c.city, c.country].filter(Boolean).join('<br>') + '</p></div>',
    '<div><h3>Contact & payment</h3><p>' + c.phone + '<br>' + c.email + '<br><br>' + order.payment + '<br>Placed ' + when + '</p></div>',
    '</div>',

    '<div class="confirm__lines">',
    order.lines.map(l => '<div class="confirm__line"><span>' + l.name + ' × ' + l.qty + '</span><span>' + money(l.total) + '</span></div>').join(''),
    '<div class="confirm__line"><span>Subtotal</span><span>' + money(order.subtotal) + '</span></div>',
    '<div class="confirm__line"><span>Delivery</span><span>' + (order.shipping === 0 ? 'Free' : money(order.shipping)) + '</span></div>',
    '<div class="confirm__line confirm__line--total"><span>Total to pay on delivery</span><strong>' + money(order.total) + '</strong></div>',
    '</div>',

    '<div class="center mt-4" style="display:grid;gap:12px;justify-items:center">',
    '<a class="btn btn--lg" href="categories.html">Keep browsing</a>',
    '<button class="btn btn--ghost btn--wa" data-wa data-wa-text="Hi lovebirds! I just placed order ' + order.id + '.">' + ICONS.chat + ' Ask about this order</button>',
    '</div>',
    '</div>'
  ].join('');

  window.LB.observe(root);
})();
