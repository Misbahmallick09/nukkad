/* ==========================================================================
   NUKKAD — UI kit: toasts, modals, drawers, product cards, rails, states
   ========================================================================== */
(function (w, d) {
  'use strict';

  var NK = w.NK, IMG = w.NK_IMG;

  /* ---------- dom helpers ------------------------------------------------ */
  function qs(sel, root) { return (root || d).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function attr(s) { return esc(s).replace(/\n/g, ' '); }
  function on(el, evt, sel, fn) {
    if (typeof sel === 'function') { el.addEventListener(evt, sel); return; }
    el.addEventListener(evt, function (e) {
      var t = e.target.closest(sel);
      if (t && el.contains(t)) fn.call(t, e, t);
    });
  }
  function debounce(fn, ms) {
    var t;
    return function () {
      var a = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, a); }, ms || 220);
    };
  }
  function raf(fn) { return w.requestAnimationFrame ? w.requestAnimationFrame(fn) : setTimeout(fn, 16); }
  function reduced() {
    return w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function isMobile() { return w.matchMedia && w.matchMedia('(max-width: 700px)').matches; }
  function isCompact() { return w.matchMedia && w.matchMedia('(max-width: 900px)').matches; }

  /* ---------- icons ------------------------------------------------------ */
  var ICON = {
    heart: "<path d='M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z'/>",
    bag: "<path d='M6 8h12l-1 12H7L6 8z'/><path d='M9.2 8V6.6a2.8 2.8 0 0 1 5.6 0V8'/>",
    eye: "<path d='M2.6 12S6 6.5 12 6.5 21.4 12 21.4 12 18 17.5 12 17.5 2.6 12 2.6 12z'/><circle cx='12' cy='12' r='2.9'/>",
    plus: "<path d='M12 5v14M5 12h14'/>",
    minus: "<path d='M5 12h14'/>",
    x: "<path d='M6 6l12 12M18 6L6 18'/>",
    check: "<path d='M4.5 12.5l5 5 10-11'/>",
    chev: "<path d='M9 6l6 6-6 6'/>",
    arrowL: "<path d='M15 6l-6 6 6 6'/>",
    arrowR: "<path d='M9 6l6 6-6 6'/>",
    star: "<path d='M12 3.6l2.7 5.7 6.1.7-4.5 4.2 1.2 6-5.5-3.2-5.5 3.2 1.2-6L3.2 10l6.1-.7z'/>",
    filter: "<path d='M4 6h16M7 12h10M10 18h4'/>",
    sort: "<path d='M4 7h11M4 12h8M4 17h5M17 9l3-3 3 3M20 6v12'/>",
    truck: "<path d='M3 7h11v10H3z'/><path d='M14 10h4l3 3v4h-7z'/><circle cx='7' cy='18.5' r='1.8'/><circle cx='17' cy='18.5' r='1.8'/>",
    ret: "<path d='M4 9h11a5 5 0 0 1 0 10H8'/><path d='M7.5 5.5L4 9l3.5 3.5'/>",
    lock: "<rect x='5' y='11' width='14' height='9' rx='2'/><path d='M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11'/>",
    tag: "<path d='M12.5 3.5H20V11l-9 9-7.5-7.5z'/><circle cx='16.5' cy='7.5' r='1.4'/>",
    pin: "<path d='M12 21s6.5-6.2 6.5-11A6.5 6.5 0 0 0 5.5 10c0 4.8 6.5 11 6.5 11z'/><circle cx='12' cy='10' r='2.4'/>",
    scale: "<path d='M12 4v16M6 8l-3 7h6zM18 8l-3 7h6z'/><path d='M4 7h16'/>",
    zoom: "<circle cx='11' cy='11' r='7'/><path d='m20 20-3.5-3.5M11 8.5v5M8.5 11h5'/>",
    trash: "<path d='M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13'/>",
    user: "<circle cx='12' cy='8.5' r='3.6'/><path d='M4.8 20c1.2-3.7 3.9-5.5 7.2-5.5s6 1.8 7.2 5.5'/>",
    box: "<path d='M4 8l8-4 8 4v8l-8 4-8-4z'/><path d='M4 8l8 4 8-4M12 12v8'/>",
    spark: "<path d='M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z'/>",
    leaf: "<path d='M20 4C9 4 4 9.5 4 16v4'/><path d='M20 4c0 9-5.5 14-12 14'/>",
    clock: "<circle cx='12' cy='12' r='8.4'/><path d='M12 7.4V12l3.2 2'/>",
    info: "<circle cx='12' cy='12' r='8.6'/><path d='M12 11v5.4'/><path d='M12 7.9v.1'/>",
    card: "<rect x='3' y='6' width='18' height='12' rx='2'/><path d='M3 10.5h18M6.5 14.5h3'/>",
    bank: "<path d='M4 10l8-5 8 5'/><path d='M5.5 10v8M18.5 10v8M9.5 10v8M14.5 10v8M3.5 19h17'/>",
    cash: "<rect x='3' y='7' width='18' height='10' rx='1.6'/><circle cx='12' cy='12' r='2.4'/>",
    upi: "<path d='M5 12l4.5-7 4.5 7-4.5 7z'/><path d='M12 12l4.5-7 4.5 7-4.5 7z'/>",
    copy: "<rect x='9' y='9' width='11' height='11' rx='2'/><path d='M15 6.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15'/>",
    edit: "<path d='M4 20h4l11-11-4-4L4 16z'/><path d='M14.5 5.5l4 4'/>",
    phone: "<rect x='7' y='3' width='10' height='18' rx='2.4'/><path d='M10.8 18h2.4'/>"
  };
  function icon(name, cls) {
    return "<svg class='" + (cls || 'ico') + "' viewBox='0 0 24 24' aria-hidden='true'>" + (ICON[name] || '') + "</svg>";
  }

  /* ---------- toasts ------------------------------------------------------ */
  var toastHost;
  function toast(o) {
    o = o || {};
    toastHost = toastHost || qs('#toasts');
    if (!toastHost) return;
    var el = d.createElement('div');
    el.className = 'toast' + (o.type === 'ok' ? ' toast--ok' : o.type === 'err' ? ' toast--err' : '');
    var ic = o.type === 'err' ? icon('x') : o.type === 'ok' ? icon('check') : icon('spark');
    el.innerHTML =
      "<span class='toast__ic'>" + ic + "</span>" +
      "<span class='toast__b'><span class='toast__t'>" + esc(o.t || '') + "</span>" +
      (o.s ? "<span class='toast__s'>" + esc(o.s) + "</span>" : '') + "</span>" +
      (o.action ? "<button class='toast__a' type='button'>" + esc(o.action.label) + "</button>" : '') +
      "<button class='toast__x' type='button' aria-label='Dismiss'>&times;</button>";
    toastHost.appendChild(el);
    var life = setTimeout(kill, o.ms || (o.action ? 6000 : 3600));
    function kill() {
      clearTimeout(life);
      el.classList.add('is-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    }
    qs('.toast__x', el).addEventListener('click', kill);
    var ab = qs('.toast__a', el);
    if (ab) ab.addEventListener('click', function () { kill(); o.action.run(); });
    while (toastHost.children.length > 4) toastHost.removeChild(toastHost.firstChild);
    return kill;
  }
  function ok(t, s, action) { return toast({ t: t, s: s, type: 'ok', action: action }); }
  function err(t, s) { return toast({ t: t, s: s, type: 'err' }); }
  function info(t, s, action) { return toast({ t: t, s: s, action: action }); }
  function fromResult(r, fallback) {
    if (!r) return;
    if (r.ok) ok(r.msg || fallback || 'Done.');
    else err(r.msg || 'That did not work.');
  }

  /* ---------- modal ------------------------------------------------------- */
  var modal = { el: null, box: null, content: null, lastFocus: null, open: false, onClose: null };
  function trapFocus(e) {
    if (!modal.open || e.key !== 'Tab') return;
    var f = qsa('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', modal.box)
      .filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function lockScroll(yes) {
    if (yes) {
      var sw = w.innerWidth - d.documentElement.clientWidth;
      d.body.style.overflow = 'hidden';
      if (sw > 0) d.body.style.paddingRight = sw + 'px';
    } else {
      d.body.style.overflow = '';
      d.body.style.paddingRight = '';
    }
  }
  function openModal(o) {
    o = o || {};
    modal.el = modal.el || qs('#modal');
    modal.box = modal.box || qs('#modalBox');
    modal.content = modal.content || qs('#modalContent');
    if (!modal.el) return;
    modal.lastFocus = d.activeElement;
    modal.onClose = o.onClose || null;
    modal.box.className = 'modal__box' + (o.size ? ' modal__box--' + o.size : '');
    modal.content.innerHTML =
      (o.title ? "<div class='mhead'><h2 class='mhead__t' id='modalTitle'>" + esc(o.title) + "</h2>" +
        (o.sub ? "<p class='mhead__s'>" + esc(o.sub) + "</p>" : '') + "</div>" : '') +
      "<div class='mbody'>" + (o.html || '') + "</div>" +
      (o.foot ? "<div class='mfoot'>" + o.foot + "</div>" : '');
    modal.el.hidden = false;
    modal.open = true;
    lockScroll(true);
    raf(function () {
      modal.el.classList.add('is-on');
      var auto = qs('[data-autofocus]', modal.content) || qs('.modal__x', modal.el);
      if (auto) auto.focus();
    });
    if (typeof o.mounted === 'function') o.mounted(modal.content);
    return modal.content;
  }
  function closeModal() {
    if (!modal.open || !modal.el) return;
    modal.open = false;
    modal.el.classList.remove('is-on');
    lockScroll(false);
    setTimeout(function () {
      if (!modal.open) { modal.el.hidden = true; modal.content.innerHTML = ''; }
    }, 220);
    if (modal.lastFocus && modal.lastFocus.focus) modal.lastFocus.focus();
    if (typeof modal.onClose === 'function') { var f = modal.onClose; modal.onClose = null; f(); }
  }
  function confirmDialog(o) {
    return new Promise(function (resolve) {
      var done = false;
      openModal({
        size: 'sm', title: o.title, sub: o.sub,
        html: "<p class='note'>" + esc(o.body || '') + "</p>",
        foot: "<button class='btn btn--ghost' data-act='no' type='button'>" + esc(o.cancel || 'Keep it') + "</button>" +
              "<button class='btn " + (o.danger ? 'btn--danger' : 'btn--pri') + "' data-act='yes' type='button' data-autofocus>" +
              esc(o.confirm || 'Confirm') + "</button>",
        onClose: function () { if (!done) resolve(false); },
        mounted: function (root) {
          on(root, 'click', "[data-act]", function (e, t) {
            done = true;
            resolve(t.getAttribute('data-act') === 'yes');
            closeModal();
          });
        }
      });
    });
  }

  /* ---------- drawers / sheets -------------------------------------------- */
  var openSheets = [];
  function openSheet(el, scrim) {
    if (!el) return;
    el.hidden = false;
    if (scrim) { scrim.hidden = false; raf(function () { scrim.classList.add('is-on'); }); }
    raf(function () { el.classList.add('is-on'); });
    openSheets.push({ el: el, scrim: scrim });
    lockScroll(true);
  }
  function closeSheet(el, scrim) {
    if (!el) return;
    el.classList.remove('is-on');
    if (scrim) scrim.classList.remove('is-on');
    setTimeout(function () {
      el.hidden = true;
      if (scrim) scrim.hidden = true;
    }, 260);
    openSheets = openSheets.filter(function (s) { return s.el !== el; });
    if (!openSheets.length && !modal.open) lockScroll(false);
  }
  function closeAllSheets() {
    openSheets.slice().forEach(function (s) { closeSheet(s.el, s.scrim); });
  }

  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modal.open) { closeModal(); return; }
      if (openSheets.length) { var s = openSheets[openSheets.length - 1]; closeSheet(s.el, s.scrim); }
    }
    trapFocus(e);
  });
  d.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]') && modal.open) closeModal();
  });

  /* ---------- stars, price, tags ------------------------------------------ */
  /* Each partly-filled star needs its own gradient, and a gradient is addressed
     by id — so two 4.5-star ratings on one page would both point at whichever
     definition the parser saw first. The counter keeps every instance distinct. */
  var starUid = 0;
  function stars(v, cls) {
    var out = "<span class='stars " + (cls || '') + "' role='img' aria-label='" + v + " out of 5 stars'>";
    var uid = 'st' + (++starUid) + '-';
    for (var i = 1; i <= 5; i++) {
      var fill = v >= i ? 1 : (v > i - 1 ? v - (i - 1) : 0);
      out += "<svg viewBox='0 0 24 24' aria-hidden='true'><defs><linearGradient id='" + uid + i + "'>" +
        "<stop offset='" + (fill * 100) + "%' stop-color='currentColor'/><stop offset='" + (fill * 100) + "%' stop-color='transparent'/>" +
        "</linearGradient></defs><path d='M12 3.6l2.7 5.7 6.1.7-4.5 4.2 1.2 6-5.5-3.2-5.5 3.2 1.2-6L3.2 10l6.1-.7z' " +
        "fill='url(#" + uid + i + ")' stroke='currentColor' stroke-width='1.2'/></svg>";
    }
    return out + '</span>';
  }
  function ratePill(p) {
    return "<span class='rate'><span class='rate__box'>" + p.rating.toFixed(1) +
      "<svg viewBox='0 0 24 24' aria-hidden='true'>" + ICON.star + "</svg></span>" +
      "<span class='rate__n'>" + (p.ratingCount > 999 ? (p.ratingCount / 1000).toFixed(1) + 'k' : p.ratingCount) + "</span></span>";
  }
  function priceBlock(p, qty) {
    var n = qty && qty > 1 ? qty : 1;
    return "<span class='price'>" + NK.money(p.price * n) + "</span>" +
      (p.mrp > p.price ? "<span class='price--was'>" + NK.money(p.mrp * n) + "</span>" +
        "<span class='price--off'>" + p.discount + '% off' + "</span>" : '');
  }
  function tagsFor(p) {
    var t = '';
    if (p.totalStock <= 0) t += "<span class='tag tag--out'>Sold out</span>";
    else {
      if (p.isNew) t += "<span class='tag tag--new'>New</span>";
      if (p.isBest) t += "<span class='tag tag--best'>Bestseller</span>";
      if (p.discount >= 45) t += "<span class='tag tag--sale'>" + p.discount + "% off</span>";
      if (p.totalStock <= 8) t += "<span class='tag tag--low'>Almost gone</span>";
    }
    return t;
  }
  /* Emits the src/fallback attribute pair for a product image: the CDN photo
     lazy-loads into data-src, and data-fallback keeps the locally drawn
     garment ready in case that photo never arrives. `eager` swaps data-src for
     a plain src, for above-the-fold shots that must not wait on the observer. */
  function srcPair(p, hex, view, wid, eager) {
    var photo = IMG.photo(p, view, wid || 600, Math.round((wid || 600) * 4 / 3));
    var drawn = IMG.img(p, hex, view);
    if (!photo) return (eager ? " src='" : " data-src='") + drawn + "'";
    return (eager ? " src='" : " data-src='") + photo + "' data-fallback='" + drawn + "'";
  }

  function altText(p, view) {
    var v = { front: 'front view', back: 'back view', flat: 'folded flat-lay', detail: 'fabric and label close-up' }[view || 'front'];
    return p.name + ' in ' + (p.colors[0] ? p.colors[0].name : '') + ', ' + v +
      ' — ' + p.catName + ' ' + p.subName.toLowerCase() + ' by ' + p.brand;
  }

  /* ---------- lazy images -------------------------------------------------- */
  /* Photos come from a remote CDN, so every one of them carries a data-fallback
     holding the locally generated garment SVG. If the photo 404s, is blocked or
     the machine is offline we swap to that instead of leaving a broken image —
     the catalogue always renders complete. */
  function wireFallback(el) {
    if (el.__nkFb) return;
    el.__nkFb = 1;
    el.addEventListener('error', function () {
      var fb = el.getAttribute('data-fallback');
      if (!fb || el.getAttribute('data-fell') === '1') { el.classList.add('is-in'); return; }
      el.setAttribute('data-fell', '1');
      el.classList.add('img--drawn');
      el.src = fb;
    });
    el.addEventListener('load', function () { el.classList.add('is-in'); });
  }
  var io = null;
  function lazyObserver() {
    if (io || !w.IntersectionObserver) return io;
    io = new w.IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, src = el.getAttribute('data-src');
        wireFallback(el);
        if (src) { el.src = src; el.removeAttribute('data-src'); }
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '360px 0px' });
    return io;
  }
  function hydrateLazy(root) {
    var obs = lazyObserver();
    qsa('img[data-src]', root || d).forEach(function (el) {
      if (obs) obs.observe(el);
      else { wireFallback(el); el.src = el.getAttribute('data-src'); el.removeAttribute('data-src'); el.classList.add('is-in'); }
    });
    /* eager images (hero, PDP hero shot) never pass through the observer */
    qsa('img[data-fallback]:not([data-src])', root || d).forEach(wireFallback);
  }
  /* Safety net for images injected outside a view mount — the mega menu and the
     search suggestion panel both write straight into the header. `error` does not
     bubble but it does capture, so one document-level listener covers everything
     hydrateLazy never sees. wireFallback's own guard stops double handling. */
  d.addEventListener('error', function (e) {
    var el = e.target;
    if (!el || el.tagName !== 'IMG' || el.__nkFb) return;
    var fb = el.getAttribute('data-fallback');
    if (!fb || el.getAttribute('data-fell') === '1') return;
    el.setAttribute('data-fell', '1');
    el.classList.add('img--drawn', 'is-in');
    el.src = fb;
  }, true);
  var ro = null;
  function hydrateReveal(root) {
    if (reduced()) { qsa('.reveal', root || d).forEach(function (e) { e.classList.add('is-in'); }); return; }
    if (!w.IntersectionObserver) { qsa('.reveal', root || d).forEach(function (e) { e.classList.add('is-in'); }); return; }
    ro = ro || new w.IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); ro.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    qsa('.reveal:not(.is-in)', root || d).forEach(function (e) { ro.observe(e); });
  }

  /* ---------- product card -------------------------------------------------- */
  function card(p, opts) {
    opts = opts || {};
    var hex = p.colors[0] ? p.colors[0].hex : '#333';
    var wished = NK.inWish(p.id);
    var out = p.totalStock <= 0;
    var note = NK.stockNote(p);
    return "<article class='card" + (out ? ' card--out' : '') + " reveal' data-pid='" + p.id + "'>" +
      "<a class='card__media' href='#/p/" + p.id + "' aria-label='" + attr(p.name) + "'>" +
        "<img class='card__img card__img--main'" + srcPair(p, hex, 'front', 600) + " alt='" + attr(altText(p, 'front')) + "' loading='lazy' decoding='async' width='600' height='800'>" +
        "<img class='card__img card__img--alt'" + srcPair(p, hex, 'back', 600) + " alt='' aria-hidden='true' loading='lazy' decoding='async' width='600' height='800'>" +
        "<span class='card__tags'>" + tagsFor(p) + "</span>" +
      "</a>" +
      "<button class='card__wish" + (wished ? ' is-on' : '') + "' type='button' data-wish='" + p.id + "' " +
        "aria-pressed='" + wished + "' aria-label='" + (wished ? 'Remove ' : 'Save ') + attr(p.name) + (wished ? ' from wishlist' : ' to wishlist') + "'>" +
        "<svg viewBox='0 0 24 24' aria-hidden='true'>" + ICON.heart + "</svg></button>" +
      "<div class='card__quick'>" +
        "<button class='card__qbtn card__qbtn--icon' type='button' data-quick='" + p.id + "' aria-label='Quick view'>" + icon('eye') + "</button>" +
        (out
          ? "<button class='card__qbtn card__qbtn--cart' type='button' data-notify='" + p.id + "'>Notify me</button>"
          : "<button class='card__qbtn card__qbtn--cart' type='button' data-add='" + p.id + "'>Add to bag</button>") +
        "<button class='card__qbtn card__qbtn--icon' type='button' data-compare='" + p.id + "' aria-label='Add to compare'>" + icon('scale') + "</button>" +
      "</div>" +
      "<div class='card__body'>" +
        "<p class='card__brand'>" + esc(p.brand) + "</p>" +
        "<h3 class='card__name'><a href='#/p/" + p.id + "'>" + esc(p.name) + "</a></h3>" +
        "<div class='card__row'>" + priceBlock(p) + ratePill(p) + "</div>" +
        "<div class='card__swatches'>" +
          p.colors.slice(0, 5).map(function (c) {
            return "<button class='card__sw' type='button' data-sw='" + p.id + "' data-hex='" + c.hex + "' " +
              "style='--sw:" + c.hex + "' title='" + attr(c.name) + "' aria-label='Preview in " + attr(c.name) + "'></button>";
          }).join('') +
          (p.colors.length > 5 ? "<span class='card__sw card__sw--more'>+" + (p.colors.length - 5) + "</span>" : '') +
        "</div>" +
        (note && note.level !== 'ok' ? "<p class='card__stock'>" + esc(note.text) + "</p>" : '') +
      "</div></article>";
  }
  function grid(list, opts) {
    opts = opts || {};
    if (!list.length) return '';
    return "<div class='pgrid" + (opts.cols ? ' pgrid--' + opts.cols : '') + "'>" +
      list.map(function (p) { return card(p, opts); }).join('') + "</div>";
  }

  /* ---------- skeletons + states -------------------------------------------- */
  function skeletonGrid(n, cols) {
    var cells = '';
    for (var i = 0; i < (n || 8); i++)
      cells += "<div class='skcard'><div class='skcard__m sk'></div><div class='skcard__b'>" +
        "<span class='skline skline--40 sk'></span><span class='skline skline--85 sk'></span>" +
        "<span class='skline skline--60 sk'></span></div></div>";
    return "<div class='pgrid" + (cols ? ' pgrid--' + cols : '') + "'>" + cells + "</div>";
  }
  function state(o) {
    o = o || {};
    return "<div class='state" + (o.type === 'err' ? ' state--err' : '') + "'>" +
      "<div class='state__art' aria-hidden='true'>" + (o.art || emptyArt(o.artKind)) + "</div>" +
      "<h2 class='state__t'>" + esc(o.title || 'Nothing here yet') + "</h2>" +
      "<p class='state__s'>" + esc(o.body || '') + "</p>" +
      (o.actions ? "<div class='state__acts'>" + o.actions + "</div>" : '') + "</div>";
  }
  function emptyArt(kind) {
    var g = "<circle cx='60' cy='60' r='52' fill='#E8E8E1'/>";
    if (kind === 'bag') g += "<path d='M40 46h40l-3.5 42h-33z' fill='none' stroke='#0C3B2E' stroke-width='4' stroke-linejoin='round'/><path d='M50 46v-5a10 10 0 0 1 20 0v5' fill='none' stroke='#FFB703' stroke-width='4'/>";
    else if (kind === 'heart') g += "<path d='M60 88s-24-14.5-24-30a13 13 0 0 1 24-7 13 13 0 0 1 24 7c0 15.5-24 30-24 30z' fill='none' stroke='#0C3B2E' stroke-width='4'/>";
    else if (kind === 'box') g += "<path d='M32 46l28-14 28 14v28L60 88 32 74z' fill='none' stroke='#0C3B2E' stroke-width='4' stroke-linejoin='round'/><path d='M32 46l28 14 28-14M60 60v28' stroke='#FFB703' stroke-width='4' fill='none'/>";
    else if (kind === 'search') g += "<circle cx='55' cy='55' r='22' fill='none' stroke='#0C3B2E' stroke-width='4'/><path d='M71 71l16 16' stroke='#FFB703' stroke-width='5' stroke-linecap='round'/>";
    else if (kind === 'warn') g += "<path d='M60 32l28 52H32z' fill='none' stroke='#D2461F' stroke-width='4' stroke-linejoin='round'/><path d='M60 52v16M60 74v.5' stroke='#D2461F' stroke-width='5' stroke-linecap='round'/>";
    else g += "<path d='M40 44h40v36H40z' fill='none' stroke='#0C3B2E' stroke-width='4'/><path d='M40 58h40' stroke='#FFB703' stroke-width='4'/>";
    return "<svg viewBox='0 0 120 120' width='120' height='120'>" + g + "</svg>";
  }

  /* ---------- section + rail scaffolding ----------------------------------- */
  var railSeq = 0;
  function section(o) {
    o = o || {};
    return "<section class='sec" + (o.mod ? ' sec--' + o.mod : '') + "'" + (o.id ? " id='" + o.id + "'" : '') + ">" +
      "<div class='wrap'>" +
        (o.title || o.eyebrow ? "<header class='sec__hd'><div>" +
          (o.eyebrow ? "<p class='sec__eyebrow'>" + esc(o.eyebrow) + "</p>" : '') +
          (o.title ? "<h2 class='sec__t dsp'>" + esc(o.title) + "</h2>" : '') +
          (o.sub ? "<p class='sec__s'>" + esc(o.sub) + "</p>" : '') + "</div>" +
          (o.more ? "<a class='sec__more' href='" + o.more.href + "'>" + esc(o.more.label) + icon('chev') + "</a>" : '') +
          "</header>" : '') +
        (o.html || '') +
      "</div></section>";
  }
  function rail(list, opts) {
    opts = opts || {};
    if (!list.length) return '';
    var id = 'rail' + (++railSeq);
    return "<div class='rail' data-rail='" + id + "'>" +
      "<button class='rail__nav rail__nav--p' type='button' data-railp aria-label='Scroll left'>" + icon('arrowL') + "</button>" +
      "<div class='rail__vp' id='" + id + "' tabindex='0' role='region' aria-label='" + attr(opts.label || 'Product carousel') + "'>" +
        list.map(function (p) { return card(p, opts); }).join('') +
      "</div>" +
      "<button class='rail__nav rail__nav--n' type='button' data-railn aria-label='Scroll right'>" + icon('arrowR') + "</button>" +
      "</div>";
  }
  function wireRails(root) {
    qsa('[data-rail]', root || d).forEach(function (r) {
      var vp = qs('.rail__vp', r);
      var prev = qs('[data-railp]', r), next = qs('[data-railn]', r);
      function step(dir) {
        var first = qs('.card', vp);
        var by = first ? first.offsetWidth + 16 : 260;
        vp.scrollBy({ left: dir * by * (isMobile() ? 1 : 2), behavior: reduced() ? 'auto' : 'smooth' });
      }
      function sync() {
        var max = vp.scrollWidth - vp.clientWidth - 4;
        prev.disabled = vp.scrollLeft <= 2;
        next.disabled = vp.scrollLeft >= max;
        r.classList.toggle('is-static', max <= 2);
      }
      prev.addEventListener('click', function () { step(-1); });
      next.addEventListener('click', function () { step(1); });
      vp.addEventListener('scroll', debounce(sync, 90));
      w.addEventListener('resize', debounce(sync, 200));
      sync();
    });
  }

  /* ---------- quick view --------------------------------------------------- */
  function quickView(id) {
    var p = NK.byId(id);
    if (!p) { err('Product not found.'); return; }
    var hex = p.colors[0].hex, colorKey = p.colors[0].key;
    var size = NK.firstAvailableSize(p);
    var views = ['front', 'back', 'flat', 'detail'];
    openModal({
      size: 'md',
      html: "<div class='qv'>" +
        "<div class='qv__m'>" +
          "<div class='qv__stage'><img id='qvImg'" + srcPair(p, hex, 'front', 600, true) + " alt='" + attr(altText(p, 'front')) + "' width='600' height='800'></div>" +
          "<div class='qv__thumbs'>" + views.map(function (v, i) {
            return "<button class='qv__th" + (i ? '' : ' is-on') + "' type='button' data-view='" + v + "' aria-label='" + IMG.LABELS[v] + "'>" +
              "<img" + srcPair(p, hex, v, 200, true) + " alt='' width='600' height='800'></button>";
          }).join('') + "</div>" +
          "<span class='qv__tags'>" + tagsFor(p) + "</span>" +
        "</div>" +
        "<div class='qv__b'>" +
          "<p class='card__brand'>" + esc(p.brand) + "</p>" +
          "<h2 class='mhead__t' id='modalTitle'>" + esc(p.name) + "</h2>" +
          "<div class='card__row'>" + priceBlock(p) + ratePill(p) + "</div>" +
          "<p class='note'>" + esc(p.fabric) + " · " + esc(p.fit) + "</p>" +
          "<div class='pbox'><div class='pbox__h'><span class='pbox__l'>Colour</span><span class='note' id='qvColor'>" + esc(p.colors[0].name) + "</span></div>" +
            "<div class='pcolors'>" + p.colors.map(function (c, i) {
              return "<button class='pcolor" + (i ? '' : ' is-on') + "' type='button' data-color='" + c.key + "' data-hex='" + c.hex + "' " +
                "aria-label='" + attr(c.name) + "' aria-pressed='" + (i === 0) + "'><span class='pcolor__d' style='--sw:" + c.hex + "'></span></button>";
            }).join('') + "</div></div>" +
          "<div class='pbox'><div class='pbox__h'><span class='pbox__l'>Size</span>" +
            "<button class='linkish' type='button' data-sizeguide='" + p.id + "'>Size guide</button></div>" +
            "<div class='psizes'>" + p.sizes.map(function (s) {
              var q = p.stock[s];
              return "<button class='psize" + (s === size ? ' is-on' : '') + "' type='button' data-size='" + s + "'" +
                (q > 0 ? '' : ' disabled') + " aria-pressed='" + (s === size) + "'>" + esc(s) +
                (q > 0 && q <= 3 ? "<span class='psize__few'>" + q + "</span>" : '') + "</button>";
            }).join('') + "</div>" +
            "<p class='note' id='qvStock'>" + esc((NK.stockNote(p, size) || {}).text || '') + "</p></div>" +
        "</div></div>",
      foot: "<a class='btn btn--ghost' href='#/p/" + p.id + "' data-close='1'>Full details</a>" +
        "<button class='btn btn--pri' type='button' id='qvAdd'>Add to bag</button>",
      mounted: function (root) {
        var img = qs('#qvImg', root);
        /* colour swatches only change the drawn fallback — the photo is keyed
           to the garment, not the colourway — so repaint both attributes */
        function setShot(el, view) {
          el.removeAttribute('data-fell');
          el.classList.remove('img--drawn');
          var photo = IMG.photo(p, view, 600, 800);
          el.setAttribute('data-fallback', IMG.img(p, hex, view));
          el.src = photo || IMG.img(p, hex, view);
        }
        function paint() {
          qsa('.qv__th', root).forEach(function (b) {
            setShot(qs('img', b), b.getAttribute('data-view'));
          });
          setShot(img, qs('.qv__th.is-on', root).getAttribute('data-view'));
        }
        on(root, 'click', '.qv__th', function (e, t) {
          qsa('.qv__th', root).forEach(function (b) { b.classList.remove('is-on'); });
          t.classList.add('is-on');
          setShot(img, t.getAttribute('data-view'));
          img.alt = altText(p, t.getAttribute('data-view'));
        });
        on(root, 'click', '.pcolor', function (e, t) {
          qsa('.pcolor', root).forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
          t.classList.add('is-on'); t.setAttribute('aria-pressed', 'true');
          hex = t.getAttribute('data-hex'); colorKey = t.getAttribute('data-color');
          qs('#qvColor', root).textContent = p.colors.filter(function (c) { return c.key === colorKey; })[0].name;
          paint();
        });
        on(root, 'click', '.psize:not([disabled])', function (e, t) {
          qsa('.psize', root).forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
          t.classList.add('is-on'); t.setAttribute('aria-pressed', 'true');
          size = t.getAttribute('data-size');
          qs('#qvStock', root).textContent = (NK.stockNote(p, size) || {}).text || '';
        });
        qs('#qvAdd', root).addEventListener('click', function () {
          var r = NK.cartAdd(p.id, size, colorKey, 1);
          if (r.ok) {
            ok('Added to your bag', p.name + ' · ' + size, { label: 'View bag', run: function () { w.location.hash = '#/cart'; } });
            closeModal();
          } else err(r.msg);
        });
      }
    });
  }

  /* ---------- size guide --------------------------------------------------- */
  function sizeGuide(id) {
    var p = NK.byId(id);
    if (!p) return;
    var chart = NK.chartFor(p);
    openModal({
      size: 'md', title: 'Size guide', sub: p.subName + ' · ' + p.fit,
      html: "<div class='sgtable'><table><thead><tr>" +
        chart.cols.map(function (c) { return "<th scope='col'>" + esc(c) + "</th>"; }).join('') +
        "</tr></thead><tbody>" + chart.rows.map(function (r) {
          return "<tr>" + r.map(function (cell, i) {
            return i === 0 ? "<th scope='row'>" + esc(cell) + "</th>" : "<td class='num'>" + esc(cell) + "</td>";
          }).join('') + "</tr>";
        }).join('') + "</tbody></table></div>" +
        "<p class='sgnote'>Measurements are of the garment, not the body, taken flat with a 0.5 inch tolerance. " +
        "Most shoppers tell us this style runs " + NK.reviewSummary(p.id).topFit.toLowerCase() + ".</p>" +
        "<p class='sgnote'>Still unsure? Measure a piece you already like across the chest, then match it to the chest column above.</p>",
      foot: "<button class='btn btn--pri' type='button' data-close='1'>Got it</button>"
    });
  }

  /* ---------- pick size before adding from a card --------------------------- */
  function pickAndAdd(id) {
    var p = NK.byId(id);
    if (!p) return;
    if (p.totalStock <= 0) { err('Sold out', 'We will restock this soon.'); return; }
    if (p.sizes.length === 1) {
      fromResult(NK.cartAdd(p.id, p.sizes[0], p.colors[0].key, 1));
      return;
    }
    var size = NK.firstAvailableSize(p), colorKey = p.colors[0].key;
    openModal({
      size: 'sm', title: 'Pick a size', sub: p.name,
      html: "<div class='pbox'><div class='psizes'>" + p.sizes.map(function (s) {
          var q = p.stock[s];
          return "<button class='psize" + (s === size ? ' is-on' : '') + "' type='button' data-size='" + s + "'" +
            (q > 0 ? '' : ' disabled') + " aria-pressed='" + (s === size) + "'>" + esc(s) +
            (q > 0 && q <= 3 ? "<span class='psize__few'>" + q + "</span>" : '') + "</button>";
        }).join('') + "</div><p class='note' id='psStock'>" + esc((NK.stockNote(p, size) || {}).text || '') + "</p></div>" +
        (p.colors.length > 1 ? "<div class='pbox'><div class='pbox__h'><span class='pbox__l'>Colour</span>" +
          "<span class='note' id='psColor'>" + esc(p.colors[0].name) + "</span></div><div class='pcolors'>" +
          p.colors.map(function (c, i) {
            return "<button class='pcolor" + (i ? '' : ' is-on') + "' type='button' data-color='" + c.key + "' " +
              "aria-label='" + attr(c.name) + "'><span class='pcolor__d' style='--sw:" + c.hex + "'></span></button>";
          }).join('') + "</div></div>" : '') +
        "<button class='linkish' type='button' data-sizeguide='" + p.id + "'>Open size guide</button>",
      foot: "<button class='btn btn--ghost' type='button' data-close='1'>Cancel</button>" +
        "<button class='btn btn--pri' type='button' id='psAdd' data-autofocus>Add to bag</button>",
      mounted: function (root) {
        on(root, 'click', '.psize:not([disabled])', function (e, t) {
          qsa('.psize', root).forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
          t.classList.add('is-on'); t.setAttribute('aria-pressed', 'true');
          size = t.getAttribute('data-size');
          qs('#psStock', root).textContent = (NK.stockNote(p, size) || {}).text || '';
        });
        on(root, 'click', '.pcolor', function (e, t) {
          qsa('.pcolor', root).forEach(function (b) { b.classList.remove('is-on'); });
          t.classList.add('is-on');
          colorKey = t.getAttribute('data-color');
          var c = p.colors.filter(function (x) { return x.key === colorKey; })[0];
          if (qs('#psColor', root)) qs('#psColor', root).textContent = c.name;
        });
        qs('#psAdd', root).addEventListener('click', function () {
          var r = NK.cartAdd(p.id, size, colorKey, 1);
          if (r.ok) {
            ok('Added to your bag', p.name + ' · ' + size, { label: 'View bag', run: function () { w.location.hash = '#/cart'; } });
            closeModal();
          } else err(r.msg);
        });
      }
    });
  }

  /* ---------- global card delegation ---------------------------------------- */
  function wireCards(root) {
    root = root || d.body;
    if (root.__nkCards) return;
    root.__nkCards = true;
    on(root, 'click', '[data-wish]', function (e, t) {
      e.preventDefault();
      var id = t.getAttribute('data-wish');
      var r = NK.wishToggle(id);
      if (!r.ok) return;
      qsa("[data-wish='" + id + "']").forEach(function (b) {
        b.classList.toggle('is-on', r.on);
        b.setAttribute('aria-pressed', String(r.on));
      });
      var p = NK.byId(id);
      if (r.on) ok('Saved to wishlist', p.name, { label: 'View wishlist', run: function () { w.location.hash = '#/wishlist'; } });
      else info('Removed from wishlist', p.name, { label: 'Undo', run: function () { NK.wishToggle(id); refreshBadges(); } });
    });
    on(root, 'click', '[data-quick]', function (e, t) { e.preventDefault(); quickView(t.getAttribute('data-quick')); });
    on(root, 'click', '[data-add]', function (e, t) { e.preventDefault(); pickAndAdd(t.getAttribute('data-add')); });
    on(root, 'click', '[data-sizeguide]', function (e, t) { e.preventDefault(); sizeGuide(t.getAttribute('data-sizeguide')); });
    on(root, 'click', '[data-compare]', function (e, t) {
      e.preventDefault();
      var r = NK.compareToggle(t.getAttribute('data-compare'));
      fromResult(r);
    });
    on(root, 'click', '[data-notify]', function (e, t) {
      e.preventDefault();
      var p = NK.byId(t.getAttribute('data-notify'));
      openModal({
        size: 'sm', title: 'Tell me when it is back', sub: p.name,
        html: field({ id: 'ntEmail', label: 'Email address', type: 'email', value: (NK.user() || {}).email || '',
          hint: 'One email when this restocks. Nothing else.' }),
        foot: "<button class='btn btn--ghost' type='button' data-close='1'>Cancel</button>" +
          "<button class='btn btn--pri' type='button' id='ntGo' data-autofocus>Notify me</button>",
        mounted: function (r2) {
          qs('#ntGo', r2).addEventListener('click', function () {
            var v = qs('#ntEmail', r2).value, msg = NK.V.email(v);
            if (msg) { setFieldError(r2, 'ntEmail', msg); return; }
            closeModal();
            ok('You are on the list', 'We will email ' + v + ' the moment it lands.');
          });
        }
      });
    });
    // swatch preview swaps the card image without leaving the grid
    on(root, 'mouseover', '[data-sw]', function (e, t) { swap(t); });
    on(root, 'click', '[data-sw]', function (e, t) { e.preventDefault(); swap(t); });
    on(root, 'focusin', '[data-sw]', function (e, t) { swap(t); });
    function swap(t) {
      var p = NK.byId(t.getAttribute('data-sw'));
      var hex = t.getAttribute('data-hex');
      if (!p) return;
      var artc = t.closest('.card');
      if (!artc) return;
      var main = qs('.card__img--main', artc), alt = qs('.card__img--alt', artc);
      function swap(el, view) {
        if (!el) return;
        el.removeAttribute('data-src');
        el.removeAttribute('data-fell');
        el.classList.remove('img--drawn');
        el.setAttribute('data-fallback', IMG.img(p, hex, view));
        el.src = IMG.photo(p, view, 600, 800) || IMG.img(p, hex, view);
        el.classList.add('is-in');
      }
      swap(main, 'front'); swap(alt, 'back');
      qsa('.card__sw', artc).forEach(function (b) { b.classList.toggle('is-on', b === t); });
    }
  }

  /* ---------- badges ------------------------------------------------------- */
  function bump(el) {
    if (!el || reduced()) return;
    el.classList.remove('is-bump');
    raf(function () { el.classList.add('is-bump'); });
    setTimeout(function () { el.classList.remove('is-bump'); }, 520);
  }
  function refreshBadges() {
    var c = NK.cartCount(), wc = NK.wishCount();
    [['#cartBadge', c], ['#wishBadge', wc]].forEach(function (pair) {
      var el = qs(pair[0]);
      if (!el) return;
      var changed = el.textContent !== String(pair[1]);
      el.textContent = pair[1];
      el.hidden = pair[1] === 0;
      if (changed && pair[1] > 0) bump(el);
    });
    var bc = qs('#bnavCart'), bw = qs('#bnavWish');
    if (bc) bc.hidden = c === 0;
    if (bw) bw.hidden = wc === 0;
    var cb = qs('#cartBtn');
    if (cb) cb.setAttribute('aria-label', c ? 'Shopping bag, ' + c + ' ' + NK.plural(c, 'item') : 'Shopping bag, empty');
  }

  /* ---------- forms -------------------------------------------------------- */
  function field(o) {
    o = o || {};
    var id = o.id;
    return "<div class='field" + (o.wide ? ' field--wide' : '') + "' data-field='" + id + "'>" +
      "<label class='field__l' for='" + id + "'>" + esc(o.label) + (o.optional ? " <span class='note'>(optional)</span>" : '') + "</label>" +
      (o.tag === 'textarea'
        ? "<textarea class='inp' id='" + id + "' name='" + id + "' rows='" + (o.rows || 4) + "' placeholder='" + attr(o.placeholder || '') + "'" +
          (o.max ? " maxlength='" + o.max + "'" : '') + " aria-describedby='" + id + "-e'>" + esc(o.value || '') + "</textarea>"
        : o.tag === 'select'
        ? "<select class='inp' id='" + id + "' name='" + id + "' aria-describedby='" + id + "-e'>" +
          (o.options || []).map(function (op) {
            return "<option value='" + attr(op.value) + "'" + (op.value === o.value ? ' selected' : '') + ">" + esc(op.label) + "</option>";
          }).join('') + "</select>"
        : "<input class='inp' id='" + id + "' name='" + id + "' type='" + (o.type || 'text') + "' " +
          "value='" + attr(o.value || '') + "' placeholder='" + attr(o.placeholder || '') + "'" +
          (o.inputmode ? " inputmode='" + o.inputmode + "'" : '') +
          (o.max ? " maxlength='" + o.max + "'" : '') +
          (o.autocomplete ? " autocomplete='" + o.autocomplete + "'" : '') +
          (o.disabled ? ' disabled' : '') +
          (o.autofocus ? ' data-autofocus' : '') + " aria-describedby='" + id + "-e'>") +
      (o.hint ? "<p class='field__hint'>" + esc(o.hint) + "</p>" : '') +
      "<p class='field__e' id='" + id + "-e' role='alert'></p></div>";
  }
  function setFieldError(root, id, msg) {
    var wrap = qs("[data-field='" + id + "']", root || d);
    if (!wrap) return;
    wrap.classList.toggle('is-bad', !!msg);
    var e = qs('.field__e', wrap);
    if (e) e.textContent = msg || '';
    var inp = qs('.inp', wrap);
    if (inp) inp.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function readForm(root, ids) {
    var out = {};
    ids.forEach(function (id) {
      var el = qs('#' + id, root);
      out[id] = el ? el.value : '';
    });
    return out;
  }
  /* rules: { fieldId: validatorFn }. Returns true when everything passes. */
  function validate(root, rules) {
    var first = null, pass = true;
    Object.keys(rules).forEach(function (id) {
      var el = qs('#' + id, root);
      if (!el) return;
      var msg = rules[id](el.value) || '';
      setFieldError(root, id, msg);
      if (msg) { pass = false; if (!first) first = el; }
    });
    if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); }
    return pass;
  }
  /* validate on blur, clear the error as soon as the shopper fixes it */
  function liveValidate(root, rules) {
    Object.keys(rules).forEach(function (id) {
      var el = qs('#' + id, root);
      if (!el) return;
      el.addEventListener('blur', function () { setFieldError(root, id, rules[id](el.value) || ''); });
      el.addEventListener('input', function () {
        var wrap = qs("[data-field='" + id + "']", root);
        if (wrap && wrap.classList.contains('is-bad') && !rules[id](el.value)) setFieldError(root, id, '');
      });
    });
  }
  function busy(btn, yes, label) {
    if (!btn) return;
    if (yes) {
      btn.__label = btn.innerHTML;
      btn.classList.add('is-busy');
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      if (label) btn.innerHTML = esc(label);
    } else {
      btn.classList.remove('is-busy');
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      if (btn.__label) btn.innerHTML = btn.__label;
    }
  }
  /* a short, honest pause so state changes read as work rather than a flicker */
  function pretend(ms) {
    return new Promise(function (res) { setTimeout(res, reduced() ? 40 : (ms || 620)); });
  }

  /* ---------- page loading bar --------------------------------------------- */
  var loadEl, loadTimer;
  function loadStart() {
    loadEl = loadEl || qs('#pageload');
    if (!loadEl) return;
    clearTimeout(loadTimer);
    loadEl.hidden = false;
    loadEl.classList.add('is-on');
  }
  function loadDone() {
    if (!loadEl) return;
    loadEl.classList.remove('is-on');
    loadTimer = setTimeout(function () { loadEl.hidden = true; }, 320);
  }

  /* ---------- accordions (shared by filters, PDP, drawer) ------------------ */
  function wireAccordions(root, btnSel, panelAttr) {
    on(root, 'click', btnSel, function (e, t) {
      var panel = t.nextElementSibling;
      if (!panel) return;
      var open = panel.getAttribute(panelAttr || 'data-open') === '1';
      panel.setAttribute(panelAttr || 'data-open', open ? '0' : '1');
      t.setAttribute('aria-expanded', String(!open));
    });
  }

  function scrollTop(smooth) {
    w.scrollTo({ top: 0, behavior: smooth && !reduced() ? 'smooth' : 'auto' });
  }
  function hydrate(root) {
    hydrateLazy(root);
    hydrateReveal(root);
    wireRails(root);
  }

  w.UI = {
    qs: qs, qsa: qsa, esc: esc, attr: attr, on: on, debounce: debounce, raf: raf,
    reduced: reduced, isMobile: isMobile, isCompact: isCompact, icon: icon, ICON: ICON,
    toast: toast, ok: ok, err: err, info: info, fromResult: fromResult,
    openModal: openModal, closeModal: closeModal, confirm: confirmDialog,
    openSheet: openSheet, closeSheet: closeSheet, closeAllSheets: closeAllSheets, lockScroll: lockScroll,
    stars: stars, ratePill: ratePill, priceBlock: priceBlock, tagsFor: tagsFor, altText: altText,
    srcPair: srcPair,
    card: card, grid: grid, rail: rail, section: section, wireRails: wireRails,
    skeletonGrid: skeletonGrid, state: state, emptyArt: emptyArt,
    hydrate: hydrate, hydrateLazy: hydrateLazy, hydrateReveal: hydrateReveal,
    quickView: quickView, sizeGuide: sizeGuide, pickAndAdd: pickAndAdd,
    wireCards: wireCards, refreshBadges: refreshBadges, bump: bump,
    field: field, setFieldError: setFieldError, readForm: readForm,
    validate: validate, liveValidate: liveValidate, busy: busy, pretend: pretend,
    loadStart: loadStart, loadDone: loadDone, wireAccordions: wireAccordions, scrollTop: scrollTop
  };
})(window, document);
