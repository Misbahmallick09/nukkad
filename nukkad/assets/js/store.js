/* ==========================================================================
   NUKKAD — store: persistence, cart, wishlist, orders, auth, query engine
   Everything the shopper does survives a refresh (localStorage), and every
   read goes through one API so views never touch storage directly.
   ========================================================================== */
(function (w) {
  'use strict';

  var D = w.NK_DATA;
  var KEY = 'nukkad.v1';
  var listeners = {};

  /* ---------- storage (degrades gracefully if blocked) ------------------ */
  var memory = {};
  var canStore = (function () {
    try { w.localStorage.setItem('__nk', '1'); w.localStorage.removeItem('__nk'); return true; }
    catch (e) { return false; }
  })();
  function readAll() {
    if (!canStore) return memory;
    try { return JSON.parse(w.localStorage.getItem(KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function writeAll(obj) {
    if (!canStore) { memory = obj; return; }
    try { w.localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) { /* quota */ }
  }
  var S = readAll();
  function commit() { writeAll(S); }
  function def(k, v) { if (S[k] === undefined || S[k] === null) S[k] = v; }
  def('cart', []); def('saved', []); def('wish', []); def('orders', []);
  def('user', null); def('addresses', []); def('seen', []); def('searches', []);
  def('coupon', null); def('compare', []); def('reviews', {}); def('usedCoupons', {});
  def('draft', { addressId: '', ship: '' });
  def('announceHidden', false);
  commit();

  /* ---------- events ---------------------------------------------------- */
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); return fn; }
  function emit(evt, data) {
    (listeners[evt] || []).forEach(function (fn) { try { fn(data); } catch (e) { console.warn(e); } });
    if (evt !== '*') emit('*', { type: evt, data: data });
  }

  /* ---------- formatting ------------------------------------------------- */
  function money(n) {
    n = Math.round(Number(n) || 0);
    return '₹' + n.toLocaleString('en-IN');
  }
  function plural(n, one, many) { return n === 1 ? one : (many || one + 's'); }
  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtDateTime(ts) {
    return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  /* ---------- product index --------------------------------------------- */
  var BY_ID = {};
  D.PRODUCTS.forEach(function (p) { BY_ID[p.id] = p; });
  function byId(id) { return BY_ID[id] || null; }
  function all() { return D.PRODUCTS; }
  function catBySlug(s) {
    for (var i = 0; i < D.TAXONOMY.length; i++) if (D.TAXONOMY[i].slug === s) return D.TAXONOMY[i];
    return null;
  }
  function subBySlug(catSlug, subSlug) {
    var c = catBySlug(catSlug); if (!c) return null;
    for (var i = 0; i < c.subs.length; i++) if (c.subs[i].slug === subSlug) return c.subs[i];
    return null;
  }
  function haystack(p) {
    return (p.name + ' ' + p.brand + ' ' + p.catName + ' ' + p.subName + ' ' + p.kind + ' ' +
      p.fabric + ' ' + p.fit + ' ' + p.colors.map(function (c) { return c.name + ' ' + c.fam; }).join(' ')).toLowerCase();
  }
  D.PRODUCTS.forEach(function (p) { p._hay = haystack(p); });

  function tokens(q) {
    return String(q || '').toLowerCase().split(/[^a-z0-9]+/).filter(function (t) { return t.length > 1; });
  }
  function matches(p, toks) {
    for (var i = 0; i < toks.length; i++) if (p._hay.indexOf(toks[i]) === -1) return false;
    return true;
  }
  function score(p, toks) {
    var n = p.name.toLowerCase(), s = 0;
    toks.forEach(function (t) {
      if (n.indexOf(t) === 0) s += 8;
      else if (n.indexOf(t) > -1) s += 5;
      if (p.subName.toLowerCase().indexOf(t) > -1) s += 4;
      if (p.catName.toLowerCase().indexOf(t) > -1) s += 2;
    });
    return s + (p.isBest ? 2 : 0) + Math.min(3, p.popularity / 3500) + p.rating / 2;
  }
  function search(q, limit) {
    var toks = tokens(q);
    if (!toks.length) return [];
    var out = D.PRODUCTS.filter(function (p) { return matches(p, toks); });
    out.sort(function (a, b) { return score(b, toks) - score(a, toks); });
    return limit ? out.slice(0, limit) : out;
  }
  function suggestions(q) {
    var toks = tokens(q);
    if (!toks.length) return { cats: [], products: [], terms: [] };
    var cats = [];
    D.TAXONOMY.forEach(function (c) {
      if (matches({ _hay: (c.name + ' ' + c.tagline).toLowerCase() }, toks))
        cats.push({ label: c.name, href: '#/c/' + c.slug, note: 'Category' });
      c.subs.forEach(function (s) {
        if (matches({ _hay: (s.name + ' ' + c.name).toLowerCase() }, toks))
          cats.push({ label: s.name, href: '#/c/' + c.slug + '/' + s.slug, note: c.name });
      });
    });
    var prods = search(q, 6);
    var terms = [];
    ['oversized t-shirts', 'hoodies', 'baggy jeans', 'co-ords', 'caps', 'graphic tees', 'jackets', 'watches']
      .forEach(function (t) { if (toks.some(function (k) { return t.indexOf(k) > -1; })) terms.push(t); });
    return { cats: cats.slice(0, 5), products: prods, terms: terms.slice(0, 4) };
  }

  /* ---------- query engine: filters, facets, sorting -------------------- */
  var SORTS = [
    { key: 'recommended', label: 'Recommended' },
    { key: 'popular',     label: 'Popularity' },
    { key: 'newest',      label: 'What’s new' },
    { key: 'plow',        label: 'Price: low to high' },
    { key: 'phigh',       label: 'Price: high to low' },
    { key: 'rating',      label: 'Customer rating' },
    { key: 'discount',    label: 'Biggest discount' }
  ];

  var TESTS = {
    cat:      function (p, v) { return !v || p.cat === v; },
    subs:     function (p, v) { return !v.length || v.indexOf(p.sub) > -1; },
    price:    function (p, v) { return p.price >= v[0] && p.price <= v[1]; },
    sizes:    function (p, v) { return !v.length || v.some(function (s) { return p.stock[s] > 0; }); },
    colors:   function (p, v) { return !v.length || p.colors.some(function (c) { return v.indexOf(c.fam) > -1; }); },
    rating:   function (p, v) { return !v || p.rating >= v; },
    discount: function (p, v) { return !v || p.discount >= v; },
    brands:   function (p, v) { return !v.length || v.indexOf(p.brand) > -1; },
    inStock:  function (p, v) { return !v || p.totalStock > 0; },
    isNew:    function (p, v) { return !v || p.isNew; },
    q:        function (p, v) { return !v || matches(p, tokens(v)); }
  };

  function blank() {
    return { cat: '', subs: [], price: null, sizes: [], colors: [], rating: 0,
      discount: 0, brands: [], inStock: false, isNew: false, q: '', sort: 'recommended' };
  }
  function normalise(f) {
    var o = blank(), k;
    for (k in o) if (f && f[k] !== undefined && f[k] !== null) o[k] = f[k];
    if (!o.price) o.price = [PRICE_MIN, PRICE_MAX];
    return o;
  }
  var PRICE_MIN = 0, PRICE_MAX = 0;
  D.PRODUCTS.forEach(function (p) { if (p.price > PRICE_MAX) PRICE_MAX = p.price; });
  PRICE_MAX = Math.ceil(PRICE_MAX / 100) * 100;

  function keep(p, f, skip) {
    for (var k in TESTS) {
      if (k === skip) continue;
      if (!TESTS[k](p, f[k])) return false;
    }
    return true;
  }
  function sortBy(list, key) {
    var a = list.slice();
    switch (key) {
      case 'popular':  a.sort(function (x, y) { return y.popularity - x.popularity; }); break;
      case 'newest':   a.sort(function (x, y) { return y.added - x.added; }); break;
      case 'plow':     a.sort(function (x, y) { return x.price - y.price; }); break;
      case 'phigh':    a.sort(function (x, y) { return y.price - x.price; }); break;
      case 'rating':   a.sort(function (x, y) { return (y.rating - x.rating) || (y.ratingCount - x.ratingCount); }); break;
      case 'discount': a.sort(function (x, y) { return y.discount - x.discount; }); break;
      default:
        a.sort(function (x, y) {
          return (rank(y) - rank(x));
        });
    }
    return a;
  }
  function rank(p) {
    return p.popularity / 1200 + p.rating * 2.2 + (p.isBest ? 6 : 0) + (p.isNew ? 3 : 0) +
      p.discount / 14 + (p.totalStock > 0 ? 2 : -12);
  }

  function tally(list, get) {
    var m = {};
    list.forEach(function (p) {
      var vals = get(p);
      (vals.length !== undefined && typeof vals !== 'string' ? vals : [vals]).forEach(function (v) {
        if (v === undefined || v === null || v === '') return;
        m[v] = (m[v] || 0) + 1;
      });
    });
    return m;
  }

  function query(filters) {
    var f = normalise(filters);
    var base = D.PRODUCTS.filter(function (p) { return TESTS.cat(p, f.cat) && TESTS.q(p, f.q); });
    var items = base.filter(function (p) { return keep(p, f); });

    var facets = {
      subs:   tally(base.filter(function (p) { return keep(p, f, 'subs'); }),   function (p) { return p.sub; }),
      sizes:  tally(base.filter(function (p) { return keep(p, f, 'sizes'); }),  function (p) { return p.sizes.filter(function (s) { return p.stock[s] > 0; }); }),
      colors: tally(base.filter(function (p) { return keep(p, f, 'colors'); }), function (p) {
        var seenFam = {}; return p.colors.map(function (c) { return c.fam; }).filter(function (x) { return seenFam[x] ? false : (seenFam[x] = 1); });
      }),
      brands: tally(base.filter(function (p) { return keep(p, f, 'brands'); }), function (p) { return p.brand; }),
      rating: {}, discount: {},
      inStock: base.filter(function (p) { return keep(p, f, 'inStock') && p.totalStock > 0; }).length,
      isNew:   base.filter(function (p) { return keep(p, f, 'isNew') && p.isNew; }).length
    };
    [4, 3.5, 3].forEach(function (r) {
      facets.rating[r] = base.filter(function (p) { return keep(p, f, 'rating') && p.rating >= r; }).length;
    });
    [60, 50, 40, 30, 20].forEach(function (d) {
      facets.discount[d] = base.filter(function (p) { return keep(p, f, 'discount') && p.discount >= d; }).length;
    });

    return { items: sortBy(items, f.sort), total: items.length, facets: facets, filters: f, baseTotal: base.length };
  }

  function activeChips(f) {
    var out = [];
    (f.subs || []).forEach(function (s) {
      var sub = subBySlug(f.cat, s);
      out.push({ dim: 'subs', val: s, label: sub ? sub.name : s });
    });
    (f.sizes || []).forEach(function (s) { out.push({ dim: 'sizes', val: s, label: 'Size ' + s }); });
    (f.colors || []).forEach(function (c) { out.push({ dim: 'colors', val: c, label: c }); });
    (f.brands || []).forEach(function (b) { out.push({ dim: 'brands', val: b, label: b }); });
    if (f.rating) out.push({ dim: 'rating', val: f.rating, label: f.rating + '★ & above' });
    if (f.discount) out.push({ dim: 'discount', val: f.discount, label: f.discount + '% off or more' });
    if (f.inStock) out.push({ dim: 'inStock', val: true, label: 'In stock only' });
    if (f.isNew) out.push({ dim: 'isNew', val: true, label: 'New arrivals' });
    if (f.price && (f.price[0] > PRICE_MIN || f.price[1] < PRICE_MAX))
      out.push({ dim: 'price', val: null, label: money(f.price[0]) + ' – ' + money(f.price[1]) });
    return out;
  }

  /* ---------- curated rails --------------------------------------------- */
  function take(list, n) { return list.slice(0, n || 12); }
  function newArrivals(n, cat) {
    return take(sortBy(D.PRODUCTS.filter(function (p) { return p.isNew && (!cat || p.cat === cat); }), 'newest'), n);
  }
  function bestSellers(n, cat) {
    return take(sortBy(D.PRODUCTS.filter(function (p) { return p.isBest && (!cat || p.cat === cat); }), 'popular'), n);
  }
  function trending(n, cat) {
    return take(sortBy(D.PRODUCTS.filter(function (p) { return (!cat || p.cat === cat) && p.rating >= 4 && p.totalStock > 0; }), 'popular'), n);
  }
  function deals(n) {
    return take(sortBy(D.PRODUCTS.filter(function (p) { return p.discount >= 45 && p.totalStock > 0; }), 'discount'), n);
  }
  function related(p, n) {
    if (!p) return [];
    var pool = D.PRODUCTS.filter(function (x) { return x.id !== p.id && x.cat === p.cat; });
    pool.forEach(function (x) {
      x._rel = (x.sub === p.sub ? 40 : 0) + (x.kind === p.kind ? 12 : 0) +
        (Math.abs(x.price - p.price) < 400 ? 14 : 0) +
        x.colors.filter(function (c) { return p.colors.some(function (y) { return y.fam === c.fam; }); }).length * 4 +
        rank(x) / 4;
    });
    pool.sort(function (a, b) { return b._rel - a._rel; });
    return take(pool, n || 10);
  }
  function recommended(n) {
    var seen = (S.seen || []).map(byId).filter(Boolean);
    var wish = (S.wish || []).map(byId).filter(Boolean);
    var basis = seen.concat(wish);
    if (!basis.length) return take(sortBy(D.PRODUCTS.filter(function (p) { return p.totalStock > 0; }), 'recommended'), n);
    var scoreMap = {};
    basis.forEach(function (b) {
      related(b, 14).forEach(function (r) { scoreMap[r.id] = (scoreMap[r.id] || 0) + r._rel; });
    });
    var skip = {};
    basis.forEach(function (b) { skip[b.id] = 1; });
    (S.cart || []).forEach(function (c) { skip[c.id] = 1; });
    return Object.keys(scoreMap).filter(function (id) { return !skip[id]; })
      .sort(function (a, b) { return scoreMap[b] - scoreMap[a]; })
      .slice(0, n || 10).map(byId);
  }

  /* ---------- cart -------------------------------------------------------- */
  var FREE_SHIP = 999, SHIP_FEE = 79, COD_FEE = 39;

  function lineKey(id, size, color) { return id + '::' + size + '::' + color; }
  function stockFor(p, size) { return p ? (p.stock[size] || 0) : 0; }

  function cart() {
    return (S.cart || []).map(function (l) {
      var p = byId(l.id);
      if (!p) return null;
      var col = p.colors.filter(function (c) { return c.key === l.color; })[0] || p.colors[0];
      return { key: lineKey(l.id, l.size, l.color), id: l.id, product: p, size: l.size,
        color: col, qty: l.qty, added: l.added, max: Math.max(1, stockFor(p, l.size)),
        lineTotal: p.price * l.qty, lineMrp: p.mrp * l.qty };
    }).filter(Boolean);
  }
  function cartCount() {
    return (S.cart || []).reduce(function (n, l) { return n + l.qty; }, 0);
  }
  function cartAdd(id, size, color, qty) {
    var p = byId(id);
    if (!p) return { ok: false, msg: 'That product is no longer available.' };
    size = size || p.sizes[0];
    color = color || (p.colors[0] && p.colors[0].key);
    var avail = stockFor(p, size);
    if (avail <= 0) return { ok: false, msg: 'Size ' + size + ' is out of stock.' };
    qty = Math.max(1, qty || 1);
    var existing = null;
    (S.cart || []).forEach(function (l) { if (l.id === id && l.size === size && l.color === color) existing = l; });
    var have = existing ? existing.qty : 0;
    if (have + qty > avail) {
      qty = avail - have;
      if (qty <= 0) return { ok: false, msg: 'Only ' + avail + ' left in size ' + size + ' and they are already in your bag.' };
    }
    if (existing) existing.qty += qty;
    else S.cart.push({ id: id, size: size, color: color, qty: qty, added: Date.now() });
    commit(); emit('cart', { id: id, added: qty });
    return { ok: true, msg: p.name + ' added to your bag.', qty: qty };
  }
  function findLine(key) {
    var hit = null;
    (S.cart || []).forEach(function (l) { if (lineKey(l.id, l.size, l.color) === key) hit = l; });
    return hit;
  }
  function cartQty(key, qty) {
    var l = findLine(key);
    if (!l) return { ok: false };
    var p = byId(l.id), avail = stockFor(p, l.size);
    qty = Math.max(1, Math.min(qty, Math.max(1, avail)));
    if (qty > avail) return { ok: false, msg: 'Only ' + avail + ' left in size ' + l.size + '.' };
    l.qty = qty; commit(); emit('cart', { id: l.id });
    return { ok: true };
  }
  function cartRemove(key) {
    var before = (S.cart || []).length;
    S.cart = (S.cart || []).filter(function (l) { return lineKey(l.id, l.size, l.color) !== key; });
    commit(); emit('cart', {});
    return before !== S.cart.length;
  }
  function cartClear() { S.cart = []; S.coupon = null; commit(); emit('cart', {}); emit('coupon', {}); }
  function cartHas(id) { return (S.cart || []).some(function (l) { return l.id === id; }); }

  /* ---------- save for later --------------------------------------------- */
  function saved() {
    return (S.saved || []).map(function (l) {
      var p = byId(l.id); if (!p) return null;
      var col = p.colors.filter(function (c) { return c.key === l.color; })[0] || p.colors[0];
      return { key: lineKey(l.id, l.size, l.color), id: l.id, product: p, size: l.size, color: col, qty: l.qty };
    }).filter(Boolean);
  }
  function saveForLater(key) {
    var l = findLine(key); if (!l) return false;
    cartRemove(key);
    if (!(S.saved || []).some(function (x) { return lineKey(x.id, x.size, x.color) === key; }))
      S.saved.push({ id: l.id, size: l.size, color: l.color, qty: l.qty });
    commit(); emit('cart', {});
    return true;
  }
  function savedToCart(key) {
    var hit = null;
    (S.saved || []).forEach(function (l) { if (lineKey(l.id, l.size, l.color) === key) hit = l; });
    if (!hit) return { ok: false };
    var r = cartAdd(hit.id, hit.size, hit.color, hit.qty);
    if (r.ok) savedRemove(key);
    return r;
  }
  function savedRemove(key) {
    S.saved = (S.saved || []).filter(function (l) { return lineKey(l.id, l.size, l.color) !== key; });
    commit(); emit('cart', {});
  }

  /* ---------- coupons ----------------------------------------------------- */
  function couponByCode(code) {
    code = String(code || '').trim().toUpperCase();
    for (var i = 0; i < D.COUPONS.length; i++) if (D.COUPONS[i].code === code) return D.COUPONS[i];
    return null;
  }
  function couponCheck(code, subtotal) {
    var c = couponByCode(code);
    if (!c) return { ok: false, msg: 'That code is not recognised. Check the spelling and try again.' };
    if (!c.active) return { ok: false, msg: 'This offer has ended.' };
    if (c.expires < Date.now()) return { ok: false, msg: 'This code expired on ' + fmtDate(c.expires) + '.' };
    var used = (S.usedCoupons || {})[c.code] || 0;
    if (used >= c.limit) return { ok: false, msg: 'You have used ' + c.code + ' the maximum ' + c.limit + ' ' + plural(c.limit, 'time') + '.' };
    if (subtotal < c.minOrder) return { ok: false, msg: 'Add ' + money(c.minOrder - subtotal) + ' more to use ' + c.code + '.' };
    return { ok: true, coupon: c };
  }
  function couponValue(c, subtotal) {
    if (!c) return 0;
    var v = c.type === 'percent' ? subtotal * c.value / 100 : c.value;
    return Math.round(Math.min(v, c.maxDiscount, subtotal));
  }
  function applyCoupon(code) {
    var sub = cart().reduce(function (n, l) { return n + l.lineTotal; }, 0);
    var r = couponCheck(code, sub);
    if (!r.ok) return r;
    S.coupon = r.coupon.code; commit(); emit('coupon', { code: r.coupon.code });
    return { ok: true, msg: r.coupon.code + ' applied — you saved ' + money(couponValue(r.coupon, sub)) + '.' };
  }
  function removeCoupon() {
    var had = S.coupon; S.coupon = null; commit(); emit('coupon', {});
    return had;
  }
  function activeCoupon() { return S.coupon ? couponByCode(S.coupon) : null; }
  function eligibleCoupons(subtotal) {
    return D.COUPONS.filter(function (c) {
      return c.active && c.expires > Date.now() && ((S.usedCoupons || {})[c.code] || 0) < c.limit;
    }).map(function (c) {
      return { coupon: c, eligible: subtotal >= c.minOrder, saves: couponValue(c, subtotal) };
    }).sort(function (a, b) { return (b.eligible - a.eligible) || (b.saves - a.saves); });
  }

  function totals(opts) {
    opts = opts || {};
    var lines = cart();
    var mrp = lines.reduce(function (n, l) { return n + l.lineMrp; }, 0);
    var sub = lines.reduce(function (n, l) { return n + l.lineTotal; }, 0);
    var c = activeCoupon();
    var cAmt = 0, cCode = null;
    if (c) {
      var ok = couponCheck(c.code, sub);
      if (ok.ok) { cAmt = couponValue(c, sub); cCode = c.code; }
      else { S.coupon = null; commit(); }
    }
    var afterCoupon = sub - cAmt;
    var ship = afterCoupon >= FREE_SHIP || afterCoupon === 0 ? 0 : SHIP_FEE;
    var cod = opts.cod ? COD_FEE : 0;
    return {
      lines: lines, count: cartCount(), mrp: mrp, subtotal: sub,
      productSaving: mrp - sub, coupon: cCode, couponAmount: cAmt,
      shipping: ship, shipFree: ship === 0, codFee: cod,
      freeShipGap: Math.max(0, FREE_SHIP - afterCoupon), freeShipAt: FREE_SHIP,
      total: Math.max(0, afterCoupon + ship + cod),
      totalSaving: (mrp - sub) + cAmt
    };
  }

  /* ---------- wishlist ---------------------------------------------------- */
  function wishlist() { return (S.wish || []).map(byId).filter(Boolean); }
  function wishCount() { return (S.wish || []).length; }
  function inWish(id) { return (S.wish || []).indexOf(id) > -1; }
  function wishToggle(id) {
    var p = byId(id); if (!p) return { ok: false };
    var i = (S.wish || []).indexOf(id);
    if (i > -1) { S.wish.splice(i, 1); commit(); emit('wish', { id: id, on: false });
      return { ok: true, on: false, msg: 'Removed from wishlist.' }; }
    S.wish.unshift(id); commit(); emit('wish', { id: id, on: true });
    return { ok: true, on: true, msg: 'Saved to wishlist.' };
  }
  function wishRemove(id) {
    var i = (S.wish || []).indexOf(id);
    if (i > -1) { S.wish.splice(i, 1); commit(); emit('wish', { id: id, on: false }); return true; }
    return false;
  }
  function wishToCart(id, size, color) {
    var r = cartAdd(id, size, color, 1);
    if (r.ok) wishRemove(id);
    return r;
  }

  /* ---------- compare ----------------------------------------------------- */
  var CMP_MAX = 4;
  function compare() { return (S.compare || []).map(byId).filter(Boolean); }
  function inCompare(id) { return (S.compare || []).indexOf(id) > -1; }
  function compareToggle(id) {
    var i = (S.compare || []).indexOf(id);
    if (i > -1) { S.compare.splice(i, 1); commit(); emit('compare', {});
      return { ok: true, on: false, msg: 'Removed from compare.' }; }
    if ((S.compare || []).length >= CMP_MAX)
      return { ok: false, msg: 'Compare holds ' + CMP_MAX + ' products. Remove one first.' };
    S.compare.push(id); commit(); emit('compare', {});
    return { ok: true, on: true, msg: 'Added to compare (' + S.compare.length + ' of ' + CMP_MAX + ').' };
  }
  function compareClear() { S.compare = []; commit(); emit('compare', {}); }

  /* ---------- recently viewed -------------------------------------------- */
  function markSeen(id) {
    if (!byId(id)) return;
    S.seen = [id].concat((S.seen || []).filter(function (x) { return x !== id; })).slice(0, 24);
    commit(); emit('seen', { id: id });
  }
  function recentlyViewed(n, exclude) {
    return (S.seen || []).filter(function (id) { return id !== exclude; })
      .map(byId).filter(Boolean).slice(0, n || 10);
  }

  /* ---------- recent searches -------------------------------------------- */
  function recentSearches() { return (S.searches || []).slice(0, 8); }
  function pushSearch(q) {
    q = String(q || '').trim();
    if (q.length < 2) return;
    S.searches = [q].concat((S.searches || []).filter(function (x) {
      return x.toLowerCase() !== q.toLowerCase();
    })).slice(0, 8);
    commit(); emit('searches', {});
  }
  function clearSearches() { S.searches = []; commit(); emit('searches', {}); }

  /* ---------- auth -------------------------------------------------------- */
  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return 'h' + (h >>> 0).toString(36);
  }
  function accounts() { return S.accounts || (S.accounts = {}); }
  function user() { return S.user; }
  function isAuthed() { return !!S.user; }
  function register(d) {
    var email = String(d.email || '').trim().toLowerCase();
    if (accounts()[email]) return { ok: false, field: 'email', msg: 'An account already uses this email. Log in instead.' };
    accounts()[email] = { name: d.name, email: email, phone: d.phone || '', pw: hash(d.password), created: Date.now() };
    S.user = { name: d.name, email: email, phone: d.phone || '', created: Date.now() };
    commit(); emit('auth', { user: S.user });
    return { ok: true, msg: 'Welcome to NUKKAD, ' + d.name.split(' ')[0] + '.' };
  }
  function login(email, password) {
    email = String(email || '').trim().toLowerCase();
    var a = accounts()[email];
    if (!a) return { ok: false, field: 'email', msg: 'No account found for that email.' };
    if (a.pw !== hash(password)) return { ok: false, field: 'password', msg: 'That password does not match our records.' };
    S.user = { name: a.name, email: a.email, phone: a.phone || '', created: a.created };
    commit(); emit('auth', { user: S.user });
    return { ok: true, msg: 'Welcome back, ' + a.name.split(' ')[0] + '.' };
  }
  function loginDemo() {
    var email = 'demo@nukkad.example';
    if (!accounts()[email]) accounts()[email] = { name: 'Aarav Mehta', email: email, phone: '9876543210', pw: hash('nukkad123'), created: Date.now() - 86400000 * 120 };
    return login(email, 'nukkad123');
  }
  function logout() { S.user = null; commit(); emit('auth', { user: null }); }
  function updateProfile(d) {
    if (!S.user) return { ok: false };
    S.user.name = d.name || S.user.name;
    S.user.phone = d.phone || S.user.phone;
    var a = accounts()[S.user.email];
    if (a) { a.name = S.user.name; a.phone = S.user.phone; }
    commit(); emit('auth', { user: S.user });
    return { ok: true, msg: 'Profile updated.' };
  }
  function changePassword(cur, next) {
    if (!S.user) return { ok: false, msg: 'Log in first.' };
    var a = accounts()[S.user.email];
    if (!a || a.pw !== hash(cur)) return { ok: false, field: 'current', msg: 'Your current password does not match.' };
    a.pw = hash(next); commit();
    return { ok: true, msg: 'Password changed.' };
  }
  function resetRequest(email) {
    email = String(email || '').trim().toLowerCase();
    if (!accounts()[email]) return { ok: false, field: 'email', msg: 'No account found for that email.' };
    return { ok: true, msg: 'Reset link sent to ' + email + '. It is valid for 30 minutes.' };
  }

  /* ---------- addresses --------------------------------------------------- */
  function addresses() { return (S.addresses || []).slice(); }
  function addressSave(a) {
    if (a.id) {
      S.addresses = (S.addresses || []).map(function (x) { return x.id === a.id ? a : x; });
    } else {
      a.id = 'ad-' + Date.now().toString(36);
      if (!(S.addresses || []).length) a.isDefault = true;
      S.addresses.push(a);
    }
    if (a.isDefault) S.addresses.forEach(function (x) { x.isDefault = x.id === a.id; });
    commit(); emit('address', {});
    return a;
  }
  function addressRemove(id) {
    var wasDefault = (S.addresses || []).some(function (x) { return x.id === id && x.isDefault; });
    S.addresses = (S.addresses || []).filter(function (x) { return x.id !== id; });
    if (wasDefault && S.addresses.length) S.addresses[0].isDefault = true;
    commit(); emit('address', {});
  }
  function defaultAddress() {
    var a = (S.addresses || []).filter(function (x) { return x.isDefault; })[0];
    return a || (S.addresses || [])[0] || null;
  }

  /* ---------- checkout draft ---------------------------------------------- */
  /* Held in state so a refresh mid-checkout does not throw away the choices. */
  function draft() { return S.draft || (S.draft = { addressId: '', ship: '' }); }
  function checkoutAddress() {
    var d0 = draft();
    var hit = (S.addresses || []).filter(function (x) { return x.id === d0.addressId; })[0];
    return hit || defaultAddress();
  }
  function setCheckoutAddress(id) {
    draft().addressId = id;
    commit(); emit('draft', { addressId: id });
    return checkoutAddress();
  }
  function checkoutShipOptions() {
    var a = checkoutAddress();
    return shipOptions(a ? a.pin : '');
  }
  function checkoutShip() {
    var opts = checkoutShipOptions(), key = draft().ship;
    return opts.filter(function (o) { return o.key === key; })[0] || opts[0];
  }
  function setCheckoutShip(key) {
    draft().ship = key;
    commit(); emit('draft', { ship: key });
    return checkoutShip();
  }
  function clearDraft() { S.draft = { addressId: '', ship: '' }; commit(); }

  /* ---------- orders ------------------------------------------------------ */
  var STATUS = [
    { key: 'pending',    label: 'Pending',          note: 'Waiting for payment confirmation' },
    { key: 'confirmed',  label: 'Confirmed',        note: 'Payment received, order confirmed' },
    { key: 'processing', label: 'Processing',       note: 'Packed at our Bengaluru warehouse' },
    { key: 'shipped',    label: 'Shipped',          note: 'Handed to the courier' },
    { key: 'out',        label: 'Out for Delivery', note: 'With the delivery partner today' },
    { key: 'delivered',  label: 'Delivered',        note: 'Signed for at your address' },
    { key: 'cancelled',  label: 'Cancelled',        note: 'Order cancelled' }
  ];
  var FLOW = ['confirmed', 'processing', 'shipped', 'out', 'delivered'];
  function statusMeta(k) {
    for (var i = 0; i < STATUS.length; i++) if (STATUS[i].key === k) return STATUS[i];
    return STATUS[0];
  }

  var PAY_LABELS = { upi: 'UPI', card: 'Card', netbanking: 'Net Banking', cod: 'Cash on Delivery' };

  function orderId() {
    var n = (S.orders || []).length + 1;
    return 'NK' + new Date().getFullYear() + String(Date.now()).slice(-5) + String(n).padStart(2, '0');
  }
  function placeOrder(d) {
    var t = totals({ cod: d.payment === 'cod' });
    if (!t.lines.length) return { ok: false, msg: 'Your bag is empty.' };
    var now = Date.now();
    var status = d.payment === 'cod' ? 'confirmed' : 'confirmed';
    var o = {
      id: orderId(), created: now, updated: now,
      status: status,
      payment: d.payment, paymentLabel: PAY_LABELS[d.payment] || d.payment,
      paymentDetail: d.detail || '',
      paymentStatus: d.payment === 'cod' ? 'Pending — pay on delivery' : 'Paid',
      paymentRef: d.payment === 'cod' ? null : 'TXN' + String(now).slice(-9),
      address: d.address, shipping: d.shipping,
      items: t.lines.map(function (l) {
        return { id: l.id, name: l.product.name, brand: l.product.brand, sub: l.product.subName,
          size: l.size, colorKey: l.color.key, colorName: l.color.name, colorHex: l.color.hex,
          qty: l.qty, price: l.product.price, mrp: l.product.mrp, lineTotal: l.lineTotal };
      }),
      mrp: t.mrp, subtotal: t.subtotal, coupon: t.coupon, couponAmount: t.couponAmount,
      shippingFee: t.shipping + (d.shipping && d.shipping.fee ? d.shipping.fee : 0),
      codFee: t.codFee, total: t.total + (d.shipping && d.shipping.fee ? d.shipping.fee : 0),
      saving: t.totalSaving,
      eta: now + (d.shipping && d.shipping.days ? d.shipping.days : 5) * 86400000,
      timeline: [{ status: 'confirmed', at: now }]
    };
    if (t.coupon) {
      S.usedCoupons = S.usedCoupons || {};
      S.usedCoupons[t.coupon] = (S.usedCoupons[t.coupon] || 0) + 1;
    }
    S.orders.unshift(o);
    cartClear();
    commit(); emit('orders', { id: o.id });
    return { ok: true, order: o };
  }
  function orders() { return (S.orders || []).slice(); }
  function orderById(id) {
    var hit = null;
    (S.orders || []).forEach(function (o) { if (o.id.toUpperCase() === String(id || '').toUpperCase().trim()) hit = o; });
    return hit;
  }
  /* Orders advance with real elapsed time so tracking is never frozen. */
  function progress() {
    var changed = false, now = Date.now();
    (S.orders || []).forEach(function (o) {
      if (o.status === 'cancelled' || o.status === 'delivered') return;
      var age = now - o.created;
      var steps = [0, 45e3, 6 * 3600e3, 26 * 3600e3, 50 * 3600e3];
      var want = 0;
      for (var i = 0; i < steps.length; i++) if (age >= steps[i]) want = i;
      var have = FLOW.indexOf(o.status);
      if (want > have) {
        for (var k = have + 1; k <= want; k++) o.timeline.push({ status: FLOW[k], at: o.created + steps[k] });
        o.status = FLOW[want]; o.updated = now; changed = true;
      }
    });
    if (changed) { commit(); emit('orders', {}); }
    return changed;
  }
  /* the cancel window closes once a courier has it — views ask before offering the button */
  function cancellable(o) {
    return !!o && o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'out';
  }
  function cancelOrder(id) {
    var o = orderById(id);
    if (!o) return { ok: false, msg: 'Order not found.' };
    if (o.status === 'delivered') return { ok: false, msg: 'This order was already delivered. Start a return instead.' };
    if (o.status === 'cancelled') return { ok: false, msg: 'This order is already cancelled.' };
    if (o.status === 'out') return { ok: false, msg: 'This order is out for delivery and can no longer be cancelled.' };
    o.status = 'cancelled'; o.updated = Date.now();
    o.paymentStatus = o.payment === 'cod' ? 'Not charged' : 'Refund initiated';
    o.timeline.push({ status: 'cancelled', at: o.updated });
    commit(); emit('orders', { id: id });
    return { ok: true, msg: 'Order ' + id + ' cancelled. Any payment is refunded in 3–5 working days.' };
  }
  function reorder(id) {
    var o = orderById(id);
    if (!o) return { ok: false, msg: 'Order not found.' };
    var added = 0, skipped = 0;
    o.items.forEach(function (it) {
      var r = cartAdd(it.id, it.size, it.colorKey, it.qty);
      if (r.ok) added += r.qty; else skipped++;
    });
    if (!added) return { ok: false, msg: 'None of these items are back in stock yet.' };
    return { ok: true, msg: added + ' ' + plural(added, 'item') + ' back in your bag' + (skipped ? ', ' + skipped + ' unavailable.' : '.') };
  }
  function orderStats() {
    var os = orders();
    var live = os.filter(function (o) { return o.status !== 'delivered' && o.status !== 'cancelled'; });
    var spent = os.filter(function (o) { return o.status !== 'cancelled'; })
      .reduce(function (n, o) { return n + o.total; }, 0);
    var saved = os.filter(function (o) { return o.status !== 'cancelled'; })
      .reduce(function (n, o) { return n + (o.saving || 0); }, 0);
    return { total: os.length, live: live.length, spent: spent, saved: saved };
  }

  /* ---------- reviews ----------------------------------------------------- */
  function seedReviews(p) {
    var rs = D.REVIEW_SEED, rnd = D.seeded('rv|' + p.id);
    var n = Math.max(3, Math.min(9, Math.round(p.ratingCount / 260) + 3));
    var out = [];
    for (var i = 0; i < n; i++) {
      var stars = Math.max(1, Math.min(5, Math.round(p.rating + (rnd() - 0.42) * 1.8)));
      out.push({
        id: 'sr-' + p.id + '-' + i,
        who: D.pick(rnd, rs.names),
        stars: stars,
        title: D.pick(rnd, rs.titles),
        body: D.pick(rnd, rs.bodies),
        fit: D.pick(rnd, rs.fits),
        size: D.pick(rnd, p.sizes),
        verified: rnd() < 0.78,
        helpful: D.intBetween(rnd, 0, 74),
        at: Date.now() - D.intBetween(rnd, 2, 240) * 86400000,
        mine: false
      });
    }
    return out.sort(function (a, b) { return b.at - a.at; });
  }
  function reviews(id) {
    var p = byId(id); if (!p) return [];
    var mine = (S.reviews || {})[id] || [];
    return mine.concat(seedReviews(p)).sort(function (a, b) { return b.at - a.at; });
  }
  function reviewSummary(id) {
    var list = reviews(id), p = byId(id);
    var buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    list.forEach(function (r) { buckets[r.stars] = (buckets[r.stars] || 0) + 1; });
    var count = p ? Math.max(p.ratingCount, list.length) : list.length;
    var scale = count / Math.max(1, list.length);
    var bars = [5, 4, 3, 2, 1].map(function (s) {
      var c = Math.round(buckets[s] * scale);
      return { stars: s, count: c, pct: count ? Math.round(c / count * 100) : 0 };
    });
    var fits = {};
    list.forEach(function (r) { fits[r.fit] = (fits[r.fit] || 0) + 1; });
    var topFit = Object.keys(fits).sort(function (a, b) { return fits[b] - fits[a]; })[0] || 'True to size';
    return { avg: p ? p.rating : 0, count: count, bars: bars, list: list, topFit: topFit,
      recommend: Math.round((buckets[5] + buckets[4]) / Math.max(1, list.length) * 100) };
  }
  function hasReviewed(id) {
    return ((S.reviews || {})[id] || []).some(function (r) { return r.mine; });
  }
  function addReview(id, d) {
    if (!byId(id)) return { ok: false, msg: 'Product not found.' };
    if (!isAuthed()) return { ok: false, msg: 'Log in to post a review.', needAuth: true };
    if (hasReviewed(id)) return { ok: false, msg: 'You have already reviewed this product.' };
    S.reviews = S.reviews || {};
    S.reviews[id] = S.reviews[id] || [];
    var bought = orders().some(function (o) {
      return o.status !== 'cancelled' && o.items.some(function (it) { return it.id === id; });
    });
    S.reviews[id].unshift({
      id: 'mr-' + Date.now().toString(36), who: (S.user && S.user.name) || 'You',
      stars: d.stars, title: d.title, body: d.body, fit: d.fit || 'True to size',
      size: d.size || '', verified: bought, helpful: 0, at: Date.now(), mine: true
    });
    commit(); emit('reviews', { id: id });
    return { ok: true, msg: 'Thanks — your review is live.' };
  }
  function markHelpful(id, rid) {
    S.helpful = S.helpful || {};
    var k = id + '|' + rid;
    if (S.helpful[k]) return { ok: false, msg: 'You already marked this helpful.' };
    S.helpful[k] = 1; commit();
    return { ok: true, msg: 'Thanks for the feedback.' };
  }
  function wasHelpful(id, rid) { return !!(S.helpful || {})[id + '|' + rid]; }

  /* ---------- delivery estimator ----------------------------------------- */
  var METROS = { '110': 'New Delhi', '400': 'Mumbai', '560': 'Bengaluru', '600': 'Chennai',
    '700': 'Kolkata', '500': 'Hyderabad', '411': 'Pune', '380': 'Ahmedabad', '302': 'Jaipur',
    '226': 'Lucknow', '682': 'Kochi', '160': 'Chandigarh', '751': 'Bhubaneswar', '452': 'Indore' };
  function checkPin(pin) {
    pin = String(pin || '').trim();
    if (!/^[1-9][0-9]{5}$/.test(pin))
      return { ok: false, msg: 'Enter a valid 6-digit Indian PIN code.' };
    var rnd = D.seeded('pin' + pin);
    var pre = pin.slice(0, 3);
    var city = METROS[pre];
    var metro = !!city;
    if (!city) {
      var names = ['Nagpur', 'Surat', 'Coimbatore', 'Vadodara', 'Patna', 'Guwahati', 'Raipur',
        'Mysuru', 'Nashik', 'Madurai', 'Jodhpur', 'Dehradun', 'Vijayawada', 'Ranchi'];
      city = D.pick(rnd, names);
    }
    var serviceable = rnd() > 0.045;
    if (!serviceable)
      return { ok: false, pin: pin, city: city, msg: 'We do not deliver to ' + pin + ' yet. Try another PIN code.' };
    var days = metro ? D.intBetween(rnd, 2, 3) : D.intBetween(rnd, 4, 7);
    var cod = rnd() > 0.14;
    var eta = new Date(Date.now() + days * 86400000);
    return { ok: true, pin: pin, city: city, days: days, cod: cod, metro: metro,
      eta: eta.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      msg: 'Delivers to ' + city + ' by ' + eta.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) };
  }
  function shipOptions(pin) {
    var r = pin ? checkPin(pin) : { ok: true, days: 5 };
    var base = r.ok ? r.days : 5;
    return [
      { key: 'standard', name: 'Standard delivery', days: base, fee: 0,
        note: 'Free on orders over ' + money(FREE_SHIP) },
      { key: 'express', name: 'Express delivery', days: Math.max(1, base - 2), fee: 129,
        note: 'Priority pick-up and dispatch' },
      { key: 'slot', name: 'Weekend slot', days: base + 1, fee: 49,
        note: 'Delivered Saturday or Sunday, 10am–6pm' }
    ];
  }

  /* ---------- size guide -------------------------------------------------- */
  var SIZE_CHARTS = {
    alpha: { cols: ['Size', 'Chest (in)', 'Length (in)', 'Shoulder (in)'], rows: [
      ['XS', '36', '26.0', '16.5'], ['S', '38', '27.0', '17.5'], ['M', '40', '28.0', '18.5'],
      ['L', '42', '29.0', '19.5'], ['XL', '44', '30.0', '20.5'], ['XXL', '46', '31.0', '21.5']] },
    waist: { cols: ['Size', 'Waist (in)', 'Hip (in)', 'Inseam (in)'], rows: [
      ['28', '28', '36', '30'], ['30', '30', '38', '30.5'], ['32', '32', '40', '31'],
      ['34', '34', '42', '31.5'], ['36', '36', '44', '32'], ['38', '38', '46', '32']] },
    shoe: { cols: ['Size', 'UK', 'EU', 'Foot (cm)'], rows: [
      ['S/M', '6–8', '39–42', '24–26'], ['L/XL', '9–11', '43–46', '27–29']] },
    free: { cols: ['Size', 'Fits'], rows: [['Free Size', 'One size fits most']] }
  };
  function chartFor(p) {
    var s = p.sizes.join(',');
    if (s === D.SIZE_SETS.waist.join(',')) return SIZE_CHARTS.waist;
    if (s === D.SIZE_SETS.shoe.join(',')) return SIZE_CHARTS.shoe;
    if (s === D.SIZE_SETS.free.join(',')) return SIZE_CHARTS.free;
    return SIZE_CHARTS.alpha;
  }

  /* ---------- validation -------------------------------------------------- */
  var V = {
    required: function (v) { return String(v || '').trim() ? '' : 'This field is required.'; },
    name: function (v) {
      v = String(v || '').trim();
      if (!v) return 'Enter your full name.';
      if (v.length < 3) return 'Enter at least 3 characters.';
      if (!/^[a-zA-Zऀ-ॿ.'\- ]+$/.test(v)) return 'Use letters, spaces, hyphens and apostrophes only.';
      return '';
    },
    email: function (v) {
      v = String(v || '').trim();
      if (!v) return 'Enter your email address.';
      if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v)) return 'Enter a valid email, like you@example.com.';
      return '';
    },
    phone: function (v) {
      v = String(v || '').replace(/\s|-/g, '');
      if (!v) return 'Enter your mobile number.';
      if (!/^[6-9][0-9]{9}$/.test(v)) return 'Enter a 10-digit Indian mobile number.';
      return '';
    },
    pin: function (v) {
      v = String(v || '').trim();
      if (!v) return 'Enter your PIN code.';
      if (!/^[1-9][0-9]{5}$/.test(v)) return 'Enter a valid 6-digit PIN code.';
      return '';
    },
    password: function (v) {
      v = String(v || '');
      if (!v) return 'Choose a password.';
      if (v.length < 8) return 'Use at least 8 characters.';
      if (!/[a-zA-Z]/.test(v) || !/[0-9]/.test(v)) return 'Mix letters and numbers.';
      return '';
    },
    address: function (v) {
      v = String(v || '').trim();
      if (!v) return 'Enter your house or flat and street.';
      if (v.length < 8) return 'Add a little more detail so the courier can find you.';
      return '';
    },
    card: function (v) {
      v = String(v || '').replace(/\s/g, '');
      if (!v) return 'Enter your card number.';
      if (!/^[0-9]{16}$/.test(v)) return 'Card numbers are 16 digits.';
      var sum = 0;
      for (var i = 0; i < 16; i++) {
        var d = +v[15 - i];
        if (i % 2) { d *= 2; if (d > 9) d -= 9; }
        sum += d;
      }
      return sum % 10 === 0 ? '' : 'That card number does not look right.';
    },
    expiry: function (v) {
      v = String(v || '').trim();
      if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(v)) return 'Use MM/YY.';
      var mm = +v.slice(0, 2), yy = 2000 + +v.slice(3);
      var end = new Date(yy, mm, 1).getTime();
      return end > Date.now() ? '' : 'That card has expired.';
    },
    cvv: function (v) { return /^[0-9]{3,4}$/.test(String(v || '').trim()) ? '' : 'CVV is 3 or 4 digits.'; },
    upi: function (v) {
      v = String(v || '').trim();
      if (!v) return 'Enter your UPI ID.';
      return /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(v) ? '' : 'UPI IDs look like name@bank.';
    }
  };
  function pwStrength(v) {
    v = String(v || '');
    var s = 0;
    if (v.length >= 8) s++;
    if (v.length >= 12) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^a-zA-Z0-9]/.test(v)) s++;
    var labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong', 'Very strong'];
    return { score: s, label: labels[Math.min(s, 5)], pct: Math.round(Math.min(s, 5) / 5 * 100) };
  }

  /* ---------- misc helpers ------------------------------------------------ */
  function stockNote(p, size) {
    if (!p) return null;
    if (size) {
      var q = stockFor(p, size);
      if (q <= 0) return { level: 'out', text: 'Out of stock in ' + size };
      if (q <= 4) return { level: 'low', text: 'Only ' + q + ' left in ' + size };
      return { level: 'ok', text: 'In stock' };
    }
    if (p.totalStock <= 0) return { level: 'out', text: 'Sold out' };
    if (p.totalStock <= 8) return { level: 'low', text: 'Only ' + p.totalStock + ' left' };
    return { level: 'ok', text: 'In stock' };
  }
  function firstAvailableSize(p) {
    for (var i = 0; i < p.sizes.length; i++) if (p.stock[p.sizes[i]] > 0) return p.sizes[i];
    return p.sizes[0];
  }
  function announceHidden() { return !!S.announceHidden; }
  function hideAnnounce() { S.announceHidden = true; commit(); }
  function resetAll() {
    S = { }; writeAll(S); memory = {};
    if (canStore) try { w.localStorage.removeItem(KEY); } catch (e) {}
    w.location.hash = '#/';
    w.location.reload();
  }

  progress();
  w.setInterval(progress, 30000);

  w.NK = {
    /* utils */
    on: on, emit: emit, money: money, plural: plural, fmtDate: fmtDate, fmtDateTime: fmtDateTime,
    canStore: canStore, resetAll: resetAll,
    /* catalog */
    byId: byId, all: all, catBySlug: catBySlug, subBySlug: subBySlug,
    search: search, suggestions: suggestions, query: query, blankFilters: blank,
    normaliseFilters: normalise, activeChips: activeChips, SORTS: SORTS,
    PRICE_MIN: PRICE_MIN, PRICE_MAX: PRICE_MAX,
    newArrivals: newArrivals, bestSellers: bestSellers, trending: trending, deals: deals,
    related: related, recommended: recommended,
    stockNote: stockNote, firstAvailableSize: firstAvailableSize, chartFor: chartFor,
    TAXONOMY: D.TAXONOMY, COUPONS: D.COUPONS, COLOR_FAMS: D.COLOR_FAMS, COLORS: D.COLORS,
    /* cart */
    cart: cart, cartCount: cartCount, cartAdd: cartAdd, cartQty: cartQty, cartRemove: cartRemove,
    cartClear: cartClear, cartHas: cartHas, totals: totals, lineKey: lineKey,
    saved: saved, saveForLater: saveForLater, savedToCart: savedToCart, savedRemove: savedRemove,
    FREE_SHIP: FREE_SHIP, SHIP_FEE: SHIP_FEE, COD_FEE: COD_FEE,
    /* coupons */
    applyCoupon: applyCoupon, removeCoupon: removeCoupon, activeCoupon: activeCoupon,
    eligibleCoupons: eligibleCoupons, couponValue: couponValue, couponByCode: couponByCode,
    /* wishlist + compare */
    wishlist: wishlist, wishCount: wishCount, inWish: inWish, wishToggle: wishToggle,
    wishRemove: wishRemove, wishToCart: wishToCart,
    compare: compare, inCompare: inCompare, compareToggle: compareToggle, compareClear: compareClear,
    CMP_MAX: CMP_MAX,
    /* history */
    markSeen: markSeen, recentlyViewed: recentlyViewed,
    recentSearches: recentSearches, pushSearch: pushSearch, clearSearches: clearSearches,
    /* auth */
    user: user, isAuthed: isAuthed, register: register, login: login, loginDemo: loginDemo,
    logout: logout, updateProfile: updateProfile, changePassword: changePassword,
    resetRequest: resetRequest,
    /* addresses */
    addresses: addresses, addressSave: addressSave, addressRemove: addressRemove,
    defaultAddress: defaultAddress,
    /* checkout draft */
    checkoutAddress: checkoutAddress, setCheckoutAddress: setCheckoutAddress,
    checkoutShip: checkoutShip, setCheckoutShip: setCheckoutShip,
    checkoutShipOptions: checkoutShipOptions, clearDraft: clearDraft,
    /* orders */
    placeOrder: placeOrder, orders: orders, orderById: orderById, cancelOrder: cancelOrder,
    cancellable: cancellable, progress: progress,
    reorder: reorder, orderStats: orderStats, statusMeta: statusMeta, STATUS: STATUS, FLOW: FLOW,
    PAY_LABELS: PAY_LABELS,
    /* reviews */
    reviews: reviews, reviewSummary: reviewSummary, addReview: addReview, hasReviewed: hasReviewed,
    markHelpful: markHelpful, wasHelpful: wasHelpful,
    /* delivery */
    checkPin: checkPin, shipOptions: shipOptions,
    /* forms */
    V: V, pwStrength: pwStrength,
    /* chrome */
    announceHidden: announceHidden, hideAnnounce: hideAnnounce
  };
})(window);
