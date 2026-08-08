/* ==========================================================================
   NUKKAD — views: home, listing, search, product, cart, wishlist, misc
   ========================================================================== */
(function (w, d) {
  'use strict';

  var NK = w.NK, U = w.UI, IMG = w.NK_IMG;
  var qs = U.qs, qsa = U.qsa, esc = U.esc, attr = U.attr, on = U.on, icon = U.icon;
  var X = {};

  /* ======================================================================
     HOME
     ====================================================================== */

  /* 3. hero ---------------------------------------------------------------- */
  function hero() {
    var slides = [
      { k: 'The monsoon drop', t: 'Oversized tees<br>built for the walk home', s: 'Heavy 240 GSM cotton, boxy cut, prints that survive the rain.',
        cta: '#/c/men/oversized-t-shirts', label: 'Shop oversized', a: '#0C3B2E', b: '#14523E', accent: '#FFB703', seed: 'hero-1',
        tags: 'streetwear,tshirt,portrait' },
      { k: 'New in women', t: 'Co-ords that do<br>the whole outfit', s: 'Matched sets in eight colourways. One decision, done.',
        cta: '#/c/women/co-ords', label: 'Shop co-ords', a: '#7A2E1B', b: '#D2461F', accent: '#FFD98A', seed: 'hero-2',
        tags: 'womenswear,fashion,outfit' },
      { k: 'Under ' + NK.money(999), t: 'Everyday fits,<br>corner-shop prices', s: 'Over 120 styles under nine ninety-nine. Free shipping over ' + NK.money(NK.FREE_SHIP) + '.',
        cta: '#/offers', label: 'See the offers', a: '#12304A', b: '#1E5C7E', accent: '#FFB703', seed: 'hero-3',
        tags: 'clothing,rack,shop' }
    ];
    return "<section class='hero' aria-roledescription='carousel' aria-label='Featured collections'>" +
      "<div class='hero__slides' id='heroTrack'>" +
      slides.map(function (s, i) {
        return "<article class='hero__slide" + (i === 0 ? ' is-on' : '') + "' role='group' aria-label='Slide " + (i + 1) + " of " + slides.length + "'" + (i ? " aria-hidden='true'" : '') + ">" +
          "<img class='hero__bg' src='" + IMG.banner({ tags: s.tags, w: 1600, h: 760, seed: s.seed }) +
            "' data-fallback='" + IMG.bannerFallback({ a: s.a, b: s.b, accent: s.accent, w: 1600, h: 760, seed: s.seed, text: '' }) +
            "' alt='' width='1600' height='760'>" +
          "<div class='hero__veil' aria-hidden='true'></div>" +
          "<div class='hero__in wrap'>" +
            "<span class='hero__kick'><i aria-hidden='true'></i>" + esc(s.k) + "</span>" +
            "<h1 class='hero__t'>" + s.t + "</h1>" +
            "<p class='hero__s'>" + esc(s.s) + "</p>" +
            "<div class='hero__acts'><a class='btn btn--lg' href='" + s.cta + "'>" + esc(s.label) + icon('arrowR') + "</a>" +
            "<a class='btn btn--lg btn--ghost-l' href='#/new'>New arrivals</a></div>" +
          "</div></article>";
      }).join('') + "</div>" +
      "<button class='hero__arrow hero__arrow--p' type='button' data-hero='-1' aria-label='Previous slide'>" + icon('arrowL') + "</button>" +
      "<button class='hero__arrow hero__arrow--n' type='button' data-hero='1' aria-label='Next slide'>" + icon('arrowR') + "</button>" +
      "<div class='hero__dots' role='tablist' aria-label='Choose slide'>" +
        slides.map(function (s, i) {
          return "<button class='hero__dot" + (i === 0 ? ' is-on' : '') + "' type='button' role='tab' data-dot='" + i + "'" +
            " aria-selected='" + (i === 0) + "' aria-label='" + attr(s.k) + "'></button>";
        }).join('') + "</div></section>";
  }

  function wireHero(root) {
    var track = qs('#heroTrack', root);
    if (!track) return;
    var slides = qsa('.hero__slide', track), dots = qsa('.hero__dot', root), i = 0, timer = null;
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle('is-on', k === i);
        s.setAttribute('aria-hidden', String(k !== i));
      });
      dots.forEach(function (dt, k) {
        dt.classList.toggle('is-on', k === i);
        dt.setAttribute('aria-selected', String(k === i));
      });
    }
    function play() { if (U.reduced()) return; stop(); timer = setInterval(function () { go(i + 1); }, 6000); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    on(root, 'click', '[data-hero]', function (e, t) { go(i + Number(t.getAttribute('data-hero'))); play(); });
    on(root, 'click', '[data-dot]', function (e, t) { go(Number(t.getAttribute('data-dot'))); play(); });
    var hs = qs('.hero', root);
    hs.addEventListener('mouseenter', stop);
    hs.addEventListener('mouseleave', play);
    var sx = 0;
    hs.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; stop(); }, { passive: true });
    hs.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 44) go(i + (dx < 0 ? 1 : -1));
      play();
    }, { passive: true });
    play();
  }

  /* 4. trust strip + promo banners ----------------------------------------- */
  function trust() {
    var items = [
      ['truck', 'Free shipping', 'On every order over ' + NK.money(NK.FREE_SHIP)],
      ['ret', '14-day returns', 'Changed your mind? Send it back'],
      ['lock', 'Safe payments', 'UPI, cards, net banking, COD'],
      ['leaf', 'Small batches', 'Printed in runs of 200 or fewer']
    ];
    return "<section class='trust'><div class='trust__in wrap'>" +
      items.map(function (t) {
        return "<div class='trust__i reveal'>" + icon(t[0]) +
          "<span><strong>" + esc(t[1]) + "</strong><em>" + esc(t[2]) + "</em></span></div>";
      }).join('') + "</div></section>";
  }

  function promos() {
    var cards = [
      { t: 'Buy 2, save 15%', s: 'On all oversized tees, no code needed', href: '#/c/men/oversized-t-shirts',
        a: '#0C3B2E', b: '#14523E', accent: '#FFB703', seed: 'pr-1', wide: true,
        tags: 'tshirt,streetwear,model' },
      { t: 'Hoodie season', s: 'Fleece-lined, from ' + NK.money(1299), href: '#/c/men/hoodies',
        a: '#2B1B4A', b: '#4C2F7A', accent: '#FFD98A', seed: 'pr-2',
        tags: 'hoodie,streetwear,portrait' },
      { t: 'Caps & bags', s: 'Finish the fit from ' + NK.money(399), href: '#/c/accessories',
        a: '#7A2E1B', b: '#D2461F', accent: '#FFE9A8', seed: 'pr-3',
        tags: 'cap,backpack,accessory' }
    ];
    return "<section class='promos'><div class='promos__in wrap'>" +
      cards.map(function (c) {
        var w = c.wide ? 1000 : 640;
        return "<a class='promo" + (c.wide ? ' promo--wide' : '') + " reveal' href='" + c.href + "'>" +
          "<img class='promo__bg lazyimg' data-src='" + IMG.banner({ tags: c.tags, w: w, h: 560, seed: c.seed }) +
          "' data-fallback='" + IMG.bannerFallback({ a: c.a, b: c.b, accent: c.accent, w: w, h: 560, seed: c.seed, text: '' }) +
          "' alt='' width='" + w + "' height='560'>" +
          "<span class='promo__in'><strong class='promo__t'>" + esc(c.t) + "</strong>" +
          "<em class='promo__s'>" + esc(c.s) + "</em>" +
          "<span class='promo__cta'>Shop now" + icon('arrowR') + "</span></span></a>";
      }).join('') + "</div></section>";
  }

  /* 5 + 6. shop by category / trending categories -------------------------- */
  function catTiles() {
    var tiles = [];
    NK.TAXONOMY.forEach(function (c) {
      c.groups[0].subs.slice(0, 4).forEach(function (slug) {
        var s = NK.subBySlug(c.slug, slug);
        if (!s) return;
        var p = NK.query({ cat: c.slug, subs: [slug], sort: 'popular' }).items[0];
        tiles.push({ cat: c.slug, slug: slug, name: s.name, kind: s.kind, catName: c.name, p: p });
      });
    });
    tiles = tiles.slice(0, 12);
    return U.section({
      id: 'shop-by-category', mod: 'wash',
      eyebrow: 'Start here', title: 'Shop by category',
      sub: 'Twelve doors into the catalogue. Everything is in stock unless we say otherwise.',
      html: "<div class='cattiles'>" + tiles.map(function (t) {
        var hex = t.p ? t.p.colors[0].hex : '#0C3B2E';
        var drawn = IMG.tile(t.kind, hex, '');
        var shot = t.p ? IMG.photo(t.p, 'front', 400, 400) : IMG.tilePhoto(t.kind, 400, 400, t.slug);
        return "<a class='cattile reveal' href='#/c/" + t.cat + '/' + t.slug + "'>" +
          "<span class='cattile__art'><img class='lazyimg' data-src='" + (shot || drawn) +
          "' data-fallback='" + drawn +
          "' alt='" + attr(t.name + ' in ' + t.catName) + "' width='400' height='400'></span>" +
          "<span class='cattile__n'>" + esc(t.name) + "</span>" +
          "<span class='cattile__c'>" + esc(t.catName) + "</span></a>";
      }).join('') + "</div>"
    });
  }

  function trendingCats() {
    var picks = [
      { cat: 'men', slug: 'oversized-t-shirts', tag: 'Most bought' },
      { cat: 'women', slug: 'co-ords', tag: 'Selling fast' },
      { cat: 'men', slug: 'jeans', tag: 'Restocked' },
      { cat: 'women', slug: 'dresses', tag: 'New shapes' },
      { cat: 'accessories', slug: 'bags', tag: 'Everyday carry' },
      { cat: 'men', slug: 'hoodies', tag: 'Season pick' }
    ];
    return U.section({
      id: 'trending-categories',
      eyebrow: 'Moving quickly', title: 'Trending categories',
      sub: 'Ranked on what actually left the shelf this week.',
      html: "<div class='ctrend'>" + picks.map(function (k, i) {
        var s = NK.subBySlug(k.cat, k.slug);
        if (!s) return '';
        var r = NK.query({ cat: k.cat, subs: [k.slug], sort: 'popular' });
        var p = r.items[0];
        var drawn = p ? IMG.img(p, p.colors[0].hex, 'flat') : IMG.tile(s.kind, '#0C3B2E', '');
        var shot = p ? IMG.photo(p, 'front', 300, 400) : IMG.tilePhoto(s.kind, 300, 400, k.slug);
        return "<a class='ctrend__i reveal' href='#/c/" + k.cat + '/' + k.slug + "'>" +
          "<span class='ctrend__n'>" + (i + 1 < 10 ? '0' : '') + (i + 1) + "</span>" +
          "<span class='ctrend__art'><img class='lazyimg' data-src='" + (shot || drawn) +
          "' data-fallback='" + drawn +
          "' alt='' width='300' height='400'></span>" +
          "<span class='ctrend__b'><strong>" + esc(s.name) + "</strong>" +
          "<em>" + r.total + " styles · from " + NK.money(Math.min.apply(null, r.items.map(function (x) { return x.price; }))) + "</em>" +
          "<span class='ctrend__tag'>" + esc(k.tag) + "</span></span>" + icon('arrowR') + "</a>";
      }).join('') + "</div>"
    });
  }

  /* 10. deals with a live countdown ---------------------------------------- */
  function deals() {
    var list = NK.deals(8);
    var ends = new Date();
    ends.setHours(23, 59, 59, 999);
    return "<section class='sec sec--deal' id='deals'><div class='wrap'>" +
      "<div class='deal__head'>" +
        "<div><span class='sec__eyebrow'>Ends tonight</span>" +
        "<h2 class='sec__t'>Deals of the day</h2>" +
        "<p class='sec__s'>Eight styles at their lowest price this season. Back to full price at midnight.</p></div>" +
        "<div class='clock' data-ends='" + ends.getTime() + "' role='timer' aria-label='Time left in today&rsquo;s deals'>" +
          "<span class='clock__u'><b data-cu='h'>00</b><em>hrs</em></span>" +
          "<span class='clock__u'><b data-cu='m'>00</b><em>min</em></span>" +
          "<span class='clock__u'><b data-cu='s'>00</b><em>sec</em></span>" +
        "</div>" +
      "</div>" + U.grid(list, { cols: 4 }) +
      "<div class='sec__more'><a class='btn btn--ghost' href='#/offers'>All offers and coupons" + icon('arrowR') + "</a></div>" +
      "</div></section>";
  }

  function wireClock(root) {
    var el = qs('.clock', root);
    if (!el) return;
    var ends = Number(el.getAttribute('data-ends'));
    function tick() {
      if (!d.body.contains(el)) { clearInterval(t); return; }
      var left = Math.max(0, ends - Date.now());
      var h = Math.floor(left / 3600000), m = Math.floor(left / 60000) % 60, s = Math.floor(left / 1000) % 60;
      var set = function (k, v) { var n = qs('[data-cu="' + k + '"]', el); if (n) n.textContent = v < 10 ? '0' + v : String(v); };
      set('h', h); set('m', m); set('s', s);
    }
    tick();
    var t = setInterval(tick, 1000);
  }

  /* 11. featured collections ------------------------------------------------ */
  function collections() {
    var colls = [
      { t: 'Night Shift', s: 'Blacks, charcoals and one loud yellow', q: { colors: ['Black', 'Grey'], sort: 'popular' },
        a: '#101512', b: '#2A302B', accent: '#FFB703', seed: 'co-1', tags: 'blackoutfit,streetwear,night' },
      { t: 'Sun & Salt', s: 'Bleached brights for the coast', q: { colors: ['Yellow', 'Blue', 'White'], sort: 'newest' },
        a: '#1E5C7E', b: '#4FA3C4', accent: '#FFE9A8', seed: 'co-2', tags: 'summer,beach,outfit' },
      { t: 'Baggy Everything', s: 'Relaxed fits, top to bottom', q: { sizes: ['XL', 'XXL'], sort: 'rating' },
        a: '#4A3418', b: '#8A6230', accent: '#FFD98A', seed: 'co-3', tags: 'oversized,streetwear,fashion' },
      { t: 'Under a Thousand', s: 'Full outfits, small damage', q: { price: [0, 999], sort: 'discount' },
        a: '#5C1F3A', b: '#9E3663', accent: '#FFB703', seed: 'co-4', tags: 'clothing,rack,shop' }
    ];
    return U.section({
      id: 'collections', mod: 'wash',
      eyebrow: 'Curated', title: 'Featured collections',
      sub: 'Four ways we would put an outfit together. Each one opens a filtered rail you can keep editing.',
      html: "<div class='colls'>" + colls.map(function (c) {
        var r = NK.query(c.q);
        var href = '#/search?' + collQuery(c.q);
        return "<a class='coll reveal' href='" + href + "'>" +
          "<img class='coll__bg lazyimg' data-src='" + IMG.banner({ tags: c.tags, w: 760, h: 620, seed: c.seed }) +
          "' data-fallback='" + IMG.bannerFallback({ a: c.a, b: c.b, accent: c.accent, w: 760, h: 620, seed: c.seed, text: '' }) +
          "' alt='' width='760' height='620'>" +
          "<span class='coll__in'><strong class='coll__t'>" + esc(c.t) + "</strong>" +
          "<em class='coll__s'>" + esc(c.s) + "</em>" +
          "<span class='coll__n'>" + r.total + " pieces" + icon('arrowR') + "</span></span></a>";
      }).join('') + "</div>"
    });
  }

  function collQuery(q) {
    var parts = [];
    Object.keys(q).forEach(function (k) {
      var v = q[k];
      if (Array.isArray(v)) parts.push(k + '=' + encodeURIComponent(v.join(',')));
      else parts.push(k + '=' + encodeURIComponent(String(v)));
    });
    return parts.join('&');
  }

  /* 13. brand story --------------------------------------------------------- */
  function story() {
    return "<section class='story' id='story'><div class='story__in wrap'>" +
      "<div class='story__art' aria-hidden='true'>" +
        "<img class='lazyimg' data-src='" + IMG.banner({ tags: 'tailor,sewing,workshop', w: 720, h: 820, seed: 'story' }) +
        "' data-fallback='" + IMG.bannerFallback({ a: '#0C3B2E', b: '#14523E', accent: '#FFB703', w: 720, h: 820, seed: 'story', text: 'NUKKAD' }) +
        "' alt='' width='720' height='820'>" +
      "</div>" +
      "<div class='story__c'>" +
        "<span class='sec__eyebrow'>Who we are</span>" +
        "<h2 class='story__t'>Named after the corner<br>everyone grew up on</h2>" +
        "<p>A nukkad is the turn at the end of your lane — the tea stall, the barber, the three friends who are always there at 9pm. We started printing tees for that crowd in 2019 out of a two-room unit in Ludhiana, and never really moved on from it.</p>" +
        "<p>Everything is cut and sewn within 40km of that unit. Prints go out in runs of 200 or fewer, which is why things sell out and why we restock the ones you keep asking for. Heavier cotton than you expect at the price, because a tee that survives twenty washes is cheaper than three that don't.</p>" +
        "<div class='story__stats'>" +
          [['2019', 'Started printing'], ['340+', 'Live styles'], ['19,000+', 'PIN codes served'], ['4.3', 'Average rating']].map(function (s) {
            return "<span class='story__stat'><b>" + esc(s[0]) + "</b><em>" + esc(s[1]) + "</em></span>";
          }).join('') +
        "</div>" +
        "<a class='btn btn--ghost' href='#/info/about'>Read the long version" + icon('arrowR') + "</a>" +
      "</div></div></section>";
  }

  /* 14. app promo ----------------------------------------------------------- */
  function appPromo() {
    return "<section class='app' id='app'><div class='app__in wrap'>" +
      "<div class='app__c'>" +
        "<span class='sec__eyebrow sec__eyebrow--l'>NUKKAD on your phone</span>" +
        "<h2 class='app__t'>Drops land in the app<br>two hours early</h2>" +
        "<p class='app__s'>Set an alert on a size and we will ping you the moment it comes back. App-only prices on Thursdays, and your bag syncs with the site.</p>" +
        "<ul class='app__list'>" +
          ['Restock alerts by size and colour', 'Track orders without typing an ID', 'Saved cards for one-tap checkout'].map(function (l) {
            return "<li>" + icon('check') + esc(l) + "</li>";
          }).join('') +
        "</ul>" +
        "<div class='app__acts'>" +
          "<button class='app__store' type='button' data-store='ios'>" +
            "<span class='app__store-k'>Download on</span><span class='app__store-n'>iOS</span></button>" +
          "<button class='app__store' type='button' data-store='android'>" +
            "<span class='app__store-k'>Get it on</span><span class='app__store-n'>Android</span></button>" +
        "</div>" +
        "<form class='app__sms' id='appSms' novalidate>" +
          "<label class='app__sms-l' for='appPhone'>Or text yourself the link</label>" +
          "<div class='app__sms-r'>" +
            "<input class='inp' id='appPhone' type='tel' inputmode='numeric' placeholder='10-digit mobile number' autocomplete='tel' aria-describedby='appPhoneErr'>" +
            "<button class='btn btn--acc' type='submit'>Send link</button>" +
          "</div>" +
          "<p class='field__err' id='appPhoneErr' role='alert'></p>" +
        "</form>" +
      "</div>" +
      "<div class='app__art'>" +
        "<div class='app__phone' aria-hidden='true'>" +
          "<div class='app__screen'>" + U.grid(NK.trending(4), { cols: 4 }).replace(/class='pgrid[^']*'/, "class='pgrid pgrid--2 pgrid--mini'") + "</div>" +
        "</div>" +
        "<div class='app__qr'><img class='lazyimg' data-src='" + IMG.qr('nukkad-app-download') + "' alt='QR code to download the NUKKAD app' width='200' height='200'>" +
        "<span>Scan to install</span></div>" +
      "</div></div></section>";
  }

  /* 15. newsletter ---------------------------------------------------------- */
  function newsletter() {
    return "<section class='news' id='news'><div class='news__in wrap'>" +
      "<div class='news__c'>" +
        "<h2 class='news__t'>Get " + NK.money(200) + " off your first order</h2>" +
        "<p class='news__s'>One email a week: what dropped, what came back, what is nearly gone. Unsubscribe in one click.</p>" +
      "</div>" +
      "<form class='news__f' id='newsForm' novalidate>" +
        "<div class='news__row'>" +
          "<label class='sr-only' for='newsEmail'>Email address</label>" +
          "<input class='inp inp--lg' id='newsEmail' type='email' placeholder='you@email.com' autocomplete='email' aria-describedby='newsErr'>" +
          "<button class='btn btn--lg btn--acc' type='submit'>Send my code</button>" +
        "</div>" +
        "<p class='field__err' id='newsErr' role='alert'></p>" +
        "<p class='news__fine'>By subscribing you agree to our <a href='#/info/privacy'>privacy policy</a>. Demo site — nothing is actually mailed.</p>" +
      "</form></div></section>";
  }

  function wireHomeForms(root) {
    var nf = qs('#newsForm', root);
    if (nf) nf.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = qs('#newsEmail', nf), errEl = qs('#newsErr', nf);
      var msg = NK.V.email(inp.value);
      errEl.textContent = msg;
      inp.classList.toggle('is-bad', !!msg);
      if (msg) { inp.focus(); return; }
      var btn = qs('button[type=submit]', nf);
      U.busy(btn, true, 'Sending');
      U.pretend(700).then(function () {
        U.busy(btn, false);
        nf.reset();
        U.ok('Check your inbox', 'Use code FIRSTFIT at checkout for 25% off — it is already live on your bag.');
      });
    });

    var af = qs('#appSms', root);
    if (af) af.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = qs('#appPhone', af), errEl = qs('#appPhoneErr', af);
      var msg = NK.V.phone(inp.value);
      errEl.textContent = msg;
      inp.classList.toggle('is-bad', !!msg);
      if (msg) { inp.focus(); return; }
      var btn = qs('button[type=submit]', af);
      U.busy(btn, true, 'Sending');
      U.pretend(650).then(function () {
        U.busy(btn, false);
        af.reset();
        U.ok('Link sent', 'We texted the install link to that number.');
      });
    });

    on(root, 'click', '[data-store]', function (e, t) {
      U.info('The NUKKAD app is not published yet',
        t.getAttribute('data-store') === 'ios'
          ? 'This is a demo storefront, so the App Store listing is not live.'
          : 'This is a demo storefront, so the Play Store listing is not live.');
    });
  }

  /* ---- home assembly ------------------------------------------------------ */
  X.home = function () {
    var html =
      hero() +
      trust() +
      promos() +
      catTiles() +
      trendingCats() +
      U.section({
        id: 'new-arrivals', eyebrow: 'Just landed', title: 'New arrivals',
        sub: 'The last 20 styles to come off the press.',
        more: { href: '#/new', label: 'See all new' },
        html: U.rail(NK.newArrivals(12), { label: 'New arrivals' })
      }) +
      U.section({
        id: 'best-sellers', mod: 'wash', eyebrow: 'Proven', title: 'Best sellers',
        sub: 'The ones we keep having to reprint.',
        more: { href: '#/c/men?sort=popular', label: 'Shop best sellers' },
        html: U.grid(NK.bestSellers(8), { cols: 4 })
      }) +
      U.section({
        id: 'trending', eyebrow: 'This week', title: 'Trending now',
        sub: 'Ranked on views, saves and what made it to checkout.',
        more: { href: '#/trending', label: 'See the full list' },
        html: U.rail(NK.trending(12), { label: 'Trending products' })
      }) +
      deals() +
      collections() +
      U.section({
        id: 'recommended', eyebrow: 'Picked for you', title: 'Recommended',
        sub: NK.recentlyViewed().length
          ? 'Based on what you have been looking at.'
          : 'A spread across categories to start you off — this sharpens as you browse.',
        html: U.grid(NK.recommended(8), { cols: 4 })
      }) +
      story() +
      appPromo() +
      newsletter();

    var rv = NK.recentlyViewed(8);
    if (rv.length > 1) {
      html += U.section({
        id: 'recently-viewed', mod: 'wash', eyebrow: 'Pick up where you left off',
        title: 'Recently viewed',
        html: U.rail(rv, { label: 'Recently viewed products' })
      });
    }

    return {
      html: html,
      title: 'NUKKAD — Streetwear, Oversized Tees & Everyday Fits',
      desc: 'Original streetwear from the corner: oversized tees, hoodies, co-ords, jeans and everyday accessories. Free shipping over ' + NK.money(NK.FREE_SHIP) + ' and 14-day returns.',
      mounted: function (root) {
        wireHero(root);
        wireClock(root);
        wireHomeForms(root);
      }
    };
  };

  /* ======================================================================
     LISTING
     ====================================================================== */
  var PAGE = 12;
  var L = null; /* live listing state */

  function filtersFromQuery(q, seed) {
    var f = NK.blankFilters();
    if (seed) Object.keys(seed).forEach(function (k) { f[k] = seed[k]; });
    if (!q) return f;
    if (q.cat) f.cat = q.cat;
    if (q.sub) f.subs = q.sub.split(',');
    if (q.subs) f.subs = q.subs.split(',');
    if (q.sizes) f.sizes = q.sizes.split(',');
    if (q.colors) f.colors = q.colors.split(',');
    if (q.brands) f.brands = q.brands.split(',');
    if (q.rating) f.rating = Number(q.rating) || 0;
    if (q.discount) f.discount = Number(q.discount) || 0;
    if (q.instock === '1' || q.inStock === '1') f.inStock = true;
    if (q.isnew === '1' || q.isNew === '1') f.isNew = true;
    if (q.q) f.q = q.q;
    if (q.sort) f.sort = q.sort;
    if (q.under) f.price = [NK.PRICE_MIN, Number(q.under) || NK.PRICE_MAX];
    if (q.price) {
      var pr = q.price.split(',').map(Number);
      if (pr.length === 2 && !isNaN(pr[0]) && !isNaN(pr[1])) f.price = pr;
    }
    return f;
  }

  function fgrp(title, key, body, openByDefault) {
    var open = openByDefault !== false;
    return "<div class='fgrp" + (open ? ' is-open' : '') + "' data-fgrp='" + key + "'>" +
      "<button class='fgrp__h' type='button' aria-expanded='" + open + "'>" + esc(title) +
      "<svg class='fgrp__i' viewBox='0 0 24 24' aria-hidden='true'><path d='M6 10l6 6 6-6'/></svg></button>" +
      /* data-open is what U.wireAccordions toggles, so the CSS keys off it too */
      "<div class='fgrp__b' data-open='" + (open ? '1' : '0') + "'>" + body + "</div></div>";
  }

  function fopt(kind, name, val, label, count, checked, extra) {
    var id = 'f-' + name + '-' + String(val).replace(/[^a-z0-9]/gi, '') + '-' + (fopt.n = (fopt.n || 0) + 1);
    var dis = count === 0 && !checked;
    return "<label class='fopt" + (dis ? ' is-off' : '') + "' for='" + id + "'>" +
      "<input id='" + id + "' type='" + (kind === 'radio' ? 'radio' : 'checkbox') + "' name='" + name + "'" +
      " value='" + attr(String(val)) + "'" + (checked ? ' checked' : '') + (dis ? ' disabled' : '') + ">" +
      "<span class='fopt__box' aria-hidden='true'>" + icon('check') + "</span>" +
      (extra || '') +
      "<span class='fopt__l'>" + label + "</span>" +
      (count === undefined ? '' : "<span class='fopt__n'>" + count + "</span>") + "</label>";
  }

  function sidebarHtml(res) {
    var f = res.filters, fx = res.facets, out = '';

    /* category */
    out += fgrp('Category', 'cat',
      "<div class='fopts'>" +
        fopt('radio', 'fcat', '', "All categories", res.baseTotal, !f.cat) +
        NK.TAXONOMY.map(function (c) {
          return fopt('radio', 'fcat', c.slug, esc(c.name), undefined, f.cat === c.slug);
        }).join('') +
      "</div>");

    /* subcategory */
    var subs = [];
    if (f.cat) {
      var c = NK.catBySlug(f.cat);
      if (c) c.groups.forEach(function (g) { g.subs.forEach(function (s) { subs.push(NK.subBySlug(f.cat, s)); }); });
    } else {
      NK.TAXONOMY.forEach(function (cc) {
        cc.groups.forEach(function (g) { g.subs.forEach(function (s) { subs.push(NK.subBySlug(cc.slug, s)); }); });
      });
    }
    subs = subs.filter(Boolean);
    if (subs.length) {
      out += fgrp('Type', 'subs',
        "<div class='fopts fopts--scroll'>" + subs.map(function (s) {
          return fopt('check', 'fsub', s.slug, esc(s.name), fx.subs[s.slug] || 0, f.subs.indexOf(s.slug) >= 0);
        }).join('') + "</div>");
    }

    /* price */
    out += fgrp('Price', 'price',
      "<div class='prange'>" +
        "<div class='prange__vals'><span id='prLo'>" + NK.money(f.price[0]) + "</span>" +
        "<span id='prHi'>" + NK.money(f.price[1]) + (f.price[1] >= NK.PRICE_MAX ? '+' : '') + "</span></div>" +
        "<div class='prange__track'>" +
          "<span class='prange__rail' aria-hidden='true'></span>" +
          "<span class='prange__fill' aria-hidden='true'></span>" +
          "<label class='sr-only' for='prMin'>Minimum price</label>" +
          "<input id='prMin' class='prange__r' type='range' min='" + NK.PRICE_MIN + "' max='" + NK.PRICE_MAX +
            "' step='100' value='" + f.price[0] + "' aria-valuetext='" + attr(NK.money(f.price[0])) + "'>" +
          "<label class='sr-only' for='prMax'>Maximum price</label>" +
          "<input id='prMax' class='prange__r' type='range' min='" + NK.PRICE_MIN + "' max='" + NK.PRICE_MAX +
            "' step='100' value='" + f.price[1] + "' aria-valuetext='" + attr(NK.money(f.price[1])) + "'>" +
        "</div>" +
        "<div class='prange__quick'>" +
          [[0, 599], [600, 999], [1000, 1499], [1500, NK.PRICE_MAX]].map(function (b) {
            var lo = b[0], hi = b[1], act = f.price[0] === lo && f.price[1] === hi;
            return "<button class='chip" + (act ? ' is-on' : '') + "' type='button' data-price='" + lo + ',' + hi + "'>" +
              (hi >= NK.PRICE_MAX ? NK.money(lo) + '+' : NK.money(lo) + ' – ' + NK.money(hi)) + "</button>";
          }).join('') +
        "</div></div>");

    /* size */
    var sizeKeys = Object.keys(fx.sizes).sort(function (a, b) {
      var order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'S/M', 'L/XL', 'Free Size'];
      var ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return Number(a) - Number(b);
    });
    if (sizeKeys.length) {
      out += fgrp('Size', 'sizes',
        "<div class='fsizes'>" + sizeKeys.map(function (s) {
          var act = f.sizes.indexOf(s) >= 0;
          return "<button class='fsize" + (act ? ' is-on' : '') + "' type='button' data-size='" + attr(s) + "'" +
            " aria-pressed='" + act + "'>" + esc(s) + "<em>" + fx.sizes[s] + "</em></button>";
        }).join('') + "</div>");
    }

    /* colour */
    var famHex = { Black: '#111111', White: '#F4F4F0', Grey: '#8A8F8C', Blue: '#1E5C7E', Green: '#14523E',
      Red: '#C0341C', Pink: '#D9739A', Purple: '#5C3A8C', Yellow: '#E8A200', Beige: '#D8C7A6', Brown: '#6B4A2E' };
    var fams = NK.COLOR_FAMS.filter(function (x) { return fx.colors[x] || f.colors.indexOf(x) >= 0; });
    if (fams.length) {
      out += fgrp('Colour', 'colors',
        "<div class='fopts fopts--col'>" + fams.map(function (x) {
          return fopt('check', 'fcolor', x, esc(x), fx.colors[x] || 0, f.colors.indexOf(x) >= 0,
            "<span class='fsw' style='background:" + (famHex[x] || '#ccc') + "' aria-hidden='true'></span>");
        }).join('') + "</div>");
    }

    /* rating */
    out += fgrp('Customer rating', 'rating',
      "<div class='fopts'>" + [4, 3.5, 3].map(function (r) {
        return fopt('radio', 'frating', r, U.stars(r) + " <span>" + r + " &amp; up</span>", fx.rating[r] || 0, f.rating === r);
      }).join('') +
      (f.rating ? "<button class='fclear' type='button' data-clear='rating'>Clear rating</button>" : '') +
      "</div>", false);

    /* discount */
    out += fgrp('Discount', 'discount',
      "<div class='fopts'>" + [60, 50, 40, 30, 20].map(function (dd) {
        return fopt('radio', 'fdiscount', dd, dd + '% and above', fx.discount[dd] || 0, f.discount === dd);
      }).join('') +
      (f.discount ? "<button class='fclear' type='button' data-clear='discount'>Clear discount</button>" : '') +
      "</div>", false);

    /* brand */
    var brands = Object.keys(fx.brands).sort();
    if (brands.length > 1) {
      out += fgrp('Collection', 'brands',
        "<div class='fopts fopts--scroll'>" + brands.map(function (b) {
          return fopt('check', 'fbrand', b, esc(b), fx.brands[b] || 0, f.brands.indexOf(b) >= 0);
        }).join('') + "</div>", false);
    }

    /* availability + new */
    out += fgrp('More', 'more',
      "<div class='fopts'>" +
        fopt('check', 'fstock', '1', 'In stock only', fx.inStock, f.inStock) +
        fopt('check', 'fnew', '1', 'New arrivals only', fx.isNew, f.isNew) +
      "</div>");

    return out;
  }

  function crumbs(trail) {
    return "<nav class='crumb' aria-label='Breadcrumb'><ol>" +
      trail.map(function (t, i) {
        var last = i === trail.length - 1;
        return "<li>" + (last || !t.href
          ? "<span aria-current='page'>" + esc(t.label) + "</span>"
          : "<a href='" + t.href + "'>" + esc(t.label) + "</a>") + "</li>";
      }).join('') + "</ol></nav>";
  }

  function toolbar(res) {
    return "<div class='tbar'>" +
      "<p class='tbar__n' id='tbarCount' role='status'><strong>" + res.total + "</strong> " +
        NK.plural(res.total, 'style', 'styles') + "</p>" +
      "<div class='tbar__r'>" +
        "<button class='btn btn--ghost btn--sm tbar__filter' type='button' data-open-filters>" +
          icon('filter') + "Filters<span class='tbar__badge' id='tbarBadge' hidden></span></button>" +
        "<button class='btn btn--ghost btn--sm tbar__sortbtn' type='button' data-open-sort>" +
          icon('sort') + "<span id='tbarSortLabel'>Sort</span></button>" +
        "<label class='tbar__sort'><span class='sr-only'>Sort products by</span>" +
          "<select class='inp inp--sm' id='sortSel'>" +
            NK.SORTS.map(function (s) {
              return "<option value='" + s.key + "'" + (res.filters.sort === s.key ? ' selected' : '') + ">" + esc(s.label) + "</option>";
            }).join('') +
          "</select></label>" +
      "</div></div>";
  }

  function chipsHtml(res) {
    var chips = NK.activeChips(res.filters);
    if (!chips.length) return '';
    return "<div class='actives' id='actives'>" +
      chips.map(function (c) {
        return "<button class='atag' type='button' data-drop='" + attr(c.dim) + "'" +
          (c.val === null || c.val === true ? '' : " data-val='" + attr(String(c.val)) + "'") +
          " aria-label='Remove filter " + attr(c.label) + "'>" +
          esc(c.label) + icon('x') + "</button>";
      }).join('') +
      "<button class='atag atag--clear' type='button' data-clear-all>Clear all</button></div>";
  }

  function pageSlice(res, page) {
    return res.items.slice(0, page * PAGE);
  }

  function resultsHtml(res, page) {
    if (!res.total) {
      return U.state({
        type: 'empty', artKind: 'search',
        title: 'No styles match those filters',
        body: 'Try widening the price range or clearing a size — the counts next to each filter show what is still available.',
        actions: "<button class='btn' type='button' data-clear-all>Clear all filters</button>" +
          "<a class='btn btn--ghost' href='#/trending'>See what is trending</a>"
      });
    }
    var shown = pageSlice(res, page);
    var more = res.total - shown.length;
    return U.grid(shown, { cols: 4 }) +
      (more > 0
        ? "<div class='loadmore'><button class='btn btn--ghost btn--lg' type='button' id='loadMore'>" +
            "Load " + Math.min(PAGE, more) + " more" + icon('chev') + "</button>" +
            "<p class='loadmore__n'>Showing " + shown.length + " of " + res.total + "</p></div>"
        : "<p class='loadmore__n loadmore__n--end'>That is all " + res.total + " " +
            NK.plural(res.total, 'style', 'styles') + " in this view.</p>");
  }

  function listingShell(o) {
    var res = o.res;
    return "<div class='wrap'>" + crumbs(o.trail) + "</div>" +
      "<header class='phead'><div class='wrap'>" +
        "<h1 class='phead__t'>" + esc(o.title) + "</h1>" +
        (o.sub ? "<p class='phead__s'>" + esc(o.sub) + "</p>" : '') +
        (o.quick ? "<div class='phead__quick'>" + o.quick + "</div>" : '') +
      "</div></header>" +
      "<div class='listing wrap'>" +
        "<aside class='fsidebar' id='fsidebar' aria-label='Filters'>" +
          "<div class='fsidebar__h'><h2>Filters</h2>" +
            "<button class='fsidebar__clear' type='button' data-clear-all>Clear all</button></div>" +
          "<div class='fsidebar__b' id='fbody'>" + sidebarHtml(res) + "</div>" +
        "</aside>" +
        "<div class='listing__main'>" +
          toolbar(res) +
          "<div id='activesWrap'>" + chipsHtml(res) + "</div>" +
          "<div id='results'>" + resultsHtml(res, 1) + "</div>" +
        "</div>" +
      "</div>";
  }

  function subQuickLinks(cat, activeSub) {
    var c = NK.catBySlug(cat);
    if (!c) return '';
    var subs = [];
    c.groups.forEach(function (g) { g.subs.forEach(function (s) { subs.push(NK.subBySlug(cat, s)); }); });
    return subs.filter(Boolean).map(function (s) {
      return "<a class='chip" + (s.slug === activeSub ? ' is-on' : '') + "' href='#/c/" + cat + '/' + s.slug + "'>" +
        esc(s.name) + "</a>";
    }).join('');
  }

  /* ---- listing wiring ----------------------------------------------------- */
  /* paint the filled segment between the two price thumbs, and keep the
     screen-reader value text in step with the rupee labels */
  function paintRange(box) {
    if (!box) return null;
    var ins = qsa('.prange__r', box);
    if (ins.length < 2) return null;
    var lo = Math.min(Number(ins[0].value), Number(ins[1].value));
    var hi = Math.max(Number(ins[0].value), Number(ins[1].value));
    var span = NK.PRICE_MAX - NK.PRICE_MIN || 1;
    var fill = qs('.prange__fill', box);
    if (fill) {
      fill.style.left = ((lo - NK.PRICE_MIN) / span * 100) + '%';
      fill.style.width = ((hi - lo) / span * 100) + '%';
    }
    ins[0].setAttribute('aria-valuetext', NK.money(lo));
    ins[1].setAttribute('aria-valuetext', NK.money(hi));
    return [lo, hi];
  }

  function repaint(opts) {
    if (!L) return;
    var root = L.root;
    L.res = NK.query(L.f);
    if (!opts || !opts.keepPage) L.page = 1;

    var results = qs('#results', root);
    if (results) {
      results.innerHTML = resultsHtml(L.res, L.page);
      U.hydrate(results);
    }
    var aw = qs('#activesWrap', root);
    if (aw) aw.innerHTML = chipsHtml(L.res);
    var cnt = qs('#tbarCount', root);
    if (cnt) cnt.innerHTML = "<strong>" + L.res.total + "</strong> " + NK.plural(L.res.total, 'style', 'styles');

    if (!opts || !opts.keepSidebar) {
      var fb = qs('#fbody', root);
      if (fb) {
        fb.innerHTML = sidebarHtml(L.res);
        U.wireAccordions(fb, '.fgrp__h', null);
        qsa('.prange', fb).forEach(paintRange);
      }
      var sb = qs('#fsheetBody');
      if (sb) {
        sb.innerHTML = sidebarHtml(L.res);
        U.wireAccordions(sb, '.fgrp__h', null);
        qsa('.prange', sb).forEach(paintRange);
        var sc = qs('#fsheetCount');
        if (sc) sc.textContent = L.res.total + ' ' + NK.plural(L.res.total, 'style', 'styles');
      }
    }

    var n = NK.activeChips(L.f).length;
    var badge = qs('#tbarBadge', root);
    if (badge) { badge.textContent = n; badge.hidden = !n; }
    var sortLab = qs('#tbarSortLabel', root);
    if (sortLab) {
      var s = NK.SORTS.filter(function (x) { return x.key === L.f.sort; })[0];
      sortLab.textContent = s ? s.label.replace('Price: ', '') : 'Sort';
    }
    var sel = qs('#sortSel', root);
    if (sel && sel.value !== L.f.sort) sel.value = L.f.sort;

    syncUrl();
  }

  function syncUrl() {
    if (!L || !L.syncable) return;
    var f = L.f, q = [];
    if (f.subs.length && !L.lockSub) q.push('subs=' + encodeURIComponent(f.subs.join(',')));
    if (f.sizes.length) q.push('sizes=' + encodeURIComponent(f.sizes.join(',')));
    if (f.colors.length) q.push('colors=' + encodeURIComponent(f.colors.join(',')));
    if (f.brands.length) q.push('brands=' + encodeURIComponent(f.brands.join(',')));
    if (f.rating) q.push('rating=' + f.rating);
    if (f.discount) q.push('discount=' + f.discount);
    if (f.inStock) q.push('instock=1');
    if (f.isNew) q.push('isnew=1');
    if (f.price && (f.price[0] > NK.PRICE_MIN || f.price[1] < NK.PRICE_MAX)) q.push('price=' + f.price.join(','));
    if (f.sort && f.sort !== 'recommended') q.push('sort=' + f.sort);
    if (L.baseQuery) q = L.baseQuery.concat(q);
    var next = L.basePath + (q.length ? '?' + q.join('&') : '');
    if (w.location.hash !== next) {
      L.selfNav = true;
      history.replaceState(null, '', next);
    }
  }

  function toggleIn(arr, val) {
    var i = arr.indexOf(val);
    if (i >= 0) arr.splice(i, 1); else arr.push(val);
    return arr;
  }

  function wireFilters(root) {
    U.wireAccordions(qs('#fbody', root), '.fgrp__h', null);
    if (wireFilters.done) return;
    wireFilters.done = true;

    /* every handler below is delegated on body once, so the sidebar and the
       mobile sheet share one implementation and remounts cost nothing */
    on(d.body, 'change', '#sortSel', function (e, t) {
      if (!L) return; L.f.sort = t.value; repaint({ keepSidebar: true });
    });

    on(d.body, 'click', '[data-clear-all]', function () {
      if (!L) return;
      var keepCat = L.lockCat ? L.f.cat : '';
      var keepSub = L.lockSub ? L.f.subs.slice() : [];
      var q = L.f.q, sort = L.f.sort;
      L.f = NK.blankFilters();
      L.f.cat = keepCat; L.f.subs = keepSub; L.f.q = q; L.f.sort = sort;
      repaint();
      U.info('Filters cleared');
    });

    on(d.body, 'click', '[data-drop]', function (e, t) {
      if (!L) return;
      var k = t.getAttribute('data-drop'), v = t.getAttribute('data-val');
      if (k === 'cat') L.f.cat = '';
      else if (k === 'price') L.f.price = [NK.PRICE_MIN, NK.PRICE_MAX];
      else if (k === 'rating') L.f.rating = 0;
      else if (k === 'discount') L.f.discount = 0;
      else if (k === 'inStock') L.f.inStock = false;
      else if (k === 'isNew') L.f.isNew = false;
      else if (k === 'q') { L.f.q = ''; }
      else if (Array.isArray(L.f[k])) toggleIn(L.f[k], v);
      repaint();
    });

    on(d.body, 'change', "input[name='fcat']", function (e, t) {
      if (!L) return;
      L.f.cat = t.value; L.f.subs = []; L.f.brands = [];
      repaint();
    });
    on(d.body, 'change', "input[name='fsub']", function (e, t) {
      if (!L) return; toggleIn(L.f.subs, t.value); repaint();
    });
    on(d.body, 'change', "input[name='fcolor']", function (e, t) {
      if (!L) return; toggleIn(L.f.colors, t.value); repaint();
    });
    on(d.body, 'change', "input[name='fbrand']", function (e, t) {
      if (!L) return; toggleIn(L.f.brands, t.value); repaint();
    });
    on(d.body, 'change', "input[name='frating']", function (e, t) {
      if (!L) return; L.f.rating = Number(t.value); repaint();
    });
    on(d.body, 'change', "input[name='fdiscount']", function (e, t) {
      if (!L) return; L.f.discount = Number(t.value); repaint();
    });
    on(d.body, 'change', "input[name='fstock']", function (e, t) {
      if (!L) return; L.f.inStock = t.checked; repaint();
    });
    on(d.body, 'change', "input[name='fnew']", function (e, t) {
      if (!L) return; L.f.isNew = t.checked; repaint();
    });
    on(d.body, 'click', '[data-size]', function (e, t) {
      if (!L) return; toggleIn(L.f.sizes, t.getAttribute('data-size')); repaint();
    });
    on(d.body, 'click', '[data-price]', function (e, t) {
      if (!L) return;
      L.f.price = t.getAttribute('data-price').split(',').map(Number);
      repaint();
    });
    on(d.body, 'click', '[data-clear]', function (e, t) {
      if (!L) return;
      var k = t.getAttribute('data-clear');
      if (k === 'rating') L.f.rating = 0;
      if (k === 'discount') L.f.discount = 0;
      repaint();
    });

    /* price sliders — live labels, painted fill, debounced query */
    var slide = U.debounce(function () { repaint({ keepSidebar: true }); }, 260);
    on(d.body, 'input', '.prange__r', function (e, t) {
      if (!L) return;
      var box = t.closest('.prange');
      var v = paintRange(box);
      if (!v) return;
      L.f.price = v;
      qs('#prLo', box).textContent = NK.money(v[0]);
      qs('#prHi', box).textContent = NK.money(v[1]) + (v[1] >= NK.PRICE_MAX ? '+' : '');
      slide();
    });
    qsa('.prange', root).forEach(paintRange);

    on(d.body, 'click', '#loadMore', function (e, t) {
      if (!L) return;
      U.busy(t, true, 'Loading');
      U.pretend(320).then(function () {
        L.page++;
        repaint({ keepPage: true, keepSidebar: true });
        var grid = qs('#results .pgrid', L.root);
        if (grid) {
          var cards = qsa('.card', grid);
          var focusOn = cards[Math.max(0, cards.length - PAGE)];
          if (focusOn) { var lk = qs('a', focusOn); if (lk) lk.focus({ preventScroll: true }); }
        }
      });
    });
  }

  /* ---- mobile filter sheet ------------------------------------------------- */
  function sheetInner() {
    return "<div class='fsheet__scrim' data-fsheet-close></div>" +
      "<div class='fsheet__box'>" +
        "<div class='fsheet__head'><h2 id='fsheetTitle'>Filters</h2>" +
          "<button class='fsheet__x' type='button' data-fsheet-close aria-label='Close filters'>&times;</button></div>" +
        "<div class='fsheet__body' id='fsheetBody'></div>" +
        "<div class='fsheet__foot'>" +
          "<button class='btn btn--ghost' type='button' data-fsheet-clear>Clear all</button>" +
          "<button class='btn' type='button' data-fsheet-close id='fsheetApply'>Show <span id='fsheetCount'></span></button>" +
        "</div>" +
      "</div>";
  }

  function wireSheet() {
    var sheet = qs('#fsheet');
    if (!sheet) {
      sheet = d.createElement('div');
      sheet.className = 'fsheet';
      sheet.id = 'fsheet';
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      sheet.setAttribute('aria-label', 'Filters and sorting');
      sheet.hidden = true;
      d.body.appendChild(sheet);
    }
    if (wireSheet.done) return;
    wireSheet.done = true;

    function refreshFoot() {
      var sc = qs('#fsheetCount', sheet);
      if (sc) sc.textContent = L.res.total + ' ' + NK.plural(L.res.total, 'style', 'styles');
    }
    function fill() {
      var sb = qs('#fsheetBody', sheet);
      sb.innerHTML = sidebarHtml(L.res);
      U.wireAccordions(sb, '.fgrp__h', null);
      refreshFoot();
    }
    function open() {
      sheet.innerHTML = sheetInner();
      fill();
      U.openSheet(sheet, null);
      U.raf(function () { var x = qs('.fsheet__x', sheet); if (x) x.focus(); });
    }
    function close() { U.closeSheet(sheet, null); }

    on(d.body, 'click', '[data-open-filters]', function () { if (L) open(); });
    on(sheet, 'click', '[data-fsheet-close]', close);
    on(sheet, 'click', '[data-fsheet-clear]', function () {
      if (!L) return;
      L.f.subs = L.lockSub ? L.f.subs.slice() : [];
      L.f.brands = []; L.f.sizes = []; L.f.colors = [];
      L.f.price = [NK.PRICE_MIN, NK.PRICE_MAX];
      L.f.rating = 0; L.f.discount = 0;
      L.f.inStock = false; L.f.isNew = false;
      if (!L.lockCat) L.f.cat = '';
      repaint({ keepSidebar: true });
      fill();
    });
    sheet.__fill = fill;
    w.addEventListener('hashchange', close);
  }

  /* sort sheet — mobile only, opened from the toolbar */
  function wireSortSheet() {
    if (wireSortSheet.done) return;
    wireSortSheet.done = true;
    on(d.body, 'click', '[data-open-sort]', function () {
      if (!L) return;
      U.openModal({
        size: 'sm', title: 'Sort by',
        html: "<ul class='sortlist'>" + NK.SORTS.map(function (s) {
          var act = L.f.sort === s.key;
          return "<li><button class='sortlist__i" + (act ? ' is-on' : '') + "' type='button' data-sort='" + s.key + "'" +
            " aria-pressed='" + act + "'>" + esc(s.label) + (act ? icon('check') : '') + "</button></li>";
        }).join('') + "</ul>",
        mounted: function (box) {
          on(box, 'click', '[data-sort]', function (e, t) {
            L.f.sort = t.getAttribute('data-sort');
            repaint({ keepSidebar: true });
            U.closeModal();
          });
        }
      });
    });
  }

  /* ---- listing entry ------------------------------------------------------- */
  X.listing = function (o) {
    o = o || {};
    var q = o.query || {};
    var seed = o.seed || {};
    if (o.cat) seed.cat = o.cat;
    if (o.sub) seed.subs = [o.sub];
    var f = filtersFromQuery(q, seed);
    if (o.cat) f.cat = o.cat;
    if (o.sub) f.subs = [o.sub];

    var isCat = !!f.cat && !o.preset;
    var isSearchQ = !!f.q && !f.cat;
    var title, sub, trail, quick = '', lockSub = false, basePath, baseQuery = null;

    if (o.preset === 'new') {
      f.isNew = true; f.sort = f.sort || 'newest';
      title = 'New arrivals'; sub = 'Fresh off the press — the last two weeks of drops.';
      trail = [{ label: 'Home', href: '#/' }, { label: 'New arrivals' }];
      basePath = '#/new';
    } else if (o.preset === 'trending') {
      f.sort = f.sort || 'popular';
      title = 'Trending now'; sub = 'Ranked on views, saves and checkouts across the last seven days.';
      trail = [{ label: 'Home', href: '#/' }, { label: 'Trending' }];
      basePath = '#/trending';
    } else if (o.preset === 'offers') {
      f.sort = f.sort || 'discount';
      title = 'Deals & offers'; sub = 'Every product carrying a discount right now.';
      trail = [{ label: 'Home', href: '#/' }, { label: 'Offers' }];
      basePath = '#/offers';
    } else if (isSearchQ) {
      title = 'Search results'; sub = f.q ? 'For “' + f.q + '”' : 'Browse the whole catalogue.';
      trail = [{ label: 'Home', href: '#/' }, { label: 'Search' }];
      basePath = '#/search';
    } else {
      var c = NK.catBySlug(f.cat);
      if (!c) { f.cat = ''; }
      c = NK.catBySlug(f.cat);
      if (!c) {
        return U.state({
          type: 'warn', artKind: 'warn', title: 'That category does not exist',
          body: 'The link might be stale. Start from the shop.',
          actions: "<a class='btn' href='#/'>Back to home</a>"
        });
      }
      var s = f.subs.length ? NK.subBySlug(c.slug, f.subs[0]) : null;
      if (s) {
        lockSub = true;
        title = s.name;
        sub = s.tagline || c.tagline;
        quick = subQuickLinks(c.slug, s.slug);
        trail = [{ label: 'Home', href: '#/' }, { label: c.name, href: '#/c/' + c.slug }, { label: s.name }];
        basePath = '#/c/' + c.slug + '/' + s.slug;
      } else {
        title = c.name;
        sub = c.tagline;
        quick = subQuickLinks(c.slug, '');
        trail = [{ label: 'Home', href: '#/' }, { label: c.name }];
        basePath = '#/c/' + c.slug;
      }
    }

    if (q && q.sort) f.sort = q.sort;
    var res = NK.query(f);
    var html = listingShell({ res: res, title: title, sub: sub, trail: trail, quick: quick });

    return {
      html: html,
      title: title + ' — NUKKAD',
      desc: sub || undefined,
      mounted: function (root) {
        L = {
          root: root, f: f, res: res, page: 1,
          lockCat: isCat, lockSub: lockSub,
          basePath: basePath, baseQuery: baseQuery, syncable: !o.preset && !isSearchQ,
          selfNav: false
        };
        wireFilters(root);
        wireSheet();
        wireSortSheet();
      }
    };
  };

  X.search = function (o) {
    var q = (o.query && o.query.q) || '';
    var f = NK.blankFilters();
    f.q = q;
    if (!q) {
      return {
        html: "<div class='wrap'>" + crumbs([{ label: 'Home', href: '#/' }, { label: 'Search' }]) + "</div>" +
          "<header class='phead'><div class='wrap'><h1 class='phead__t'>Search NUKKAD</h1>" +
          "<p class='phead__s'>Type a style, a colour, a fabric or a category.</p></div></header>" +
          "<div class='wrap'>" + U.state({
            type: 'empty', artKind: 'search', title: 'What are you after?',
            body: 'Try “oversized”, “black hoodie”, “co-ord set” or “under 999”.',
            actions: NK.recentSearches().slice(0, 6).map(function (r) {
              return "<a class='chip' href='#/search?q=" + encodeURIComponent(r) + "'>" + esc(r) + "</a>";
            }).join('') || "<a class='btn' href='#/trending'>Browse trending</a>"
          }) + "</div>" +
          U.section({
            mod: 'wash', eyebrow: 'Popular right now', title: 'Start with these',
            html: U.grid(NK.bestSellers(8), { cols: 4 })
          }),
        title: 'Search — NUKKAD'
      };
    }
    var res = NK.query(f);
    if (!res.total) {
      return {
        html: "<div class='wrap'>" + crumbs([{ label: 'Home', href: '#/' }, { label: 'Search' }]) + "</div>" +
          "<header class='phead'><div class='wrap'><h1 class='phead__t'>No results for “" + esc(q) + "”</h1>" +
          "<p class='phead__s'>Check the spelling, or try a broader term.</p></div></header>" +
          "<div class='wrap'>" + U.state({
            type: 'empty', artKind: 'search', title: 'Nothing matched that',
            body: 'We searched names, categories, colours, fabrics, fits and prints.',
            actions: "<a class='btn' href='#/c/men'>Shop men</a><a class='btn btn--ghost' href='#/c/women'>Shop women</a>"
          }) + "</div>" +
          U.section({
            mod: 'wash', eyebrow: 'You might like', title: 'Recommended for you',
            html: U.grid(NK.recommended(8), { cols: 4 })
          }),
        title: 'No results for ' + q + ' — NUKKAD'
      };
    }
    return X.listing(o);
  };

  X.newArrivals = function (o) { return X.listing({ preset: 'new', query: (o || {}).query }); };
  X.trending = function (o) { return X.listing({ preset: 'trending', query: (o || {}).query }); };
  X.offers = function (o) {
    var base = X.listing({ preset: 'offers', query: (o || {}).query });
    var banner = "<section class='strip'><div class='wrap strip__in'>" +
      NK.eligibleCoupons(0).slice(0, 4).map(function (e) {
        var c = e.coupon;
        return "<div class='strip__i'><code class='cpn__code'>" + esc(c.code) + "</code>" +
          "<span>" + (c.type === 'percent' ? c.value + '% off' : NK.money(c.value) + ' off') +
          " on orders over " + NK.money(c.minOrder) + "</span></div>";
      }).join('') + "</div></section>";
    base.html = banner + base.html;
    return base;
  };

  /* ======================================================================
     PRODUCT DETAILS
     ====================================================================== */
  var P = null; /* live PDP state */

  function galleryHtml(p, hex) {
    var shots = IMG.gallery(p, hex);
    return "<div class='gal' id='gal'>" +
      "<div class='gal__thumbs' role='tablist' aria-label='Product images'>" +
        shots.map(function (s, i) {
          return "<button class='gthumb" + (i ? '' : ' is-on') + "' type='button' role='tab' data-shot='" + i + "'" +
            " aria-selected='" + (i ? 'false' : 'true') + "' aria-label='" + attr(s.label) + "'>" +
            "<img src='" + s.src + "' data-fallback='" + s.fallback + "' alt='' width='74' height='99'></button>";
        }).join('') +
      "</div>" +
      "<div>" +
        "<div class='gal__stage' id='galStage'>" +
          "<div class='gal__tags'>" + U.tagsFor(p) + "</div>" +
          "<img class='gal__img' id='galImg' src='" + shots[0].src + "' data-fallback='" + shots[0].fallback + "'" +
            " alt='" + attr(U.altText(p, shots[0].view)) + "' width='600' height='800'>" +
          "<button class='gal__nav gal__nav--p' type='button' data-shot-step='-1' aria-label='Previous image'>" + icon('arrowL') + "</button>" +
          "<button class='gal__nav gal__nav--n' type='button' data-shot-step='1' aria-label='Next image'>" + icon('arrowR') + "</button>" +
          "<span class='gal__hint'>" + icon('zoom') + "Tap to zoom</span>" +
        "</div>" +
        "<div class='gal__dots' id='galDots'>" +
          shots.map(function (s, i) {
            return "<button class='gal__dot" + (i ? '' : ' is-on') + "' type='button' data-shot='" + i +
              "' aria-label='" + attr(s.label) + "'></button>";
          }).join('') +
        "</div>" +
      "</div></div>";
  }

  function sizesHtml(p, sel) {
    return p.sizes.map(function (s) {
      var q = p.stock[s] || 0;
      return "<button class='psize" + (s === sel ? ' is-on' : '') + "' type='button' data-psize='" + attr(s) + "'" +
        (q <= 0 ? " disabled aria-label='Size " + attr(s) + " is sold out'" : "") +
        " aria-pressed='" + (s === sel ? 'true' : 'false') + "'>" + esc(s) +
        (q > 0 && q <= 4 ? "<span class='psize__few'>" + q + " left</span>" : '') + "</button>";
    }).join('');
  }

  function colorsHtml(p, selKey) {
    return p.colors.map(function (c) {
      return "<button class='pcolor" + (c.key === selKey ? ' is-on' : '') + "' type='button' data-pcolor='" + attr(c.key) +
        "' data-hex='" + attr(c.hex) + "' aria-pressed='" + (c.key === selKey ? 'true' : 'false') + "'>" +
        "<span class='pcolor__d' style='background:" + attr(c.hex) + "'></span>" + esc(c.name) + "</button>";
    }).join('');
  }

  function perksHtml() {
    return "<div class='pperks'>" +
      "<div class='pperk'>" + icon('truck') + "<div><b>Free over " + NK.money(NK.FREE_SHIP) + "</b>" +
        "<span>Dispatched in 24 hours</span></div></div>" +
      "<div class='pperk'>" + icon('ret') + "<div><b>14-day returns</b><span>Easy pickup, no questions</span></div></div>" +
      "<div class='pperk'>" + icon('leaf') + "<div><b>Combed cotton</b><span>Pre-shrunk, bio-washed</span></div></div>" +
      "<div class='pperk'>" + icon('lock') + "<div><b>Secure payments</b><span>UPI, cards, COD</span></div></div>" +
    "</div>";
  }

  function offersHtml(sub) {
    var list = NK.eligibleCoupons(sub).filter(function (e) { return e.eligible; }).slice(0, 3);
    if (!list.length) list = NK.eligibleCoupons(sub).slice(0, 2);
    return "<div class='pbox'><div class='pbox__h'><span class='pbox__l'>Offers for you</span></div>" +
      "<div class='poffers'>" + list.map(function (e) {
        var c = e.coupon;
        return "<div class='poffer'>" + icon('tag') + "<div>" +
          (c.type === 'percent' ? c.value + '% off' : NK.money(c.value) + ' off') +
          (c.maxDiscount ? ' up to ' + NK.money(c.maxDiscount) : '') +
          " on orders over " + NK.money(c.minOrder) + " with " +
          "<code data-copy='" + attr(c.code) + "' title='Copy code' role='button' tabindex='0'>" + esc(c.code) + "</code>" +
          (e.eligible ? " <b class='ok-txt'>· applies to this item</b>" : '') +
          "</div></div>";
      }).join('') + "</div></div>";
  }
  function acdnItem(title, body, open) {
    return "<div class='acdn__i'>" +
      "<button class='acdn__t' type='button' aria-expanded='" + (open ? 'true' : 'false') + "'>" +
        esc(title) + icon('plus') + "</button>" +
      "<div class='acdn__p' data-open='" + (open ? '1' : '0') + "'><div class='acdn__pi'>" +
        "<div class='acdn__pc'>" + body + "</div></div></div></div>";
  }

  function detailsHtml(p) {
    var desc = "<p>" + esc(p.slogan) + "</p><p>" +
      esc(p.name + ' is cut in a ' + p.fit.toLowerCase() + ' silhouette from ' + p.fabric.toLowerCase() +
      '. The ' + p.print.toLowerCase() + ' is screen-printed by hand in small runs, so no two pieces sit exactly alike. ' +
      'Made in ' + p.origin + '.') + "</p>";
    var spec = "<dl class='spec'>" +
      [['Fabric', p.fabric], ['Fit', p.fit], ['Print', p.print], ['Category', p.catName + ' · ' + p.subName],
       ['Brand', p.brand], ['SKU', p.sku], ['Country of origin', p.origin],
       ['Sizes', p.sizes.join(' · ')], ['Colours', p.colors.map(function (c) { return c.name; }).join(' · ')]]
      .map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join('') + "</dl>";
    var care = "<ul class='bullets'>" + p.care.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join('') + "</ul>";
    var ship = "<ul class='bullets'>" +
      "<li>Free delivery on orders above " + NK.money(NK.FREE_SHIP) + ", otherwise " + NK.money(NK.SHIP_FEE) + " flat.</li>" +
      "<li>Dispatched within 24 hours of the order being confirmed.</li>" +
      "<li>Metro PIN codes get it in 2–3 days; the rest of India in 4–7.</li>" +
      "<li>Cash on delivery available on 19,000+ PIN codes for " + NK.money(NK.COD_FEE) + " extra.</li></ul>";
    var ret = "<ul class='bullets'>" +
      "<li>14 days from delivery to raise a return or exchange.</li>" +
      "<li>Tags on, unworn, unwashed, with the original packing.</li>" +
      "<li>Free reverse pickup — we come to your address.</li>" +
      "<li>Refunds land back on the original payment method in 5–7 working days.</li></ul>";
    return "<div class='acdn'>" +
      acdnItem('Description', desc, true) +
      acdnItem('Specifications', spec, false) +
      acdnItem('Fabric & care', care, false) +
      acdnItem('Shipping', ship, false) +
      acdnItem('Returns & exchange', ret, false) +
    "</div>";
  }

  function pinfoHtml(p, size, colorKey) {
    var note = NK.stockNote(p, size);
    var sold = p.ratingCount * 3 + 40;
    return "<div class='pinfo'>" +
      "<p class='pinfo__brand'>" + icon('spark') + esc(p.brand) + "</p>" +
      "<h1 class='pinfo__t'>" + esc(p.name) + "</h1>" +
      "<div class='pinfo__rate'>" + U.ratePill(p) +
        "<a href='#reviews' data-jump='reviews'>" + p.ratingCount + " " + NK.plural(p.ratingCount, 'review', 'reviews') + "</a>" +
        "<span class='pinfo__sold'>" + sold.toLocaleString('en-IN') + " sold</span></div>" +
      "<div class='pprice'>" +
        "<span class='pprice__now'>" + NK.money(p.price) + "</span>" +
        (p.mrp > p.price ? "<span class='pprice__was'>" + NK.money(p.mrp) + "</span>" +
          "<span class='pprice__off'>" + p.discount + "% off</span>" : '') +
        "<span class='pprice__tax'>Inclusive of all taxes</span>" +
      "</div>" +
      "<div class='pbox'><div class='pbox__h'>" +
          "<span class='pbox__l'>Size <b id='pSizeLab'>" + esc(size || '—') + "</b></span>" +
          "<button class='lnk' type='button' data-sizeguide='" + attr(p.id) + "'>Size guide</button></div>" +
        "<div class='psizes' id='pSizes'>" + sizesHtml(p, size) + "</div>" +
        "<p class='pbox__note stock stock--" + (note ? note.level : 'ok') + "' id='pStock'>" +
          esc(note ? note.text : '') + "</p></div>" +
      "<div class='pbox'><div class='pbox__h'>" +
          "<span class='pbox__l'>Colour <b id='pColorLab'>" +
            esc((p.colors.filter(function (c) { return c.key === colorKey; })[0] || p.colors[0]).name) + "</b></span></div>" +
        "<div class='pcolors' id='pColors'>" + colorsHtml(p, colorKey) + "</div></div>" +
      "<div class='pbox'><div class='pbox__h'><span class='pbox__l'>Quantity</span></div>" +
        "<div class='qty' id='pQty'>" +
          "<button class='qty__b' type='button' data-qstep='-1' aria-label='Decrease quantity' disabled>&minus;</button>" +
          "<span class='qty__v' id='pQtyV' aria-live='polite'>1</span>" +
          "<button class='qty__b' type='button' data-qstep='1' aria-label='Increase quantity'>+</button>" +
        "</div></div>" +
      "<div class='pacts'>" +
        "<button class='btn btn--lg' type='button' id='pAdd'" + (p.totalStock <= 0 ? ' disabled' : '') + ">" +
          icon('bag') + (p.totalStock <= 0 ? 'Sold out' : 'Add to cart') + "</button>" +
        "<button class='btn btn--lg btn--gold' type='button' id='pBuy'" + (p.totalStock <= 0 ? ' disabled' : '') + ">Buy now</button>" +
        "<button class='btn btn--ghost btn--lg pacts__wish" + (NK.inWish(p.id) ? ' is-on' : '') + "' type='button'" +
          " id='pWish' aria-pressed='" + (NK.inWish(p.id) ? 'true' : 'false') + "'" +
          " aria-label='" + (NK.inWish(p.id) ? 'Remove from wishlist' : 'Save to wishlist') + "'>" + icon('heart') + "</button>" +
      "</div>" +
      "<div class='pbox'><div class='pbox__h'><span class='pbox__l'>Delivery</span></div>" +
        "<form class='pin' id='pinForm' novalidate>" +
          "<input class='inp' id='pinInp' name='pin' type='text' inputmode='numeric' maxlength='6'" +
            " placeholder='Enter 6-digit PIN code' aria-label='PIN code' autocomplete='postal-code'>" +
          "<button class='btn btn--ghost' type='submit'>Check</button></form>" +
        "<div id='pinRes' aria-live='polite'></div></div>" +
      perksHtml() +
      offersHtml(p.price) +
      "<div class='pacts pacts--sec'>" +
        "<button class='btn btn--ghost btn--sm' type='button' data-compare='" + attr(p.id) + "'>" +
          icon('scale') + (NK.inCompare(p.id) ? 'In compare' : 'Compare') + "</button>" +
        "<button class='btn btn--ghost btn--sm' type='button' id='pShare'>Share</button></div>" +
      detailsHtml(p) +
    "</div>";
  }
  /* ---- reviews ------------------------------------------------------------- */
  function rvHtml(id, r) {
    var on = NK.wasHelpful(id, r.id);
    return "<article class='rv'>" +
      "<div class='rv__h'>" +
        "<span class='rv__av' aria-hidden='true'>" + esc(r.who.slice(0, 1).toUpperCase()) + "</span>" +
        "<div class='rv__who'><b>" + esc(r.who) + "</b>" +
          "<span>" + (r.verified ? 'Verified purchase' : 'Reviewer') + (r.size ? ' · Size ' + esc(r.size) : '') + "</span></div>" +
        "<div class='rv__meta'>" + U.stars(r.stars, 'stars--sm') +
          "<span class='rv__date'>" + NK.fmtDate(r.at) + "</span></div>" +
      "</div>" +
      (r.verified ? "<span class='tag tag--ok'>" + icon('check') + "Verified purchase</span>" : '') +
      "<h3 class='rv__t'>" + esc(r.title) + "</h3>" +
      "<p class='rv__b'>" + esc(r.body) + "</p>" +
      "<div class='rv__fit'><span>Fit: <b>" + esc(r.fit) + "</b></span></div>" +
      "<div class='rv__foot'>" +
        "<button class='rv__help" + (on ? ' is-on' : '') + "' type='button' data-help='" + attr(r.id) + "'" +
          " aria-pressed='" + (on ? 'true' : 'false') + "'>" + icon('check') +
          "Helpful <span>(" + (r.helpful + (on ? 1 : 0)) + ")</span></button>" +
      "</div></article>";
  }

  var RV_PAGE = 4;
  function rvListHtml(id, n) {
    var list = NK.reviewSummary(id).list;
    var slice = list.slice(0, n);
    return "<div class='rvlist' id='rvList'>" + slice.map(function (r) { return rvHtml(id, r); }).join('') + "</div>" +
      (list.length > slice.length
        ? "<div class='loadmore'><button class='btn btn--ghost' type='button' id='rvMore'>" +
          "Show " + Math.min(RV_PAGE, list.length - slice.length) + " more " +
          NK.plural(Math.min(RV_PAGE, list.length - slice.length), 'review', 'reviews') + "</button></div>"
        : '');
  }

  function reviewsHtml(p) {
    var s = NK.reviewSummary(p.id);
    return "<section class='sec' id='reviews'><div class='wrap'>" +
      "<header class='sec__hd'><div><p class='sec__eyebrow'>What buyers say</p>" +
        "<h2 class='sec__t dsp'>Reviews</h2></div></header>" +
      "<div class='rvsum'>" +
        "<div class='rvsum__big'><div class='rvsum__n'>" + s.avg.toFixed(1) + "<sub>/5</sub></div>" +
          U.stars(s.avg) + "<div class='rvsum__c'>" + s.count.toLocaleString('en-IN') + " ratings</div></div>" +
        "<div class='rvbars'>" + s.bars.map(function (b) {
          return "<div class='rvbar'><span class='rvbar__l'>" + b.stars +
            "<svg viewBox='0 0 24 24' aria-hidden='true'>" + U.ICON.star + "</svg></span>" +
            "<span class='rvbar__t'><span class='rvbar__f' style='width:" + b.pct + "%'></span></span>" +
            "<span class='rvbar__c'>" + b.pct + "%</span></div>";
        }).join('') + "</div>" +
        "<div class='rvsum__act'><p class='note'><b>" + s.recommend + "%</b> would buy it again<br>" +
          "Most say it fits <b>" + esc(s.topFit.toLowerCase()) + "</b></p>" +
          "<button class='btn btn--ghost' type='button' id='rvWrite'>Write a review</button></div>" +
      "</div>" + rvListHtml(p.id, RV_PAGE) + "</div></section>";
  }

  function reviewForm(p) {
    var sizes = p.sizes.map(function (s) { return { value: s, label: s }; });
    return "<form id='rvForm' novalidate>" +
      "<fieldset class='rvstars' id='rvStars'><legend class='field__l'>Your rating</legend>" +
        [1, 2, 3, 4, 5].map(function (i) {
          return "<label class='rvstar'><input type='radio' name='stars' value='" + i + "'" +
            (i === 5 ? ' checked' : '') + "><span aria-hidden='true'>" +
            "<svg viewBox='0 0 24 24'>" + U.ICON.star + "</svg></span>" +
            "<span class='sr-only'>" + i + " " + NK.plural(i, 'star', 'stars') + "</span></label>";
        }).join('') + "</fieldset>" +
      U.field({ id: 'rvTitle', label: 'Headline', placeholder: 'Sums up your experience', max: 70, wide: true }) +
      U.field({ id: 'rvBody', label: 'Your review', tag: 'textarea', rows: 4, wide: true,
        placeholder: 'How is the fabric, the fit, the print after a wash?' }) +
      U.field({ id: 'rvFit', label: 'How did it fit?', tag: 'select', value: 'True to size',
        options: [{ value: 'Runs small', label: 'Runs small' }, { value: 'True to size', label: 'True to size' },
                  { value: 'Runs large', label: 'Runs large' }] }) +
      U.field({ id: 'rvSize', label: 'Size you bought', tag: 'select', optional: true,
        options: [{ value: '', label: 'Prefer not to say' }].concat(sizes) }) +
    "</form>";
  }
  X.product = function (id, q) {
    var p = NK.byId(id);
    if (!p) {
      return { title: 'Product not found — NUKKAD',
        html: "<div class='wrap'>" + U.state({
          type: 'warn', artKind: 'search', title: 'This piece has moved on',
          body: 'The product you are after is not in the catalogue any more. It may have sold out for good.',
          actions: "<a class='btn' href='#/c/men'>Shop men</a><a class='btn btn--ghost' href='#/c/women'>Shop women</a>"
        }) + "</div>" };
    }

    var colorKey = (q && q.color) || p.colors[0].key;
    var colour = p.colors.filter(function (c) { return c.key === colorKey; })[0] || p.colors[0];
    var size = (q && q.size && p.sizes.indexOf(q.size) >= 0) ? q.size : NK.firstAvailableSize(p);

    var rel = NK.related(p, 12);
    var seen = NK.recentlyViewed(12, p.id);

    var html =
      "<div class='wrap'>" + crumbs([
        { href: '#/', label: 'Home' },
        { href: '#/c/' + p.cat, label: p.catName },
        { href: '#/c/' + p.cat + '/' + p.sub, label: p.subName },
        { label: p.name }
      ]) + "</div>" +
      "<div class='wrap'><div class='pdp'>" +
        galleryHtml(p, colour.hex) +
        pinfoHtml(p, size, colour.key) +
      "</div></div>" +
      reviewsHtml(p) +
      (rel.length ? U.section({ eyebrow: 'Goes with it', title: 'You may also like',
        more: { href: '#/c/' + p.cat + '/' + p.sub, label: 'All ' + p.subName.toLowerCase() },
        html: U.rail(rel, { label: 'Related products' }) }) : '') +
      (seen.length ? U.section({ eyebrow: 'Your trail', title: 'Recently viewed',
        html: U.rail(seen, { label: 'Recently viewed products' }) }) : '') +
      "<div class='buybar' id='buybar'>" +
        "<button class='buybar__w" + (NK.inWish(p.id) ? ' is-on' : '') + "' type='button' id='bbWish'" +
          " aria-label='Save to wishlist'>" + icon('heart') + "</button>" +
        "<button class='btn btn--ghost' type='button' id='bbAdd'" + (p.totalStock <= 0 ? ' disabled' : '') + ">Add to cart</button>" +
        "<button class='btn btn--gold' type='button' id='bbBuy'" + (p.totalStock <= 0 ? ' disabled' : '') + ">Buy now</button>" +
      "</div>";

    return {
      title: p.name + ' — ' + p.brand + ' | NUKKAD',
      desc: p.slogan + ' ' + p.fabric + ', ' + p.fit.toLowerCase() + ' fit. ' + NK.money(p.price) +
        ' (' + p.discount + '% off). Free delivery over ' + NK.money(NK.FREE_SHIP) + '.',
      html: html,
      mounted: function (root) {
        P = { root: root, p: p, shots: IMG.gallery(p, colour.hex), i: 0,
              size: size, color: colour, qty: 1, rvShown: RV_PAGE };
        NK.markSeen(p.id);
        d.body.classList.add('has-buybar');
        wirePdp(root);
        injectLd(p);
      }
    };
  };

  function injectLd(p) {
    var old = d.getElementById('ldProduct');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var s = d.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'ldProduct';
    s.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product',
      name: p.name, sku: p.sku, description: p.slogan,
      brand: { '@type': 'Brand', name: p.brand },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.ratingCount },
      offers: { '@type': 'Offer', price: p.price, priceCurrency: 'INR',
        availability: p.totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' }
    });
    d.head.appendChild(s);
  }
  /* ---- PDP wiring ---------------------------------------------------------- */
  function setShot(i) {
    if (!P) return;
    var n = P.shots.length;
    P.i = ((i % n) + n) % n;
    var s = P.shots[P.i];
    var img = qs('#galImg', P.root);
    if (img) {
      img.removeAttribute('data-fell');
      img.classList.remove('img--drawn');
      img.setAttribute('data-fallback', s.fallback);
      img.src = s.src;
      img.alt = U.altText(P.p, s.view);
    }
    qsa('.gthumb', P.root).forEach(function (t, k) {
      t.classList.toggle('is-on', k === P.i);
      t.setAttribute('aria-selected', k === P.i ? 'true' : 'false');
    });
    qsa('.gal__dot', P.root).forEach(function (t, k) { t.classList.toggle('is-on', k === P.i); });
    var stage = qs('#galStage', P.root);
    if (stage) stage.classList.remove('is-zoom');
  }

  function setColor(key) {
    if (!P) return;
    var c = P.p.colors.filter(function (x) { return x.key === key; })[0];
    if (!c) return;
    P.color = c;
    P.shots = IMG.gallery(P.p, c.hex);
    qsa('.gthumb img', P.root).forEach(function (im, k) {
      if (!P.shots[k]) return;
      im.removeAttribute('data-fell');
      im.classList.remove('img--drawn');
      im.setAttribute('data-fallback', P.shots[k].fallback);
      im.src = P.shots[k].src;
    });
    setShot(P.i);
    qsa('[data-pcolor]', P.root).forEach(function (b) {
      var on = b.getAttribute('data-pcolor') === key;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var lab = qs('#pColorLab', P.root);
    if (lab) lab.textContent = c.name;
    syncUrlPdp();
  }

  function setSize(s) {
    if (!P) return;
    P.size = s;
    qsa('[data-psize]', P.root).forEach(function (b) {
      var on = b.getAttribute('data-psize') === s;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var lab = qs('#pSizeLab', P.root);
    if (lab) lab.textContent = s || '—';
    var note = NK.stockNote(P.p, s), box = qs('#pStock', P.root);
    if (box && note) {
      box.textContent = note.text;
      box.className = 'pbox__note stock stock--' + note.level;
    }
    var max = (P.p.stock[s] || 0);
    if (P.qty > max) setQty(Math.max(1, max));
    syncUrlPdp();
  }

  function setQty(n) {
    if (!P) return;
    var max = Math.max(1, Math.min(10, P.p.stock[P.size] || 1));
    P.qty = Math.max(1, Math.min(max, n));
    var v = qs('#pQtyV', P.root);
    if (v) v.textContent = P.qty;
    var dec = qs("[data-qstep='-1']", P.root), inc = qs("[data-qstep='1']", P.root);
    if (dec) dec.disabled = P.qty <= 1;
    if (inc) inc.disabled = P.qty >= max;
  }

  function syncUrlPdp() {
    if (!P) return;
    var h = '#/p/' + P.p.id + '?color=' + encodeURIComponent(P.color.key) +
      (P.size ? '&size=' + encodeURIComponent(P.size) : '') + '&keep=1';
    if (w.history && w.history.replaceState) w.history.replaceState(null, '', h);
  }

  function addFromPdp(then) {
    if (!P) return;
    if (!P.size) { U.err('Pick a size first'); return; }
    if ((P.p.stock[P.size] || 0) <= 0) { U.err('That size is sold out', 'Try another size.'); return; }
    var r = NK.cartAdd(P.p.id, P.size, P.color.key, P.qty);
    U.fromResult(r, P.qty + ' × ' + P.p.name + ' added');
    if (r.ok) { U.bump('#cartBadge'); if (then) then(); }
  }
  function wirePdp(root) {
    U.wireAccordions(qs('.acdn', root), '.acdn__t', null);
    setQty(1);
    if (wirePdp.done) return;
    wirePdp.done = true;

    on(d.body, 'click', '[data-shot]', function (e, t) { setShot(Number(t.getAttribute('data-shot'))); });
    on(d.body, 'click', '[data-shot-step]', function (e, t) { setShot(P ? P.i + Number(t.getAttribute('data-shot-step')) : 0); });
    on(d.body, 'click', '[data-psize]', function (e, t) { if (!t.disabled) setSize(t.getAttribute('data-psize')); });
    on(d.body, 'click', '[data-pcolor]', function (e, t) { setColor(t.getAttribute('data-pcolor')); });
    on(d.body, 'click', '[data-qstep]', function (e, t) { setQty((P ? P.qty : 1) + Number(t.getAttribute('data-qstep'))); });

    /* zoom: click toggles, pointer pans via transform-origin */
    on(d.body, 'click', '#galImg', function (e, t) {
      var stage = t.closest('.gal__stage');
      if (stage) stage.classList.toggle('is-zoom');
    });
    on(d.body, 'mousemove', '#galImg', function (e, t) {
      var stage = t.closest('.gal__stage');
      if (!stage || !stage.classList.contains('is-zoom')) return;
      var r = stage.getBoundingClientRect();
      t.style.transformOrigin =
        (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '% ' +
        (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%';
    });
    on(d.body, 'mouseleave', '#galImg', function (e, t) {
      var stage = t.closest('.gal__stage');
      if (stage) stage.classList.remove('is-zoom');
    });

    /* keyboard arrows move the gallery when it holds focus */
    on(d.body, 'keydown', '.gal', function (e) {
      if (e.key === 'ArrowRight') { setShot(P.i + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { setShot(P.i - 1); e.preventDefault(); }
    });

    on(d.body, 'click', '#pAdd', function () { addFromPdp(); });
    on(d.body, 'click', '#bbAdd', function () { addFromPdp(); });
    on(d.body, 'click', '#pBuy', function () { addFromPdp(function () { location.hash = '#/checkout/address'; }); });
    on(d.body, 'click', '#bbBuy', function () { addFromPdp(function () { location.hash = '#/checkout/address'; }); });

    on(d.body, 'click', '#pWish, #bbWish', function (e, t) {
      if (!P) return;
      var r = NK.wishToggle(P.p.id);
      var isOn = NK.inWish(P.p.id);
      qsa('#pWish, #bbWish', d.body).forEach(function (b) {
        b.classList.toggle('is-on', isOn);
        b.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        b.setAttribute('aria-label', isOn ? 'Remove from wishlist' : 'Save to wishlist');
      });
      U.fromResult(r);
      U.bump('#wishBadge');
    });

    on(d.body, 'click', '#pShare', function () {
      if (!P) return;
      var url = location.href;
      if (w.navigator && w.navigator.share) {
        w.navigator.share({ title: P.p.name, text: P.p.slogan, url: url })['catch'](function () {});
        return;
      }
      if (w.navigator && w.navigator.clipboard) {
        w.navigator.clipboard.writeText(url).then(function () { U.ok('Link copied'); },
          function () { U.info('Copy the link from the address bar'); });
      } else U.info('Copy the link from the address bar');
    });

    on(d.body, 'click', '[data-copy]', function (e, t) {
      var code = t.getAttribute('data-copy');
      if (w.navigator && w.navigator.clipboard) {
        w.navigator.clipboard.writeText(code).then(function () { U.ok(code + ' copied'); },
          function () { U.info('Code: ' + code); });
      } else U.info('Code: ' + code);
    });

    on(d.body, 'submit', '#pinForm', function (e, t) {
      e.preventDefault();
      var box = qs('#pinRes', d.body);
      var r = NK.checkPin(qs('#pinInp', t).value);
      if (!box) return;
      box.innerHTML = "<div class='pin__res pin__res--" + (r.ok ? 'ok' : 'no') + "'>" +
        icon(r.ok ? 'truck' : 'warn') + "<div>" +
        (r.ok ? "<b>Delivers by " + esc(r.eta) + "</b>" + esc(r.city + ' · ' + r.days + ' days · ' +
            (r.cod ? 'COD available' : 'Prepaid only')) : "<b>" + esc(r.msg) + "</b>") +
        "</div></div>";
    });

    on(d.body, 'click', '[data-jump]', function (e, t) {
      var el = qs('#' + t.getAttribute('data-jump'), d.body);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: U.reduced() ? 'auto' : 'smooth', block: 'start' }); }
    });

    wireReviews();
  }
  function wireReviews() {
    on(d.body, 'click', '#rvMore', function (e, t) {
      if (!P) return;
      U.busy(t, true, 'Loading');
      U.pretend(260).then(function () {
        P.rvShown += RV_PAGE;
        var host = qs('#reviews .wrap', P.root);
        if (!host) return;
        var old = qs('#rvList', P.root), foot = t.closest('.loadmore');
        if (old) old.outerHTML = rvListHtml(P.p.id, P.rvShown);
        if (foot && foot.parentNode) foot.parentNode.removeChild(foot);
      });
    });

    on(d.body, 'click', '[data-help]', function (e, t) {
      if (!P) return;
      var r = NK.markHelpful(P.p.id, t.getAttribute('data-help'));
      if (r.ok) {
        t.classList.add('is-on');
        t.setAttribute('aria-pressed', 'true');
        var n = qs('span', t);
        if (n) n.textContent = '(' + ((parseInt(n.textContent.replace(/\D/g, ''), 10) || 0) + 1) + ')';
      }
      U.fromResult(r);
    });

    on(d.body, 'click', '#rvWrite', function () {
      if (!P) return;
      var p = P.p;
      if (!NK.isAuthed()) {
        U.err('Log in to post a review');
        location.hash = '#/login?next=' + encodeURIComponent('#/p/' + p.id);
        return;
      }
      if (NK.hasReviewed(p.id)) { U.info('You have already reviewed this piece'); return; }
      U.openModal({
        size: 'md', title: 'Write a review', sub: p.name,
        html: reviewForm(p),
        foot: "<button class='btn btn--ghost' type='button' data-close='1'>Cancel</button>" +
              "<button class='btn' type='button' id='rvSend'>Post review</button>",
        mounted: function (box) {
          U.on(box, 'click', '#rvSend', function (e, t) {
            var form = qs('#rvForm', box);
            var okv = U.validate(form, {
              rvTitle: [NK.V.required, function (v) { return v.length < 4 ? 'Give it at least 4 characters.' : ''; }],
              rvBody: [NK.V.required, function (v) { return v.length < 20 ? 'Tell us a bit more — 20 characters minimum.' : ''; }]
            });
            if (!okv) return;
            var data = U.readForm(form);
            U.busy(t, true, 'Posting');
            U.pretend(420).then(function () {
              var r = NK.addReview(p.id, {
                stars: Number(data.stars) || 5, title: data.rvTitle, body: data.rvBody,
                fit: data.rvFit, size: data.rvSize
              });
              U.fromResult(r);
              U.busy(t, false);
              if (r.ok) {
                U.closeModal();
                var host = qs('#reviews', P.root);
                if (host) { host.outerHTML = reviewsHtml(p); U.hydrate(P.root); }
              }
            });
          });
        }
      });
    });
  }
  /* ---- cart ---------------------------------------------------------------- */
  function citemHtml(l) {
    var note = NK.stockNote(l.product, l.size);
    var href = '#/p/' + l.id + '?color=' + encodeURIComponent(l.color.key);
    return "<article class='citem' data-key='" + attr(l.key) + "'>" +
      "<a class='citem__m' href='" + attr(href) + "' tabindex='-1' aria-hidden='true'>" +
        "<img" + U.srcPair(l.product, l.color.hex, 'front', 200, true) + " alt='' width='96' height='128' loading='lazy'></a>" +
      "<div class='citem__b'>" +
        "<p class='citem__brand'>" + esc(l.product.brand) + "</p>" +
        "<a class='citem__n' href='" + attr(href) + "'>" + esc(l.product.name) + "</a>" +
        "<div class='citem__v'><span>Size " + esc(l.size) + "</span>" +
          "<span><i style='background:" + attr(l.color.hex) + "'></i>" + esc(l.color.name) + "</span></div>" +
        (note && note.level !== 'ok' ? "<p class='citem__stock'>" + esc(note.text) + "</p>" : '') +
        "<div class='citem__p'>" + U.priceBlock(l.product, l.qty) + "</div>" +
        "<div class='citem__f'>" +
          "<div class='qty qty--sm'>" +
            "<button class='qty__b' type='button' data-cqty='" + attr(l.key) + "' data-step='-1'" +
              " aria-label='Decrease quantity'" + (l.qty <= 1 ? ' disabled' : '') + ">&minus;</button>" +
            "<span class='qty__v' aria-live='polite'>" + l.qty + "</span>" +
            "<button class='qty__b' type='button' data-cqty='" + attr(l.key) + "' data-step='1'" +
              " aria-label='Increase quantity'" + (l.qty >= l.max ? ' disabled' : '') + ">+</button>" +
          "</div>" +
          "<button class='citem__lnk' type='button' data-csave='" + attr(l.key) + "'>Save for later</button>" +
          "<button class='citem__lnk' type='button' data-cwish='" + attr(l.key) + "'>To wishlist</button>" +
          "<button class='citem__lnk citem__lnk--x' type='button' data-cremove='" + attr(l.key) + "'>Remove</button>" +
        "</div>" +
      "</div></article>";
  }

  function couponHtml(t) {
    var live = NK.activeCoupon();
    var elig = NK.eligibleCoupons(t.subtotal);
    return "<div class='coupon' id='coupon'>" +
      (live
        ? "<div class='coupon__on'>" + icon('tag') +
            "<div><b>" + esc(live.code) + "</b><span>You saved " + NK.money(t.couponAmount) + " on this order</span></div>" +
            "<button class='coupon__x' type='button' id='cpnOff'>Remove</button></div>"
        : "<form class='coupon__f' id='cpnForm' novalidate>" +
            "<input class='inp' id='cpnInp' name='code' type='text' placeholder='Coupon code'" +
              " aria-label='Coupon code' autocapitalize='characters' autocomplete='off'>" +
            "<button class='btn btn--ghost' type='submit'>Apply</button></form>") +
      (elig.length
        ? "<div class='coupon__list'>" + elig.slice(0, 4).map(function (e) {
            var c = e.coupon, mine = live && live.code === c.code;
            return "<button class='cpn' type='button' data-cpnuse='" + attr(c.code) + "'" +
              (e.eligible && !mine ? '' : ' disabled') + ">" +
              "<code class='cpn__code'>" + esc(c.code) + "</code>" +
              "<span class='cpn__b'><span class='cpn__t'>" +
                (c.type === 'percent' ? c.value + '% off' + (c.maxDiscount ? ' up to ' + NK.money(c.maxDiscount) : '')
                                      : NK.money(c.value) + ' off') + "</span>" +
                "<span class='cpn__s" + (e.eligible ? '' : ' is-bad') + "'>" + (mine
                  ? 'Applied to this order'
                  : e.eligible
                    ? 'Saves ' + NK.money(e.saves) + ' right now'
                    : 'Add ' + NK.money(c.minOrder - t.subtotal) + ' more to unlock') + "</span>" +
                "<span class='cpn__exp'>" + icon('tag') + "Valid till " + NK.fmtDate(c.expires) + "</span>" +
              "</span></button>";
          }).join('') + "</div>"
        : '') + "</div>";
  }
  function summaryHtml(t, o) {
    o = o || {};
    var pct = Math.min(100, Math.round((t.subtotal / Math.max(1, t.freeShipAt)) * 100));
    return "<aside class='summary' id='summary'>" +
      "<h2 class='summary__h'>" + esc(o.title || 'Order summary') + "</h2>" +
      (o.mini || '') +
      "<div class='summary__b'>" +
        (t.freeShipGap > 0
          ? "<div class='freeship'><p class='freeship__t'>Add <b>" + NK.money(t.freeShipGap) +
              "</b> more for free delivery</p>" +
              "<span class='freeship__rail'><span class='freeship__fill' style='width:" + pct + "%'></span></span></div>"
          : "<div class='freeship'><p class='freeship__t'><b>Free delivery</b> unlocked on this order</p>" +
              "<span class='freeship__rail'><span class='freeship__fill' style='width:100%'></span></span></div>") +
        "<div class='srow'><span>" + t.count + " " + NK.plural(t.count, 'item', 'items') + " (MRP)</span>" +
          "<b>" + NK.money(t.mrp) + "</b></div>" +
        (t.productSaving > 0
          ? "<div class='srow srow--save'><span>Product discount</span><b>&minus;" + NK.money(t.productSaving) + "</b></div>"
          : '') +
        (t.couponAmount > 0
          ? "<div class='srow srow--save'><span>Coupon " + esc(t.coupon ? t.coupon.code : '') + "</span>" +
            "<b>&minus;" + NK.money(t.couponAmount) + "</b></div>"
          : '') +
        "<div class='srow" + (t.shipFree ? ' srow--free' : '') + "'><span>Delivery</span><b>" +
          (t.shipFree ? 'FREE' : NK.money(t.shipping)) + "</b></div>" +
        (t.codFee > 0 ? "<div class='srow'><span>COD handling</span><b>" + NK.money(t.codFee) + "</b></div>" : '') +
        "<div class='srow srow--tot'><span>Total</span><b>" + NK.money(t.total) + "</b></div>" +
        (t.totalSaving > 0
          ? "<p class='summary__note'>" + icon('check') + "<span>You save " + NK.money(t.totalSaving) +
            " on this order</span></p>" : '') +
      "</div>" +
      (o.cta ? "<div class='summary__f'>" + o.cta + "<div class='secure'>" + icon('lock') +
        "<span>Secure checkout · UPI, cards, net banking, COD</span></div></div>" : '') +
    "</aside>";
  }

  X.cart = function () {
    var t = NK.totals();
    var saved = NK.saved();

    if (!t.lines.length) {
      return {
        title: 'Your cart — NUKKAD',
        html: "<div class='wrap'>" +
          "<div class='phead'><h1 class='phead__t dsp'>Your cart</h1></div>" +
          U.state({
            artKind: 'bag', title: 'Nothing in the cart yet',
            body: 'Pick up a tee, a hoodie, or something from this week’s drop and it will show up here.',
            actions: "<a class='btn' href='#/c/men'>Shop men</a>" +
              "<a class='btn btn--ghost' href='#/c/women'>Shop women</a>" +
              "<a class='btn btn--ghost' href='#/new'>New arrivals</a>"
          }) +
          (saved.length ? savedHtml(saved) : '') + "</div>" +
          U.section({ eyebrow: 'Popular now', title: 'Best sellers', html: U.rail(NK.bestSellers(10), { label: 'Best sellers' }) }),
        mounted: function (root) { wireCart(root); }
      };
    }

    var html = "<div class='wrap'>" +
      "<div class='phead'><h1 class='phead__t dsp'>Your cart</h1>" +
        "<p class='phead__c'>" + t.count + " " + NK.plural(t.count, 'item', 'items') + "</p></div>" +
      stepsHtml('cart') +
      "<div class='cart'>" +
        "<div>" +
          "<div class='cbox'>" +
            "<div class='cbox__h'><b>Your items<i>" + t.count + " " +
              NK.plural(t.count, 'piece', 'pieces') + "</i></b>" +
              "<button class='citem__lnk citem__lnk--x' type='button' id='cartClear'>Clear cart</button></div>" +
            "<div id='cartLines'>" + t.lines.map(citemHtml).join('') + "</div>" +
            "<div id='couponHost'>" + couponHtml(t) + "</div>" +
          "</div>" +
          (saved.length ? savedHtml(saved) : '') +
        "</div>" +
        summaryHtml(t, { cta: "<a class='btn btn--lg btn--gold' href='#/checkout/address'>" +
          "Proceed to checkout" + icon('arrowR') + "</a>" }) +
      "</div>" +
    "</div>" +
      U.section({ eyebrow: 'Complete the fit', title: 'You may also like',
        html: U.rail(NK.recommended(10), { label: 'Recommended products' }) });

    return { title: 'Your cart (' + t.count + ') — NUKKAD', html: html,
      mounted: function (root) { wireCart(root); } };
  };

  function savedHtml(list) {
    return "<section class='cbox' id='savedBox' style='margin-top:18px'>" +
      "<div class='cbox__h'><b>Saved for later<i>" + list.length + " " +
        NK.plural(list.length, 'piece', 'pieces') + "</i></b></div>" +
      list.map(function (s) {
        var p = s.product, href = "#/p/" + s.id;
        return "<article class='citem' data-key='" + attr(s.key) + "'>" +
          "<a class='citem__m' href='" + href + "' aria-hidden='true' tabindex='-1'>" +
            "<img" + U.srcPair(p, s.color.hex, 'front', 200) + " alt='' loading='lazy' decoding='async'></a>" +
          "<div class='citem__b'>" +
            "<p class='citem__brand'>" + esc(p.brand) + "</p>" +
            "<a class='citem__n' href='" + href + "'>" + esc(p.name) + "</a>" +
            "<p class='citem__v'><span>Size " + esc(s.size) + "</span>" +
              "<span><i style='background:" + attr(s.color.hex) + "'></i>" + esc(s.color.name) + "</span>" +
              "<span>Qty " + s.qty + "</span></p>" +
            "<p class='citem__p'>" + U.priceBlock(p, s.qty) + "</p>" +
            "<div class='citem__f'>" +
              "<button class='btn btn--sm' type='button' data-sback='" + attr(s.key) + "'>Move to cart</button>" +
              "<button class='citem__lnk citem__lnk--x' type='button' data-sdrop='" + attr(s.key) + "'>Remove</button>" +
            "</div>" +
          "</div></article>";
      }).join('') + "</section>";
  }
  /* navigation helper — app.js owns the router, views just ask it to move */
  function go(hash, force) {
    if (w.NK_APP) w.NK_APP.go(hash, force);
    else w.location.hash = hash || '#/';
  }
  X.go = go;

  /* checkout progress rail — shared by the cart and every checkout step */
  var STEPS = [
    { key: 'cart', name: 'Bag', href: '#/cart' },
    { key: 'address', name: 'Address', href: '#/checkout/address' },
    { key: 'delivery', name: 'Delivery', href: '#/checkout/delivery' },
    { key: 'payment', name: 'Payment', href: '#/checkout/payment' },
    { key: 'done', name: 'Confirmed', href: '' }
  ];
  function stepsHtml(cur) {
    var at = 0;
    STEPS.forEach(function (s, i) { if (s.key === cur) at = i; });
    var out = "<nav class='steps' aria-label='Checkout progress'>";
    STEPS.forEach(function (s, i) {
      var done = i < at, on = i === at;
      var cls = 'step' + (done ? ' is-done' : '') + (on ? ' is-on' : '');
      var dot = done ? icon('check') : String(i + 1);
      var inner = "<span class='step__d'>" + dot + "</span><span class='step__n'>" + esc(s.name) + "</span>";
      out += done && s.href
        ? "<a class='" + cls + "' href='" + s.href + "'>" + inner + "</a>"
        : "<span class='" + cls + "'" + (on ? " aria-current='step'" : '') + ">" + inner + "</span>";
      if (i < STEPS.length - 1) out += "<span class='step__bar'></span>";
    });
    return out + "</nav>";
  }

  /* redraw the cart in place — cheaper and less jarring than a full re-route */
  function repaintCart(root) {
    var t = NK.totals();
    if (!t.lines.length) { go('#/cart', true); return; }
    var lines = qs('#cartLines', root), host = qs('#couponHost', root), sum = qs('#summary', root);
    if (lines) lines.innerHTML = t.lines.map(citemHtml).join('');
    if (host) host.innerHTML = couponHtml(t);
    if (sum) sum.outerHTML = summaryHtml(t, { cta: "<a class='btn btn--lg btn--gold' href='#/checkout/address'>" +
      "Proceed to checkout" + icon('arrowR') + "</a>" });
    var count = qs('.cbox__h b i', root);
    if (count) count.textContent = t.count + ' ' + NK.plural(t.count, 'piece', 'pieces');
    U.hydrate(root);
    U.refreshBadges();
  }

  function wireCart(root) {
    /* saved-for-later and the empty state both live outside #cartLines,
       so everything is delegated from the view root. */
    U.on(root, 'click', function (e) {
      var b = e.target.closest('[data-cqty],[data-cremove],[data-csave],[data-cwish],[data-sback],[data-sdrop],#cartClear');
      if (!b) return;

      if (b.id === 'cartClear') {
        U.confirm({
          title: 'Empty your cart?',
          body: 'All ' + NK.totals().count + ' pieces will be removed. This cannot be undone.',
          confirm: 'Yes, empty it', cancel: 'Keep them', danger: true
        }).then(function (yes) {
          if (!yes) return;
          NK.cartClear(); U.info('Cart emptied.'); go('#/cart', true);
        });
        return;
      }

      if (b.hasAttribute('data-cqty')) {
        var key = b.getAttribute('data-cqty');
        var line = NK.totals().lines.filter(function (l) { return l.key === key; })[0];
        if (!line) return;
        var next = line.qty + (parseInt(b.getAttribute('data-step'), 10) || 1);
        if (next < 1) {
          U.confirm({ title: 'Remove this item?', body: line.product.name + ' will be taken out of your cart.',
            confirm: 'Remove', danger: true }).then(function (yes) {
            if (yes) { NK.cartRemove(key); U.info('Removed from cart.'); repaintCart(root); }
          });
          return;
        }
        var r = NK.cartQty(key, next);
        if (!r.ok) { U.err(r.msg || 'That is all we have in stock.'); return; }
        repaintCart(root);
        return;
      }

      var row = b.closest('.citem'), rkey = row ? row.getAttribute('data-key') : '';

      if (b.hasAttribute('data-cremove')) {
        var rid = b.getAttribute('data-cremove') || rkey;
        var l2 = NK.totals().lines.filter(function (x) { return x.key === rid; })[0];
        U.confirm({ title: 'Remove this item?',
          body: (l2 ? l2.product.name : 'This piece') + ' will be taken out of your cart.',
          confirm: 'Remove', danger: true }).then(function (yes) {
          if (!yes) return;
          if (row) row.classList.add('is-going');
          setTimeout(function () {
            NK.cartRemove(rid); U.info('Removed from cart.'); repaintCart(root);
          }, U.reduced() ? 0 : 220);
        });
        return;
      }

      if (b.hasAttribute('data-csave')) {
        NK.saveForLater(b.getAttribute('data-csave')); U.ok('Saved for later.'); go('#/cart', true); return;
      }
      if (b.hasAttribute('data-cwish')) {
        var wkey = b.getAttribute('data-cwish');
        var wline = NK.totals().lines.filter(function (x) { return x.key === wkey; })[0];
        if (wline && !NK.inWish(wline.id)) NK.wishToggle(wline.id);
        NK.cartRemove(wkey);
        U.ok('Moved to your wishlist.'); go('#/cart', true); return;
      }
      if (b.hasAttribute('data-sback')) {
        var back = NK.savedToCart(b.getAttribute('data-sback'));
        U.fromResult(back, 'Back in your cart.');
        go('#/cart', true); return;
      }
      if (b.hasAttribute('data-sdrop')) {
        NK.savedRemove(b.getAttribute('data-sdrop'));
        U.info('Removed from saved items.'); go('#/cart', true); return;
      }
    });

    wireCoupons(root, function () { repaintCart(root); });
  }

  /* coupon form + the offer list — reused by the payment step */
  function wireCoupons(root, after) {
    function done(r, good) {
      if (r && r.ok === false) { U.err(r.msg); return; }
      if (good) U.ok(good);
      if (after) after();
    }
    U.on(root, 'submit', function (e) {
      if (!e.target.closest('#cpnForm')) return;
      e.preventDefault();
      var inp = qs('#cpnInp', root), code = inp ? inp.value.trim() : '';
      if (!code) { U.err('Enter a coupon code first.'); if (inp) inp.focus(); return; }
      var r = NK.applyCoupon(code);
      if (!r.ok) { U.err(r.msg); if (inp) inp.focus(); return; }
      done(r, r.msg);
    });
    U.on(root, 'click', function (e) {
      var off = e.target.closest('#cpnOff');
      if (off) { var had = NK.removeCoupon(); U.info((had || 'Coupon') + ' removed.'); if (after) after(); return; }
      var use = e.target.closest('[data-cpnuse]');
      if (!use || use.disabled) return;
      var r2 = NK.applyCoupon(use.getAttribute('data-cpnuse'));
      done(r2, r2.ok ? r2.msg : '');
    });
  }
  /* ---------- wishlist ----------------------------------------------------- */
  X.wishlist = function () {
    var list = NK.wishlist();

    if (!list.length) {
      return {
        title: 'Your wishlist — NUKKAD',
        desc: 'Save the pieces you like and come back to them later.',
        html: "<div class='wrap'>" +
          "<div class='phead'><h1 class='phead__t dsp'>Your wishlist</h1></div>" +
          U.state({
            artKind: 'heart', title: 'No saved pieces yet',
            body: 'Tap the heart on any product and it will wait for you here — across refreshes, on every device you use this browser on.',
            actions: "<a class='btn' href='#/new'>Browse new arrivals</a>" +
              "<a class='btn btn--ghost' href='#/trending'>See what is trending</a>"
          }) + "</div>" +
          U.section({ eyebrow: 'A place to start', title: 'Best sellers',
            html: U.rail(NK.bestSellers(10), { label: 'Best sellers' }) })
      };
    }

    var inStock = list.filter(function (p) { return p.totalStock > 0; });
    var html = "<div class='wrap'>" +
      "<div class='phead'><h1 class='phead__t dsp'>Your wishlist</h1>" +
        "<p class='phead__c'>" + list.length + " " + NK.plural(list.length, 'piece', 'pieces') + " saved</p>" +
        "<div class='phead__acts'>" +
          (inStock.length ? "<button class='btn btn--sm' type='button' id='wishAll'>Add all in-stock to cart</button>" : '') +
          "<button class='btn btn--ghost btn--sm' type='button' id='wishClear'>Clear wishlist</button>" +
        "</div></div>" +
      "<div id='wishGrid'>" + U.grid(list, { cols: 4 }) + "</div>" +
    "</div>" +
      U.section({ eyebrow: 'Because you saved these', title: 'You may also like',
        html: U.rail(NK.recommended(10), { label: 'Recommended products' }) });

    return {
      title: 'Your wishlist (' + list.length + ') — NUKKAD',
      desc: 'The pieces you have saved on NUKKAD.',
      html: html,
      mounted: function (root) { wireWishlist(root); }
    };
  };

  function wireWishlist(root) {
    U.on(root, 'click', function (e) {
      var all = e.target.closest('#wishAll');
      if (all) {
        var stock = NK.wishlist().filter(function (p) { return p.totalStock > 0; });
        var added = 0;
        stock.forEach(function (p) {
          var r = NK.cartAdd(p.id, NK.firstAvailableSize(p), p.colors[0].key, 1);
          if (r.ok) { added++; NK.wishRemove(p.id); }
        });
        if (!added) U.err('Nothing could be added — those sizes just sold out.');
        else U.ok(added + ' ' + NK.plural(added, 'piece', 'pieces') + ' moved to your cart.');
        go('#/wishlist', true);
        return;
      }
      var clr = e.target.closest('#wishClear');
      if (clr) {
        U.confirm({
          title: 'Clear your wishlist?',
          body: 'All ' + NK.wishCount() + ' saved pieces will be removed.',
          confirm: 'Clear it', cancel: 'Keep them', danger: true
        }).then(function (yes) {
          if (!yes) return;
          NK.wishlist().forEach(function (p) { NK.wishRemove(p.id); });
          U.info('Wishlist cleared.');
          go('#/wishlist', true);
        });
      }
    });
    /* The heart on a card toggles wishlist membership, so a removal on this
       page should make the card leave rather than sit there un-hearted.
       Subscribed once for the life of the page, not once per mount. */
    if (!wireWishlist.sub) {
      wireWishlist.sub = true;
      NK.on('wish', function (d2) {
        if (!d2 || d2.on !== false) return;
        if (!/^#\/wishlist/.test(w.location.hash)) return;
        go('#/wishlist', true);
      });
    }
  }

  /* ---------- compare ------------------------------------------------------ */
  X.compare = function () {
    var list = NK.compare();

    if (list.length < 1) {
      return {
        title: 'Compare products — NUKKAD',
        html: "<div class='wrap'>" +
          "<div class='phead'><h1 class='phead__t dsp'>Compare</h1></div>" +
          U.state({
            artKind: 'box', title: 'Nothing to compare yet',
            body: 'Add up to four pieces from any product page and their fabric, fit, price and ratings will line up side by side.',
            actions: "<a class='btn' href='#/c/men/t-shirts'>Compare tees</a>" +
              "<a class='btn btn--ghost' href='#/c/men/hoodies'>Compare hoodies</a>"
          }) + "</div>"
      };
    }

    var rows = [
      { label: 'Price', get: function (p) { return "<b class='price'>" + NK.money(p.price) + "</b>" +
        (p.mrp > p.price ? " <span class='price--was'>" + NK.money(p.mrp) + "</span>" : ''); } },
      { label: 'Discount', get: function (p) { return p.discount ? p.discount + '% off' : '—'; } },
      { label: 'Rating', get: function (p) { return U.stars(p.rating) +
        "<div class='cpn__exp' style='justify-content:center'>" + p.rating.toFixed(1) +
        ' · ' + p.ratingCount + ' ' + NK.plural(p.ratingCount, 'review', 'reviews') + "</div>"; } },
      { label: 'Fabric', get: function (p) { return esc(p.fabric); } },
      { label: 'Fit', get: function (p) { return esc(p.fit); } },
      { label: 'Print', get: function (p) { return esc(p.print); } },
      { label: 'Sizes', get: function (p) { return p.sizes.filter(function (s) { return p.stock[s] > 0; }).join(', ') || 'Sold out'; } },
      { label: 'Colours', get: function (p) { return p.colors.map(function (c) {
        return "<i class='cmptable__dot' style='background:" + attr(c.hex) + "'></i>" +
          "<span class='sr-only'>" + esc(c.name) + "</span>"; }).join(''); } },
      { label: 'Stock', get: function (p) {
        var lvl = p.totalStock === 0 ? 'out' : p.totalStock < 12 ? 'low' : 'ok';
        return "<span class='stock stock--" + lvl + "'>" +
          (lvl === 'out' ? 'Sold out' : lvl === 'low' ? 'Only ' + p.totalStock + ' left' : 'In stock') + "</span>"; } },
      { label: 'Category', get: function (p) { return esc(p.catName + ' · ' + p.subName); } }
    ];

    var html = "<div class='wrap'>" +
      "<div class='phead'><h1 class='phead__t dsp'>Compare</h1>" +
        "<p class='phead__c'>" + list.length + " of 4 " + NK.plural(list.length, 'piece', 'pieces') + "</p>" +
        "<div class='phead__acts'><button class='btn btn--ghost btn--sm' type='button' id='cmpClear'>Clear all</button>" +
          "<a class='btn btn--ghost btn--sm' href='#/new'>Add another</a></div></div>" +
      "<div class='cmpwrap'><table class='cmptable'><caption class='sr-only'>Product comparison</caption><thead><tr>" +
        "<th scope='col'><span class='sr-only'>Attribute</span></th>" +
        list.map(function (p) {
          return "<th scope='col' class='cmptable__p'>" +
            "<a href='#/p/" + p.id + "'><img" + U.srcPair(p, p.colors[0].hex, 'front', 200, true) +
              " alt='" + attr(U.altText(p)) + "' width='78' height='104' loading='lazy'>" +
            "<b>" + esc(p.name) + "</b></a>" +
            "<button class='cmptable__x' type='button' data-cmpdrop='" + attr(p.id) + "'" +
              " aria-label='Remove " + attr(p.name) + " from compare'>Remove</button>" +
            "</th>";
        }).join('') + "</tr></thead><tbody>" +
        rows.map(function (r) {
          return "<tr><th scope='row'>" + esc(r.label) + "</th>" +
            list.map(function (p) { return "<td>" + r.get(p) + "</td>"; }).join('') + "</tr>";
        }).join('') +
        "<tr><th scope='row'>Buy</th>" + list.map(function (p) {
          return "<td><button class='btn btn--sm btn--pri' type='button' data-add='" + attr(p.id) + "'" +
            (p.totalStock ? '' : ' disabled') + ">" +
            (p.totalStock ? 'Add to cart' : 'Sold out') + "</button></td>";
        }).join('') + "</tr>" +
      "</tbody></table></div></div>";

    return {
      title: 'Compare products — NUKKAD',
      html: html,
      mounted: function (root) {
        U.on(root, 'click', function (e) {
          var x = e.target.closest('[data-cmpdrop]');
          if (x) { NK.compareToggle(x.getAttribute('data-cmpdrop')); U.info('Removed from compare.'); go('#/compare', true); return; }
          var c = e.target.closest('#cmpClear');
          if (c) { NK.compareClear(); U.info('Compare cleared.'); go('#/compare', true); }
        });
      }
    };
  };
  /* ---------- static info pages -------------------------------------------- */
  var INFO = {
    about: {
      title: 'About NUKKAD',
      lede: 'Nukkad is the Hindi word for the street corner — the spot where everyone in the neighbourhood ends up. That is the shop we wanted to build.',
      body: [
        ['Where we started', 'We started in 2021 printing forty tees a week out of a workshop in Ludhiana, because the graphics we wanted to wear were either imported and expensive or badly printed and cheap. The first run sold out to friends. The second one did not, which taught us more.'],
        ['How we make things', 'Every piece is cut and stitched in India, mostly in Tiruppur and Ludhiana, at units we visit. Our jerseys are 180–240 GSM combed cotton and our fleece is brushed on the inside, because a hoodie that pills after three washes is not cheaper, it is just shorter.'],
        ['What we will not do', 'We do not run permanent sales with invented crossed-out prices, we do not use size charts that flatter, and we do not photograph a garment in a size that no one buys. Our MRPs are the prices we would charge without a promotion.'],
        ['Where we are going', 'Better fabric at the same price, a returns process that takes days rather than weeks, and a size guide honest enough that you order once.']
      ]
    },
    contact: {
      title: 'Contact us',
      lede: 'Real people, ordinary working hours, and no phone tree.',
      body: [
        ['Customer care', 'care@nukkad.example — we answer within one working day, usually the same afternoon. Include your order ID and we can skip a round of questions.'],
        ['Phone', '1800-000-0000, Monday to Saturday, 10am to 7pm IST. Sunday is quiet for us too.'],
        ['Wholesale and campus orders', 'bulk@nukkad.example for anything over 25 pieces. Custom prints and college merch go through the same address.'],
        ['Registered office', 'NUKKAD Apparel Pvt. Ltd., 3rd Floor, Corner House, Sector 17, Chandigarh 160017.']
      ]
    },
    shipping: {
      title: 'Shipping',
      lede: 'Free over ' + NK.money(NK.FREE_SHIP) + '. Flat ' + NK.money(NK.SHIP_FEE) + ' under it.',
      body: [
        ['Dispatch', 'Orders placed before 4pm on a working day leave the warehouse the same evening. After that, the next working day.'],
        ['Delivery windows', 'Metros take 2–3 working days. Most other pin codes take 3–5. A handful of remote pin codes take up to 7, and the delivery checker on each product page will tell you which one you are before you pay.'],
        ['Cash on delivery', 'Available on most pin codes for a ' + NK.money(NK.COD_FEE) + ' handling fee. Orders above ' + NK.money(15000) + ' are prepaid only.'],
        ['Tracking', 'You get an AWB number by email and SMS the moment the parcel is scanned. Track it any time from the Track order link in the header — no login needed, just the order ID.']
      ]
    },
    returns: {
      title: 'Returns and exchanges',
      lede: 'Fifteen days, tags on, no explanation required.',
      body: [
        ['The window', 'Fifteen days from delivery. Raise the request from My orders, or email care@nukkad.example with your order ID.'],
        ['Condition', 'Unworn and unwashed with the tags still attached. Try it on the way you would in a store. Innerwear and socks cannot be returned once opened, for reasons we hope are obvious.'],
        ['Pickup', 'We arrange a reverse pickup on serviceable pin codes at no cost. Where the courier cannot reach, we refund the self-shipping charge up to ' + NK.money(120) + '.'],
        ['Refunds', 'Back to the original payment method within 5–7 working days of the parcel reaching us. COD orders are refunded to a bank account you nominate.'],
        ['Exchanges', 'Size exchanges are free once per order. The replacement ships as soon as the original is picked up, not after it lands.']
      ]
    },
    privacy: {
      title: 'Privacy',
      lede: 'This is a demonstration storefront. Nothing you type leaves your browser.',
      body: [
        ['What is stored', 'Your cart, wishlist, addresses, orders and account details are written to this browser’s local storage under a single key. There is no server, no analytics script and no third-party tag on this site.'],
        ['What that means', 'Clearing your browser data clears everything, and nothing syncs to another device. Card numbers typed into the payment step are validated for format and then discarded — they are never stored, transmitted or charged.'],
        ['A live store would differ', 'A real storefront would need a payment gateway, a fulfilment partner and an email provider, each with their own handling of your data. This one has none of them.']
      ]
    },
    terms: {
      title: 'Terms',
      lede: 'The short version, because the long version helps nobody.',
      body: [
        ['This is a demonstration', 'NUKKAD is an original demonstration storefront built to show a complete shopping flow. No order placed here is fulfilled, no payment is taken, and the brand, products, prices, reviews and stock levels are invented.'],
        ['Pricing', 'Prices shown include GST. Where an MRP is crossed out it is the price the piece would carry without the current promotion.'],
        ['Content', 'The name, wordmark, product illustrations, copy and code on this site are original work created for this project.']
      ]
    },
    sizeguide: {
      title: 'Size guide',
      lede: 'Measure a garment you already like, then match it to the table. It beats measuring yourself.',
      body: [
        ['How to measure', 'Lay the garment flat. Chest is armpit to armpit, doubled. Length is the high point of the shoulder straight down to the hem. Compare those two numbers to the table on any product page.'],
        ['Regular fit', 'Cut close to the body through the chest with a straight hem. Take your usual size.'],
        ['Oversized fit', 'Dropped shoulders and a wider body — roughly two sizes of extra room built in. Take your usual size for the intended look, or one down if you want it closer.'],
        ['Between sizes', 'Size up on hoodies and sweatshirts, stay on your size for tees. Cotton loses about half a centimetre in the first wash and then stops.']
      ]
    },
    faq: {
      title: 'Help centre',
      lede: 'The questions we get most, answered without the marketing voice.',
      body: [
        ['Do I need an account to order?', 'No. You can check out as a guest. An account only exists so your orders, addresses and wishlist survive a refresh — which, on this demo, they do either way.'],
        ['How do I track my order?', 'Track order in the header takes any order ID, logged in or not. The status advances on its own as the order ages.'],
        ['A coupon will not apply.', 'Check the minimum order value and the expiry date on the offer card. Only one coupon applies per order, and codes that have hit their usage limit stop working.'],
        ['Is my size in stock?', 'The size selector greys out anything sold out, and a warning appears under it once fewer than five pieces are left in your size.'],
        ['Something is broken.', 'Refresh first — the whole storefront rebuilds from local storage. If it persists, Account settings has a reset that clears the stored state and starts over.']
      ]
    }
  };

  X.info = function (slug, q) {
    var page = INFO[slug];
    if (!page) {
      return {
        title: 'Page not found — NUKKAD',
        html: "<div class='wrap'>" + U.state({
          type: 'warn', artKind: 'warn', title: 'We could not find that page',
          body: 'The link may be old, or the address may have a typo in it. Everything below still works.',
          actions: "<a class='btn' href='#/'>Back to home</a>" +
            "<a class='btn btn--ghost' href='#/info/faq'>Help centre</a>"
        }) + "</div>"
      };
    }
    var isGuide = slug === 'sizeguide';
    return {
      title: page.title + ' — NUKKAD',
      desc: page.lede,
      html: "<div class='wrap'>" +
        "<nav class='crumb' aria-label='Breadcrumb'><a href='#/'>Home</a>" + icon('chev') +
          "<span aria-current='page'>" + esc(page.title) + "</span></nav>" +
        "<div class='phead'><h1 class='phead__t dsp'>" + esc(page.title) + "</h1>" +
          "<p class='phead__d'>" + esc(page.lede) + "</p>" +
          (isGuide ? "<div class='phead__acts'><button class='btn btn--sm' type='button' data-sizeguide='tee'>" +
            "Open the tee size chart</button><button class='btn btn--ghost btn--sm' type='button' " +
            "data-sizeguide='hoodie'>Hoodie chart</button></div>" : '') +
        "</div>" +
        "<div class='prose'>" + page.body.map(function (b) {
          return "<h2>" + esc(b[0]) + "</h2><p>" + esc(b[1]) + "</p>";
        }).join('') + "</div>" +
        "<div class='phead__acts' style='padding-bottom:56px'>" +
          "<a class='btn btn--ghost btn--sm' href='#/info/faq'>Help centre</a>" +
          "<a class='btn btn--ghost btn--sm' href='#/info/shipping'>Shipping</a>" +
          "<a class='btn btn--ghost btn--sm' href='#/info/returns'>Returns</a>" +
          "<a class='btn btn--ghost btn--sm' href='#/info/contact'>Contact us</a>" +
        "</div></div>"
    };
  };

  X.notFound = function () {
    return {
      title: 'Page not found — NUKKAD',
      html: "<div class='wrap'>" + U.state({
        type: 'warn', artKind: 'warn', title: '404 — nothing at that address',
        body: 'That page does not exist. It may have been a product that sold out, or a link that was typed by hand.',
        actions: "<a class='btn' href='#/'>Back to home</a>" +
          "<a class='btn btn--ghost' href='#/new'>New arrivals</a>" +
          "<a class='btn btn--ghost' href='#/c/men'>Shop men</a>"
      }) + "</div>" +
        U.section({ eyebrow: 'While you are here', title: 'Trending now',
          html: U.rail(NK.trending(10), { label: 'Trending products' }) })
    };
  };
  /*NUKKAD_VIEWS_NEXT*/

  /* shared with account.js — the checkout reuses the cart's chrome verbatim
     rather than growing a second, slightly-different copy of it */
  X.stepsHtml = stepsHtml;
  X.summaryHtml = summaryHtml;
  X.couponHtml = couponHtml;
  X.wireCoupons = wireCoupons;
  X.citemHtml = citemHtml;

  w.NK_VIEWS = X;
})(window, document);
