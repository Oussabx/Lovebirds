/* Contact page — details, message form and FAQ, all from content */
(function () {
  const { $, $$, ICONS, toast } = window.LB;

  const icon = name => ICONS[name] || ICONS.heart;

  function accordion(scope) {
    $$('.acc__btn', scope).forEach(btn => {
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
  }

  function render() {
    const contact = COPY.contact || {};

    const list = $('[data-contact-info]');
    if (list) {
      list.innerHTML = (contact.info || []).filter(item => item && (String(item.title || '').trim() || String(item.text || '').trim())).map(item => {
        const body = item.whatsapp
          ? '<p>' + item.text + '</p><button class="btn btn--wa btn--sm mt-3" data-wa data-wa-text="' +
            (CONFIG.whatsappGreeting || '') + '">' + ICONS.chat + ' ' + (COPY.navWhatsappLabel || 'Chat on WhatsApp') + '</button>'
          : (item.link
              ? '<a href="' + item.link + '">' + item.text + '</a>'
              : '<p>' + String(item.text || '').replace(/\n/g, '<br>') + '</p>');
        return '<li><span class="info-list__icon">' + icon(item.icon) + '</span><div><h3>' + item.title + '</h3>' + body + '</div></li>';
      }).join('');
    }

    const faq = $('[data-faq]');
    if (faq) {
      faq.innerHTML = (contact.faq || []).filter(entry => entry && String(entry.q || '').trim()).map((entry, i) => [
        '<div class="acc__item">',
        '<button class="acc__btn" aria-expanded="' + (i === 0 ? 'true' : 'false') + '">' + entry.q + ICONS.plus + '</button>',
        '<div class="acc__panel"' + (i === 0 ? '' : ' style="height:0"') + '><div class="acc__panel-inner"><p>' + entry.a + '</p></div></div>',
        '</div>'
      ].join('')).join('');
      accordion(faq);
    }

    window.LB.observe();
  }

  const form = $('[data-contact]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      ['name', 'email', 'message'].forEach(n => {
        const el = form.elements[n];
        if (!el) return;
        const value = el.value.trim();
        const valid = n === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) : value.length > 1;
        const wrap = el.closest('.field');
        if (wrap) wrap.classList.toggle('is-invalid', !valid);
        if (!valid && ok) { el.focus(); ok = false; }
      });
      if (!ok) { toast('Please check the highlighted details', ICONS.close); return; }

      const contact = COPY.contact || {};
      const link = window.LB.waLink('Hi! ' + form.elements.name.value.trim() + ' here.\n' + form.elements.message.value.trim());
      if (link) window.open(link, '_blank', 'noopener');
      form.reset();
      toast(contact.sentMessage || 'Message sent', ICONS.check);
    });

    $$('.field input, .field textarea', form).forEach(el => {
      el.addEventListener('input', () => {
        const wrap = el.closest('.field');
        if (wrap) wrap.classList.remove('is-invalid');
      });
    });
  }

  LBContent.ready.then(render);
  document.addEventListener('content:change', render);
})();
