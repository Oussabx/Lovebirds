/* ==========================================================================
   lovebirds — content layer
   Merges the live content saved in the dashboard over the shipped defaults,
   exposes it to the page scripts, paints the theme and fills every element
   marked with data-cms. Falls back to the defaults if the API is missing.
   ========================================================================== */
var CONFIG, CATEGORIES, PRODUCTS, COPY;

(function () {
  'use strict';

  var CACHE_KEY = 'lovebirds.content.v1';
  var SCENES = ['assets/img/scene-wrap.svg', 'assets/img/scene-note.svg'];
  var DEFAULTS = window.LB_DEFAULT_CONTENT || {};
  var listeners = [];
  var resolveReady;
  var settled = false;

  var ready = new Promise(function (resolve) { resolveReady = resolve; });

  /* ------------------------------------------------------------- helpers */
  function isPlain(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function merge(base, override) {
    if (!isPlain(base)) return override === undefined ? base : override;
    var out = {};
    Object.keys(base).forEach(function (key) { out[key] = base[key]; });
    if (!isPlain(override)) return out;
    Object.keys(override).forEach(function (key) {
      var value = override[key];
      if (value === undefined) return;
      out[key] = isPlain(value) && isPlain(out[key]) ? merge(out[key], value) : value;
    });
    return out;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function read(path, fallback) {
    var node = LBContent.data;
    var parts = String(path).split('.');
    for (var i = 0; i < parts.length; i++) {
      if (node == null) return fallback;
      node = node[parts[i]];
    }
    return node === undefined || node === null || node === '' ? fallback : node;
  }

  /* ------------------------------------------------------------- colours */
  function toRgb(hex) {
    var value = String(hex || '').replace('#', '');
    if (value.length === 3) value = value.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-f]{6}$/i.test(value)) return null;
    return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
  }

  function mix(hexA, hexB, amount) {
    var a = toRgb(hexA), b = toRgb(hexB);
    if (!a || !b) return hexA;
    var out = a.map(function (channel, i) {
      return Math.round(channel + (b[i] - channel) * amount);
    });
    return '#' + out.map(function (c) { return ('0' + c.toString(16)).slice(-2); }).join('');
  }

  var FONT_STACKS = {
    display: ',"Hoefler Text",Georgia,"Times New Roman",serif',
    sans: ',"Helvetica Neue",Helvetica,Arial,sans-serif',
    script: ',"Snell Roundhand",cursive'
  };

  function applyTheme(theme) {
    if (!theme) return;
    var root = document.documentElement.style;
    var set = function (name, value) { if (value) root.setProperty(name, value); };

    set('--wine', theme.wine);
    set('--wine-deep', theme.wineDeep || (theme.wine && mix(theme.wine, '#000000', 0.28)));
    set('--wine-soft', theme.wineSoft || (theme.wine && mix(theme.wine, '#ffffff', 0.22)));
    set('--blush', theme.blush);
    set('--cream', theme.cream);
    set('--cream-light', theme.creamLight);
    set('--ink', theme.ink);
    set('--gold', theme.gold);

    if (theme.blush) {
      set('--blush-soft', mix(theme.blush, '#ffffff', 0.45));
      set('--blush-tint', mix(theme.blush, '#ffffff', 0.74));
    }
    if (theme.ink) {
      set('--ink-soft', mix(theme.ink, '#ffffff', 0.32));
      set('--muted', mix(theme.ink, '#ffffff', 0.52));
    }
    if (theme.cream) set('--line', mix(theme.cream, theme.ink || '#2A1512', 0.12));
    if (theme.creamLight) set('--paper', mix(theme.creamLight, '#ffffff', 0.6));
    if (theme.radius) {
      var r = Number(theme.radius) || 24;
      set('--r-lg', r + 'px');
      set('--r-md', Math.round(r * 0.66) + 'px');
      set('--r-xl', Math.round(r * 1.4) + 'px');
    }

    var families = [];
    if (theme.fontDisplay) { set('--font-display', '"' + theme.fontDisplay + '"' + FONT_STACKS.display); families.push(theme.fontDisplay); }
    if (theme.fontSans) { set('--font-sans', '"' + theme.fontSans + '"' + FONT_STACKS.sans); families.push(theme.fontSans); }
    if (theme.fontScript) { set('--font-script', '"' + theme.fontScript + '"' + FONT_STACKS.script); families.push(theme.fontScript); }
    loadFonts(families);
  }

  var loadedFonts = '';
  function loadFonts(families) {
    var wanted = families.filter(Boolean).join('|');
    if (!wanted || wanted === loadedFonts) return;
    loadedFonts = wanted;
    var href = 'https://fonts.googleapis.com/css2?' + families.filter(Boolean).map(function (family) {
      return 'family=' + family.trim().replace(/\s+/g, '+') + ':wght@300;400;500';
    }).join('&') + '&display=swap';
    var link = document.getElementById('lb-fonts-live');
    if (!link) {
      link = document.createElement('link');
      link.id = 'lb-fonts-live';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = href;
  }

  /* ------------------------------------------------------------- announcement */
  function applyAnnouncement(settings) {
    var announcement = (settings && settings.announcement) || {};
    var bar = document.querySelector('.announce');
    if (!announcement.enabled || !announcement.text) {
      if (bar) bar.remove();
      document.documentElement.style.setProperty('--ann-h', '0px');
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'announce';
      document.body.insertBefore(bar, document.body.firstChild);
    }
    bar.textContent = announcement.text;
    document.documentElement.style.setProperty('--ann-h', '38px');
  }

  /* ------------------------------------------------------------- binding */
  function bind(root) {
    var scope = root || document;
    Array.prototype.forEach.call(scope.querySelectorAll('[data-cms]'), function (el) {
      var value = read(el.getAttribute('data-cms'));
      if (typeof value === 'number') value = String(value);
      if (typeof value !== 'string' || !value.length) return;
      el.innerHTML = escapeHtml(value).replace(/\n/g, '<br>');
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-cms-src]'), function (el) {
      var value = read(el.getAttribute('data-cms-src'));
      if (value) el.setAttribute('src', value);
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-cms-href]'), function (el) {
      var value = read(el.getAttribute('data-cms-href'));
      if (value) el.setAttribute('href', value);
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-cms-alt]'), function (el) {
      var value = read(el.getAttribute('data-cms-alt'));
      if (value) el.setAttribute('alt', value);
    });
  }

  /* ------------------------------------------------------------- apply */
  function normaliseProducts(list) {
    return (list || []).filter(function (p) { return p && p.id && p.active !== false; })
      .map(function (p) {
        var product = clone(p);
        product.price = Number(product.price) || 0;
        if (product.compareAt != null) {
          product.compareAt = Number(product.compareAt) || null;
          if (!product.compareAt || product.compareAt <= product.price) product.compareAt = null;
        }
        var images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
        if (product.image && images.indexOf(product.image) !== 0) images.unshift(product.image);
        if (!images.length) images = [SCENES[0]];
        while (images.length < 2) images.push(SCENES[images.length % SCENES.length]);
        product.images = images;
        product.image = images[0];
        product.includes = Array.isArray(product.includes) ? product.includes : [];
        product.tags = Array.isArray(product.tags) ? product.tags : [];
        return product;
      });
  }

  function apply(content, source) {
    LBContent.data = merge(DEFAULTS, content || {});
    LBContent.source = source;

    var data = LBContent.data;
    CONFIG = merge(data.settings || {}, {});
    CONFIG.brand = data.settings.brand;
    CATEGORIES = (data.categories || []).filter(function (c) { return c && c.id; });
    PRODUCTS = normaliseProducts(data.products);
    COPY = data;

    window.CONFIG = CONFIG;
    window.CATEGORIES = CATEGORIES;
    window.PRODUCTS = PRODUCTS;
    window.COPY = COPY;

    applyTheme(data.theme);
    if (document.body) {
      applyAnnouncement(data.settings);
      bind(document);
    }
    listeners.forEach(function (fn) { try { fn(data); } catch (e) {} });
    document.dispatchEvent(new CustomEvent('content:change', { detail: data }));
  }

  /* ------------------------------------------------------------- load */
  function cached() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) { return null; }
  }

  function cache(content, updatedAt) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ content: content, updatedAt: updatedAt })); } catch (e) {}
  }

  function settle() {
    if (settled) return;
    settled = true;
    resolveReady(LBContent.data);
  }

  function load() {
    var stored = cached();
    if (stored && stored.content) {
      apply(stored.content, 'cache');
      settle();
    }

    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); settle(); }, 4000);

    fetch('/api/content', { signal: controller ? controller.signal : undefined, credentials: 'same-origin' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (payload) {
        clearTimeout(timer);
        if (!payload || !payload.ok) { settle(); return; }
        if (payload.content) {
          if (!stored || JSON.stringify(stored.content) !== JSON.stringify(payload.content)) {
            apply(payload.content, 'api');
          }
          cache(payload.content, payload.updatedAt);
        } else {
          try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
          if (stored) apply(null, 'defaults');
        }
        settle();
      })
      .catch(function () { clearTimeout(timer); settle(); });
  }

  /* ------------------------------------------------------------- export */
  window.LBContent = {
    data: null,
    source: 'defaults',
    ready: ready,
    get: read,
    bind: bind,
    apply: apply,
    mix: mix,
    onChange: function (fn) { listeners.push(fn); },
    defaults: function () { return clone(DEFAULTS); }
  };

  apply(null, 'defaults');
  load();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      applyAnnouncement(LBContent.data.settings);
      bind(document);
    });
  }

  /* Shared lookups used across the storefront. */
  window.getProduct = function (id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  };
  window.getCategory = function (id) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i];
    return null;
  };
  window.categoryName = function (id) {
    var category = window.getCategory(id);
    return category ? category.name : 'Gifts';
  };
})();
