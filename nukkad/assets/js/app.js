/* ==========================================================================
   NUKKAD — app: chrome, navigation, search, router
   ========================================================================== */
(function (w, d) {
  'use strict';

  var NK = w.NK, U = w.UI, IMG = w.NK_IMG, V = w.NK_VIEWS;
  var qs = U.qs, qsa = U.qsa, esc = U.esc, attr = U.attr, on = U.on, icon = U.icon;

  /* ---------- announcement marquee ---------------------------------------- */
  var OFFERS = [
    'Free shipping over ' + NK.money(NK.FREE_SHIP),
    'FIRSTFIT — 25% off your first order',
    '14-day easy returns, no questions',
    'Cash on delivery across 19,000+ PIN codes',
    'New drops every Thursday'
  ];
  function initAnnounce() {
    var bar = qs('#announce'), track = qs('#announceTrack');
    if (!bar || !track) return;
    if (NK.announceHidden()) { bar.hidden = true; d.body.classList.add('no-announce'); return; }
    var run = OFFERS.map(function (o) {
      return "<span class='announce__item'>" + icon('spark') + esc(o) + "</span>";
    }).join('');
    track.innerHTML = run + run;
    qs('#announceClose').addEventListener('click', function () {
      NK.hideAnnounce();
      bar.hidden = true;
      d.body.classList.add('no-announce');
      U.info('Offer bar hidden', 'All live offers stay on the Offers page.');
    });
  }

  /* ---------- header nav + mega menus ------------------------------------- */
  var NAVLINKS = [
    { label: 'Men', cat: 'men' },
    { label: 'Women', cat: 'women' },
    { label: 'Accessories', cat: 'accessories' },
    { label: 'New Arrivals', href: '#/new' },
    { label: 'Trending', href: '#/trending' },
    { label: 'Offers', href: '#/offers', hot: true }
  ];

  function megaFor(cat) {
    var c = NK.catBySlug(cat);
    if (!c) return '';
    var pick = NK.bestSellers(1, cat)[0] || NK.trending(1, cat)[0];
    var cols = c.groups.map(function (g) {
      return "<div class='mcol'><h3 class='mcol__h'>" + esc(g.name) + "</h3><ul>" +
        g.subs.map(function (slug) {
          var s = NK.subBySlug(cat, slug);
          if (!s) return '';
          return "<li><a class='mcol__l' href='#/c/" + cat + '/' + slug + "'>" + esc(s.name) + "</a></li>";
        }).join('') + "</ul></div>";
    }).join('');
    cols += "<div class='mcol'><h3 class='mcol__h'>Shop by</h3><ul>" +
      "<li><a class='mcol__l' href='#/c/" + cat + "?sort=newest'>New this week</a></li>" +
      "<li><a class='mcol__l' href='#/c/" + cat + "?sort=discount'>Biggest discounts</a></li>" +
      "<li><a class='mcol__l' href='#/c/" + cat + "?sort=rating'>Top rated</a></li>" +
      "<li><a class='mcol__l' href='#/c/" + cat + "?under=999'>Under " + NK.money(999) + "</a></li>" +
      "<li><a class='mcol__l' href='#/c/" + cat + "'>Everything in " + esc(c.name) + "</a></li>" +
      "</ul></div>";
    var promo = pick ? "<a class='mpromo' href='#/p/" + pick.id + "'>" +
      "<img" + U.srcPair(pick, pick.colors[0].hex, 'front', 600, true) + " alt='' width='600' height='800'>" +
      "<span class='mpromo__k'>Most wanted</span>" +
      "<span class='mpromo__t'>" + esc(pick.name) + "</span>" +
      "<span class='mpromo__c'>" + NK.money(pick.price) + " · shop now</span></a>" : '';
    return "<div class='mega__in wrap'>" + cols + promo + "</div>";
  }

  function initNav() {
    var list = qs('#navList'), mega = qs('#mega');
    if (!list) return;
    list.innerHTML = NAVLINKS.map(function (n) {
      if (n.cat) return "<li><button class='nav__btn' type='button' data-mega='" + n.cat + "' " +
        "aria-expanded='false' aria-controls='mega'>" + esc(n.label) +
        "<svg class='nav__caret' viewBox='0 0 24 24' aria-hidden='true'><path d='M6 10l6 6 6-6'/></svg></button></li>";
      return "<li><a class='nav__btn" + (n.hot ? ' nav__btn--hot' : '') + "' href='" + n.href + "'>" + esc(n.label) + "</a></li>";
    }).join('');

    var openCat = null, closeT = null;
    function openMega(cat, btn) {
      clearTimeout(closeT);
      if (openCat === cat) return;
      openCat = cat;
      mega.innerHTML = megaFor(cat);
      mega.hidden = false;
      U.raf(function () { mega.classList.add('is-on'); });
      qsa('.nav__btn[data-mega]').forEach(function (b) {
        var on_ = b.getAttribute('data-mega') === cat;
        b.classList.toggle('is-on', on_);
        b.setAttribute('aria-expanded', String(on_));
      });
    }
    function closeMega(now) {
      clearTimeout(closeT);
      closeT = setTimeout(function () {
        openCat = null;
        mega.classList.remove('is-on');
        setTimeout(function () { if (!openCat) mega.hidden = true; }, 200);
        qsa('.nav__btn[data-mega]').forEach(function (b) {
          b.classList.remove('is-on'); b.setAttribute('aria-expanded', 'false');
        });
      }, now ? 0 : 180);
    }
    on(list, 'mouseenter', '.nav__btn[data-mega]', function (e, t) { openMega(t.getAttribute('data-mega'), t); });
    on(list, 'focusin', '.nav__btn[data-mega]', function (e, t) { openMega(t.getAttribute('data-mega'), t); });
    on(list, 'click', '.nav__btn[data-mega]', function (e, t) {
      e.preventDefault();
      if (openCat === t.getAttribute('data-mega')) { closeMega(true); w.location.hash = '#/c/' + t.getAttribute('data-mega'); }
      else openMega(t.getAttribute('data-mega'), t);
    });
    list.addEventListener('mouseleave', function () { closeMega(); });
    mega.addEventListener('mouseenter', function () { clearTimeout(closeT); });
    mega.addEventListener('mouseleave', function () { closeMega(); });
    on(mega, 'click', 'a', function () { closeMega(true); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMega(true); });
    d.addEventListener('click', function (e) {
      if (openCat && !e.target.closest('#mega') && !e.target.closest('#navList')) closeMega(true);
    });
    w.addEventListener('hashchange', function () { closeMega(true); });
  }

  /* ---------- sticky header ------------------------------------------------ */
  function initSticky() {
    var hdr = qs('#hdr'), last = 0;
    if (!hdr) return;
    function onScroll() {
      var y = w.scrollY || d.documentElement.scrollTop;
      hdr.classList.toggle('is-stuck', y > 12);
      hdr.classList.toggle('is-up', y > 320 && y > last);
      last = y;
    }
    w.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- account menu ------------------------------------------------- */
  function acctMenuHtml() {
    var u = NK.user();
    if (!u) {
      return "<div class='acct__hi'><strong>Welcome to NUKKAD</strong>" +
        "<span>Log in for your orders, wishlist and faster checkout.</span></div>" +
        "<a class='acct__link' href='#/login'>" + icon('user') + "Log in</a>" +
        "<a class='acct__link' href='#/register'>" + icon('spark') + "Create an account</a>" +
        "<a class='acct__link' href='#/track'>" + icon('truck') + "Track an order</a>" +
        "<a class='acct__link' href='#/wishlist'>" + icon('heart') + "Wishlist</a>";
    }
    var st = NK.orderStats();
    return "<div class='acct__hi'><strong>" + esc(u.name) + "</strong><span>" + esc(u.email) + "</span></div>" +
      "<a class='acct__link' href='#/account'>" + icon('user') + "My account</a>" +
      "<a class='acct__link' href='#/account/orders'>" + icon('box') + "My orders" +
        (st.live ? "<span class='badge badge--inline'>" + st.live + " live</span>" : '') + "</a>" +
      "<a class='acct__link' href='#/wishlist'>" + icon('heart') + "Wishlist</a>" +
      "<a class='acct__link' href='#/account/addresses'>" + icon('pin') + "Addresses</a>" +
      "<a class='acct__link' href='#/account/settings'>" + icon('lock') + "Settings</a>" +
      "<button class='acct__link acct__link--danger' type='button' data-logout>" + icon('x') + "Log out</button>";
  }
  function initAcct() {
    var wrap = qs('#acctWrap'), btn = qs('#acctBtn'), menu = qs('#acctMenu');
    function paint() {
      menu.innerHTML = acctMenuHtml();
      var u = NK.user();
      qs('#acctLabel').textContent = u ? u.name.split(' ')[0] : 'Account';
      btn.setAttribute('aria-label', u ? 'Account menu for ' + u.name : 'Account');
    }
    function close() { menu.hidden = true; wrap.classList.remove('is-on'); btn.setAttribute('aria-expanded', 'false'); }
    function open() { paint(); menu.hidden = false; wrap.classList.add('is-on'); btn.setAttribute('aria-expanded', 'true'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.hidden ? open() : close();
    });
    wrap.addEventListener('mouseenter', function () { if (!U.isCompact()) open(); });
    wrap.addEventListener('mouseleave', function () { if (!U.isCompact()) close(); });
    d.addEventListener('click', function (e) { if (!e.target.closest('#acctWrap')) close(); });
    on(menu, 'click', 'a', close);
    NK.on('auth', paint);
    paint();
  }

  /* ---------- search (desktop panel + mobile sheet) ------------------------ */
  var TRENDY = ['oversized tees', 'hoodies', 'baggy jeans', 'co-ords', 'caps', 'printed shirts', 'joggers', 'tote bags'];

  function sugHtml(q) {
    if (!q || q.trim().length < 2) {
      var recent = NK.recentSearches();
      var html = '';
      if (recent.length) {
        html += "<div class='srch__grp'><div class='srch__gh'>Recent searches" +
          "<button class='srch__wipe' type='button' data-wipe>Clear</button></div><ul class='srch__list'>" +
          recent.map(function (r) {
            return "<li><button class='srch__row' type='button' data-q='" + attr(r) + "'>" +
              icon('sort') + "<span>" + esc(r) + "</span></button></li>";
          }).join('') + "</ul></div>";
      }
      html += "<div class='srch__grp'><div class='srch__gh'>Trending on NUKKAD</div><div class='srch__tags'>" +
        TRENDY.map(function (t) {
          return "<button class='tag' type='button' data-q='" + attr(t) + "'>" + esc(t) + "</button>";
        }).join('') + "</div></div>";
      var picks = NK.trending(4);
      html += "<div class='srch__grp'><div class='srch__gh'>Most wanted right now</div><ul class='srch__prods'>" +
        picks.map(prodRow).join('') + "</ul></div>";
      return html;
    }

    var s = NK.suggestions(q);
    if (!s.terms.length && !s.products.length) {
      return "<div class='srch__none'>" + icon('search') +
        "<p><strong>Nothing matches “" + esc(q) + "”</strong>" +
        "<span>Try a category, a fit or a colour — like “oversized black tee”.</span></p>" +
        "<div class='srch__tags'>" + TRENDY.slice(0, 5).map(function (t) {
          return "<button class='tag' type='button' data-q='" + attr(t) + "'>" + esc(t) + "</button>";
        }).join('') + "</div></div>";
    }
    var out = '';
    if (s.terms.length) {
      out += "<div class='srch__grp'><div class='srch__gh'>Suggestions</div><ul class='srch__list'>" +
        s.terms.map(function (t) {
          return "<li><button class='srch__row' type='button' data-q='" + attr(t.q) + "'" +
            (t.href ? " data-href='" + attr(t.href) + "'" : '') + ">" + icon('search') +
            "<span>" + t.html + "</span>" +
            (t.note ? "<em class='srch__note'>" + esc(t.note) + "</em>" : '') + "</button></li>";
        }).join('') + "</ul></div>";
    }
    if (s.products.length) {
      out += "<div class='srch__grp'><div class='srch__gh'>Products</div><ul class='srch__prods'>" +
        s.products.map(prodRow).join('') + "</ul></div>";
    }
    out += "<div class='srch__all'><a class='btn btn--ghost btn--sm' href='#/search?q=" +
      encodeURIComponent(q) + "'>See all results for “" + esc(q) + "”" + icon('arrowR') + "</a></div>";
    return out;
  }

  function prodRow(p) {
    return "<li><a class='srch__p' href='#/p/" + p.id + "'>" +
      "<img" + U.srcPair(p, p.colors[0].hex, 'front', 200, true) + " alt='' width='60' height='80' loading='lazy'>" +
      "<span class='srch__pi'><strong>" + esc(p.name) + "</strong>" +
      "<em>" + esc(p.subName) + " · " + NK.money(p.price) +
      " <s>" + NK.money(p.mrp) + "</s></em></span>" +
      U.ratePill(p) + "</a></li>";
  }

  function wireSugPanel(panel, input, close) {
    on(panel, 'click', '[data-wipe]', function () {
      NK.clearSearches();
      panel.innerHTML = sugHtml('');
      U.info('Recent searches cleared');
    });
    on(panel, 'click', '[data-q]', function (e, t) {
      var q = t.getAttribute('data-q'), href = t.getAttribute('data-href');
      NK.pushSearch(q);
      input.value = q;
      close();
      w.location.hash = href || ('#/search?q=' + encodeURIComponent(q));
    });
    on(panel, 'click', 'a', function () { close(); });
  }

  function initSearch() {
    var form = qs('#srchForm'), input = qs('#srchInput'), panel = qs('#srchPanel'), clear = qs('#srchClear');

    function open() {
      panel.innerHTML = sugHtml(input.value);
      panel.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      d.body.classList.add('srch-on');
    }
    function close() {
      panel.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      d.body.classList.remove('srch-on');
    }
    var paint = U.debounce(function () {
      clear.hidden = !input.value;
      if (!panel.hidden) panel.innerHTML = sugHtml(input.value);
    }, 180);

    input.addEventListener('focus', open);
    input.addEventListener('input', function () { if (panel.hidden) open(); paint(); });
    clear.addEventListener('click', function () {
      input.value = ''; clear.hidden = true; input.focus(); panel.innerHTML = sugHtml('');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) { input.focus(); return; }
      NK.pushSearch(q);
      close();
      w.location.hash = '#/search?q=' + encodeURIComponent(q);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); input.blur(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var rows = qsa('.srch__row, .srch__p, .tag', panel);
      if (!rows.length) return;
      e.preventDefault();
      var i = rows.indexOf(d.activeElement);
      i = e.key === 'ArrowDown' ? (i + 1) % rows.length : (i <= 0 ? rows.length - 1 : i - 1);
      rows[i].focus();
    });
    d.addEventListener('click', function (e) {
      if (!e.target.closest('.hdr__search')) close();
    });
    wireSugPanel(panel, input, close);
    w.addEventListener('hashchange', close);

    /* mobile sheet */
    var sheet = qs('#msearch'), mi = qs('#msearchInput'), mp = qs('#msearchPanel'), mc = qs('#msearchClear');
    function mOpen() {
      sheet.hidden = false;
      U.lockScroll(true);
      mp.innerHTML = sugHtml(mi.value);
      U.raf(function () { sheet.classList.add('is-on'); mi.focus(); });
    }
    function mClose() {
      sheet.classList.remove('is-on');
      U.lockScroll(false);
      setTimeout(function () { sheet.hidden = true; }, 220);
    }
    var mPaint = U.debounce(function () {
      mc.hidden = !mi.value;
      mp.innerHTML = sugHtml(mi.value);
    }, 180);
    qs('#mobSearchBtn').addEventListener('click', mOpen);
    qs('#msearchBack').addEventListener('click', mClose);
    mc.addEventListener('click', function () { mi.value = ''; mc.hidden = true; mi.focus(); mp.innerHTML = sugHtml(''); });
    mi.addEventListener('input', mPaint);
    mi.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') mClose();
      if (e.key === 'Enter') {
        var q = mi.value.trim();
        if (!q) return;
        NK.pushSearch(q); mClose();
        w.location.hash = '#/search?q=' + encodeURIComponent(q);
      }
    });
    wireSugPanel(mp, mi, mClose);
    w.NK_SEARCH = { open: mOpen, close: mClose, focus: function () { U.isCompact() ? mOpen() : input.focus(); } };
  }

  /* ---------- mobile drawer ------------------------------------------------ */
  function drawerHtml() {
    var u = NK.user();
    var head = u
      ? "<a class='mdrawer__user' href='#/account'><span class='mdrawer__av'>" + esc(u.name.slice(0, 1)) + "</span>" +
        "<div><b>" + esc(u.name) + "</b><span>View your account</span></div>" + icon('chev') + "</a>"
      : "<div class='mdrawer__user'><div><b>Hey there</b><span>Log in for orders and faster checkout</span></div>" +
        "<a class='btn btn--sm btn--gold' href='#/login'>Log in</a></div>";

    /* the panel carries data-open because that is the contract U.wireAccordions
       toggles, and the CSS animates grid-template-rows off the same attribute */
    var cats = NK.TAXONOMY.map(function (c) {
      return "<div class='acc'>" +
        "<button class='acc__t' type='button' aria-expanded='false'>" + esc(c.name) +
        "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M6 10l6 6 6-6'/></svg></button>" +
        "<div class='acc__p' data-open='0'><div class='acc__pi'>" +
          "<a class='acc__l acc__l--all' href='#/c/" + c.slug + "'>All " + esc(c.name) + "</a>" +
          c.groups.reduce(function (acc, g) { return acc.concat(g.subs); }, []).map(function (slug) {
            var s = NK.subBySlug(c.slug, slug);
            return s ? "<a class='acc__l' href='#/c/" + c.slug + '/' + slug + "'>" + esc(s.name) + "</a>" : '';
          }).join('') +
        "</div></div></div>";
    }).join('');

    var quick = [
      { href: '#/new', label: 'New arrivals', ic: 'spark' },
      { href: '#/trending', label: 'Trending now', ic: 'star' },
      { href: '#/offers', label: 'Offers & coupons', ic: 'tag' },
      { href: '#/track', label: 'Track an order', ic: 'truck' },
      { href: '#/wishlist', label: 'Wishlist', ic: 'heart' },
      { href: '#/compare', label: 'Compare', ic: 'scale' }
    ].map(function (q) {
      return "<a class='mdrawer__flat' href='" + q.href + "'>" + icon(q.ic) + esc(q.label) + "</a>";
    }).join('');

    return head + "<nav aria-label='Categories'>" + cats + "</nav>" +
      "<div class='mdrawer__sep'></div><nav aria-label='Shortcuts'>" + quick + "</nav>" +
      (u ? "<div class='mdrawer__sep'></div><button class='mdrawer__flat mdrawer__flat--danger' type='button' data-logout>" +
        icon('x') + "Log out</button>" : '') +
      "<p class='mdrawer__note'>Free shipping over " + NK.money(NK.FREE_SHIP) + " · 14-day returns</p>";
  }

  function initDrawer() {
    var drawer = qs('#mdrawer'), scrim = qs('#scrim'), burger = qs('#burger'), body = qs('#mdrawerBody');
    var lastFocus = null;
    function open() {
      lastFocus = d.activeElement;
      body.innerHTML = drawerHtml();
      U.wireAccordions(body, '.acc__t', null);
      drawer.hidden = false; scrim.hidden = false;
      U.lockScroll(true);
      burger.setAttribute('aria-expanded', 'true');
      U.raf(function () { drawer.classList.add('is-on'); scrim.classList.add('is-on'); qs('#mdrawerClose').focus(); });
    }
    function close() {
      drawer.classList.remove('is-on'); scrim.classList.remove('is-on');
      burger.setAttribute('aria-expanded', 'false');
      U.lockScroll(false);
      setTimeout(function () { drawer.hidden = true; scrim.hidden = true; }, 240);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    burger.addEventListener('click', function () { drawer.hidden ? open() : close(); });
    qs('#mdrawerClose').addEventListener('click', close);
    scrim.addEventListener('click', close);
    on(body, 'click', 'a', close);
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hidden) close(); });
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = qsa('button, a, input', drawer).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    w.addEventListener('hashchange', function () { if (!drawer.hidden) close(); });
  }

  /* ---------- footer -------------------------------------------------------- */
  function initFooter() {
    var f = qs('#ftr');
    function col(h, links) {
      return "<div class='ftr__col'><h3 class='ftr__h'>" + h + "</h3><ul>" +
        links.map(function (l) {
          return "<li><a class='ftr__l' href='" + l[1] + "'" +
            (l[2] ? " data-info='" + attr(l[0]) + "'" : '') + ">" + esc(l[0]) + "</a></li>";
        }).join('') + "</ul></div>";
    }
    var men = NK.catBySlug('men'), women = NK.catBySlug('women');
    var mLinks = men.groups[0].subs.slice(0, 6).map(function (s) {
      return [NK.subBySlug('men', s).name, '#/c/men/' + s];
    });
    var wLinks = women.groups[0].subs.slice(0, 6).map(function (s) {
      return [NK.subBySlug('women', s).name, '#/c/women/' + s];
    });

    f.innerHTML =
      "<div class='ftr__top wrap'>" +
        "<div class='ftr__brand'>" +
          "<a class='brand brand--ftr' href='#/' aria-label='NUKKAD home'>" +
            "<span class='brand__mark' aria-hidden='true'><svg viewBox='0 0 32 32' width='34' height='34'>" +
            "<rect width='32' height='32' rx='7' fill='#FFB703'/><path d='M8 24V8h4l8 10V8h4v16h-4L12 14v10z' fill='#0C3B2E'/></svg></span>" +
            "<span class='brand__type'><span class='brand__word'>NUKKAD</span><span class='brand__tag'>off the corner</span></span>" +
          "</a>" +
          "<p class='ftr__p'>Clothes cut for chai stalls, last trains and long walks home. Printed in India, in small runs, for people who dress like they mean it.</p>" +
          "<div class='ftr__soc'>" +
            ['Instagram', 'YouTube', 'Threads', 'Pinterest'].map(function (s) {
              return "<button class='ftr__s' type='button' data-soc='" + s + "'>" + s + "</button>";
            }).join('') +
          "</div>" +
        "</div>" +
        col('Men', mLinks.concat([['Shop all men', '#/c/men']])) +
        col('Women', wLinks.concat([['Shop all women', '#/c/women']])) +
        col('Shop', [['New arrivals', '#/new'], ['Trending', '#/trending'], ['Offers', '#/offers'],
          ['Accessories', '#/c/accessories'], ['Compare', '#/compare'], ['Wishlist', '#/wishlist']]) +
        col('Help', [['Track your order', '#/track'], ['Shipping policy', '#/info/shipping'],
          ['Returns & exchanges', '#/info/returns'], ['Size guide', '#/info/size-guide'],
          ['Contact us', '#/info/contact'], ['FAQs', '#/info/faq']]) +
        col('Company', [['About NUKKAD', '#/info/about'], ['Careers', '#/info/careers'],
          ['Terms of use', '#/info/terms'], ['Privacy policy', '#/info/privacy'],
          ['Responsible making', '#/info/making']]) +
      "</div>" +
      "<div class='ftr__strip wrap'>" +
        [['truck', 'Free shipping over ' + NK.money(NK.FREE_SHIP)], ['ret', '14-day easy returns'],
         ['lock', 'Secure payments'], ['leaf', 'Small-batch printing']].map(function (t) {
          return "<span class='ftr__trust'>" + icon(t[0]) + esc(t[1]) + "</span>";
        }).join('') +
      "</div>" +
      "<div class='ftr__bot wrap'>" +
        "<p>&copy; " + new Date().getFullYear() + " NUKKAD Apparel Pvt Ltd. All original designs. This is a demo storefront — no real orders are placed.</p>" +
        "<p class='ftr__pay'>UPI · Visa · Mastercard · RuPay · Net Banking · Cash on delivery</p>" +
      "</div>";

    on(f, 'click', '[data-soc]', function (e, t) {
      U.info(t.getAttribute('data-soc') + ' is not wired up', 'This is a demo storefront, so social links stay inside the site.');
    });
  }

  /* ---------- route parsing ------------------------------------------------ */
  function parseHash() {
    var h = (w.location.hash || '#/').replace(/^#/, '');
    var qi = h.indexOf('?');
    var path = qi < 0 ? h : h.slice(0, qi);
    var query = {};
    if (qi >= 0) {
      h.slice(qi + 1).split('&').forEach(function (kv) {
        if (!kv) return;
        var p = kv.split('=');
        var k = decodeURIComponent(p[0]);
        var v = decodeURIComponent((p[1] || '').replace(/\+/g, ' '));
        query[k] = v;
      });
    }
    var parts = path.split('/').filter(Boolean);
    return { path: '/' + parts.join('/'), parts: parts, query: query, raw: h };
  }

  var TITLES = {
    '/': 'NUKKAD — Streetwear, Oversized Tees & Everyday Fits',
    '/cart': 'Your bag — NUKKAD',
    '/wishlist': 'Your wishlist — NUKKAD',
    '/compare': 'Compare products — NUKKAD',
    '/checkout': 'Checkout — NUKKAD',
    '/track': 'Track your order — NUKKAD',
    '/login': 'Log in — NUKKAD',
    '/register': 'Create your account — NUKKAD',
    '/forgot': 'Reset your password — NUKKAD',
    '/new': 'New arrivals — NUKKAD',
    '/trending': 'Trending now — NUKKAD',
    '/offers': 'Offers & coupons — NUKKAD'
  };

  function setMeta(title, desc) {
    d.title = title;
    var m = qs('meta[name="description"]');
    if (m && desc) m.setAttribute('content', desc);
  }

  /* ---------- router -------------------------------------------------------- */
  var view = qs('#view'), current = '', ticket = 0;

  function resolve(r) {
    var A = w.NK_ACCOUNT || {}, X = w.NK_VIEWS || {};
    var p = r.parts;

    if (!p.length) return { fn: X.home, title: TITLES['/'] };

    switch (p[0]) {
      case 'c':
        return { fn: function (m, q) { return X.listing({ cat: p[1] || '', sub: p[2] || '', query: q }); } };
      case 'p':
        return { fn: function (m, q) { return X.product(p[1], q); } };
      case 'search':
        return { fn: X.search, title: 'Search — NUKKAD' };
      case 'new':
        return { fn: function (m, q) { return X.listing({ preset: 'new', query: q }); }, title: TITLES['/new'] };
      case 'trending':
        return { fn: function (m, q) { return X.listing({ preset: 'trending', query: q }); }, title: TITLES['/trending'] };
      case 'offers':
        return { fn: X.offers, title: TITLES['/offers'] };
      case 'cart':
        return { fn: X.cart, title: TITLES['/cart'] };
      case 'wishlist':
        return { fn: X.wishlist, title: TITLES['/wishlist'] };
      case 'compare':
        return { fn: X.compare, title: TITLES['/compare'] };
      case 'info':
        return { fn: function (m, q) { return X.info(p[1] || 'about', q); } };
      case 'checkout':
        return { fn: function (m, q) { return A.checkout(p[1] || '', q); }, title: TITLES['/checkout'] };
      case 'track':
        return { fn: function (m, q) { return A.track(p[1] || q.id || '', q); }, title: TITLES['/track'] };
      case 'login':
        return { fn: A.login, title: TITLES['/login'] };
      case 'register':
        return { fn: A.register, title: TITLES['/register'] };
      case 'forgot':
        return { fn: A.forgot, title: TITLES['/forgot'] };
      case 'order':
        return { fn: function (m, q) { return A.orderDetail(p[1] || '', q); } };
      case 'account':
        if (p[1] === 'orders') return { fn: A.orders, title: 'My orders — NUKKAD' };
        if (p[1] === 'addresses') return { fn: A.addresses, title: 'Saved addresses — NUKKAD' };
        if (p[1] === 'settings') return { fn: A.settings, title: 'Account settings — NUKKAD' };
        if (p[1] === 'order') return { fn: function (m, q) { return A.orderDetail(p[2] || '', q); } };
        return { fn: A.profile, title: 'My account — NUKKAD' };
    }
    return { fn: null };
  }

  function render() {
    var r = parseHash();
    if (r.raw === current) return;
    current = r.raw;
    var mine = ++ticket;

    U.closeAllSheets();
    U.loadStart();
    /* the PDP buy bar is body-level chrome, so every route change clears it */
    d.body.classList.remove('has-buybar');

    var hit = resolve(r);
    if (hit.title) setMeta(hit.title, null);

    if (typeof hit.fn !== 'function') {
      view.innerHTML = (w.NK_VIEWS && w.NK_VIEWS.notFound)
        ? w.NK_VIEWS.notFound(r)
        : "<div class='wrap'>" + U.state({
            type: 'warn', artKind: 'warn', title: 'Page not found',
            body: 'That link does not exist on NUKKAD.',
            actions: "<a class='btn' href='#/'>Back to home</a>"
          }) + "</div>";
      finish(r, mine);
      return;
    }

    var out;
    try {
      out = hit.fn(r, r.query);
    } catch (err) {
      if (w.console && console.error) console.error('[NUKKAD] route failed', r.raw, err);
      out = "<div class='wrap'>" + U.state({
        type: 'err', artKind: 'warn', title: 'Something broke on this page',
        body: 'The page could not be built. Reloading usually clears it.',
        actions: "<button class='btn' type='button' onclick='location.reload()'>Reload</button>" +
          "<a class='btn btn--ghost' href='#/'>Back to home</a>"
      }) + "</div>";
    }

    /* a view may return html, or {html, mounted, title, desc} */
    if (out && typeof out === 'object' && !out.nodeType) {
      if (out.title) setMeta(out.title, out.desc);
      view.innerHTML = out.html || '';
      if (typeof out.mounted === 'function') {
        try { out.mounted(view); } catch (e2) { if (w.console) console.error('[NUKKAD] mount failed', e2); }
      }
    } else {
      view.innerHTML = out || '';
    }
    finish(r, mine);
  }

  function finish(r, mine) {
    if (mine !== ticket) return;
    U.hydrate(view);
    U.refreshBadges();
    syncBnav(r);
    U.loadDone();
    if (!r.query.keep) U.scrollTop(r.parts[0] === 'c' || r.parts[0] === 'search');
    view.setAttribute('data-route', r.parts[0] || 'home');
  }

  function syncBnav(r) {
    var key = 'home', p = r.parts;
    if (p[0] === 'c' && p[1] === 'men') key = 'men';
    else if (p[0] === 'c' && p[1] === 'women') key = 'women';
    else if (p[0] === 'wishlist') key = 'wishlist';
    else if (p[0] === 'cart') key = 'cart';
    else if (p.length) key = '';
    qsa('.bnav__i').forEach(function (a) {
      a.classList.toggle('is-on', a.getAttribute('data-bnav') === key);
      if (a.getAttribute('data-bnav') === key) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* ---------- global delegated actions ------------------------------------- */
  function initGlobal() {
    /* log out from anywhere */
    on(d.body, 'click', '[data-logout]', function () {
      U.confirm({
        title: 'Log out of NUKKAD?',
        body: 'Your bag and wishlist stay saved on this device.',
        confirm: 'Log out', danger: true
      }).then(function (yes) {
        if (!yes) return;
        NK.logout();
        U.ok('Logged out', 'See you at the corner.');
        w.location.hash = '#/';
      });
    });

    /* size guide from anywhere */
    on(d.body, 'click', '[data-sizeguide]', function (e, t) {
      U.sizeGuide(t.getAttribute('data-sizeguide') || 'tee');
    });

    /* generic "coming soon" info links used by the footer */
    on(d.body, 'click', '[data-info]', function (e, t) {
      var label = t.getAttribute('data-info');
      if (!label) return;
      e.preventDefault();
      U.info(label, 'This demo focuses on the shopping flow, so that page is a stub.');
    });

    /* newsletter + app promo live in views but the handlers are shared */
    on(d.body, 'click', '[data-scroll-top]', function () { U.scrollTop(false); });

    /* keyboard: "/" focuses search, "Escape" closes overlays */
    d.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) {
        e.preventDefault();
        if (w.NK_SEARCH) w.NK_SEARCH.focus();
      }
    });

    /* keep chrome in sync with state changes from any view */
    NK.on('cart', function () { U.refreshBadges(); });
    NK.on('wish', function () { U.refreshBadges(); });
    NK.on('auth', function () { U.refreshBadges(); });

    /* bag/wishlist bump animation when items land */
    NK.on('cart:add', function () { U.bump('#cartBtn'); U.bump('[data-bnav="cart"]'); });
    NK.on('wish:add', function () { U.bump('[href="#/wishlist"]'); U.bump('[data-bnav="wishlist"]'); });

    /* a stray unhandled error should not leave the user staring at nothing */
    w.addEventListener('error', function (ev) {
      if (!ev || !ev.message) return;
      if (w.console && console.warn) console.warn('[NUKKAD] runtime error', ev.message);
    });
  }

  /* ---------- boot ---------------------------------------------------------- */
  function boot() {
    if (!NK || !U) {
      d.getElementById('view').innerHTML =
        "<div class='wrap' style='padding:80px 0'><h1>NUKKAD could not start</h1>" +
        "<p>A script failed to load. Please refresh the page.</p></div>";
      return;
    }

    initAnnounce();
    initNav();
    initSticky();
    initAcct();
    initSearch();
    initDrawer();
    initFooter();
    initGlobal();

    U.wireCards(d.body);
    U.refreshBadges();

    if (!w.location.hash) w.location.replace('#/');
    w.addEventListener('hashchange', render);
    render();

    /* re-measure the sticky offsets when the viewport class changes */
    var wasCompact = U.isCompact();
    w.addEventListener('resize', U.debounce(function () {
      var now = U.isCompact();
      if (now !== wasCompact) {
        wasCompact = now;
        d.body.classList.toggle('is-compact', now);
      }
    }, 200));
    d.body.classList.toggle('is-compact', wasCompact);
    d.body.classList.add('is-ready');
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* Views need a way to navigate, and to re-run the current route after they
     mutate state (the router short-circuits identical hashes by design). */
  w.NK_APP = {
    go: function (hash, force) {
      hash = hash || w.location.hash || '#/';
      if (force) current = '';
      if (w.location.hash === hash) { if (force) render(); return; }
      w.location.hash = hash;
    },
    refresh: function () { current = ''; render(); },
    route: function () { return parseHash(); }
  };
})(window, document);
