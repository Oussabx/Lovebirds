/* Contact page — message form + FAQ accordion */
(function () {
  const { $, $$, ICONS, toast } = window.LB;

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
      form.reset();
      toast('Message sent — we answer within a day', ICONS.check);
    });

    $$('.field input, .field textarea', form).forEach(el => {
      el.addEventListener('input', () => {
        const wrap = el.closest('.field');
        if (wrap) wrap.classList.remove('is-invalid');
      });
    });
  }

  $$('.faq .acc__btn').forEach(btn => {
    const panel = btn.nextElementSibling;
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
})();
