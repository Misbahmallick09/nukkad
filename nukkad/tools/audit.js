/* Static audit of the rendered markup: invented CSS classes, dead action
   hooks, missing alt text, unnamed controls, tag balance.
   Run: node tools/audit.js                                              */
'use strict';
var H = require('./harness.js');
var fs = require('fs'), path = require('path');
var win = H.win, NK = win.NK, X = win.NK_VIEWS || {}, A = win.NK_ACCOUNT || {};
var ROOT = path.join(__dirname, '..');

var problems = 0;
function head(t) { console.log('\n=== ' + t + ' ' + '='.repeat(Math.max(0, 58 - t.length))); }
function bad(msg) { problems++; console.log('  x ' + msg); }
function good(msg) { console.log('  . ' + msg); }

/* ---------- 1. build a corpus of every screen ---------------------------- */
var docs = [];
function grab(label, fn) {
  try {
    var o = fn();
    var h = (o && typeof o === 'object') ? (o.html || '') : (o || '');
    if (h) docs.push({ label: label, html: h });
  } catch (e) { bad('render ' + label + ': ' + e.message); }
}

/* logged in, with stock in the bag, so conditional branches render too */
var p1 = NK.all()[3], p2 = NK.all()[9];
NK.cartAdd(p1.id, NK.firstAvailableSize(p1), p1.colors[0].key, 2);
NK.cartAdd(p2.id, NK.firstAvailableSize(p2), p2.colors[0].key, 1);
NK.saveForLater(NK.lineKey(p2.id, NK.firstAvailableSize(p2), p2.colors[0].key));
NK.cartAdd(p2.id, NK.firstAvailableSize(p2), p2.colors[0].key, 1);
NK.wishToggle(NK.all()[5].id); NK.wishToggle(NK.all()[6].id);
NK.compareToggle(p1.id); NK.compareToggle(p2.id);
NK.markSeen(p1.id); NK.markSeen(p2.id);
NK.pushSearch('oversized tee');
NK.applyCoupon(NK.COUPONS[0].code);
NK.loginDemo();
var addr = NK.addressSave({ name: 'Aarav Mehta', phone: '9876543210', line1: '12 Gali No 4',
  area: 'Model Town', city: 'Ludhiana', state: 'Punjab', pin: '141002', type: 'Home', isDefault: true });
NK.setCheckoutAddress(addr.id);

grab('home', function () { return X.home({ query: {} }); });
grab('listing', function () { return X.listing({ cat: 'men', query: {} }); });
grab('listing-filtered', function () {
  return X.listing({ cat: 'women', query: { sizes: 'M', colors: 'Black', sort: 'plow', page: '2' } });
});
grab('listing-empty', function () {
  return X.listing({ cat: 'men', query: { sizes: 'XS', colors: 'Yellow', price: '0,1', rating: '5' } });
});
grab('offers', function () { return X.offers({ query: {} }); });
grab('search', function () { return X.search({ query: { q: 'hoodie' } }); });
grab('search-empty', function () { return X.search({ query: {} }); });
grab('search-miss', function () { return X.search({ query: { q: 'zzqqxx' } }); });
grab('product', function () { return X.product(p1.id, {}); });
grab('product-404', function () { return X.product('nope', {}); });
grab('cart', function () { return X.cart({ query: {} }); });
grab('wishlist', function () { return X.wishlist({ query: {} }); });
grab('compare', function () { return X.compare({ query: {} }); });
grab('info', function () { return X.info('shipping', {}); });
grab('login', function () { return A.login({ query: {} }); });
grab('register', function () { return A.register({ query: {} }); });
grab('forgot', function () { return A.forgot({ query: {} }); });
grab('profile', function () { return A.profile({ query: {} }); });
grab('addresses', function () { return A.addresses({ query: {} }); });
grab('settings', function () { return A.settings({ query: {} }); });
grab('cko-address', function () { return A.checkout('address', {}); });
grab('cko-delivery', function () { return A.checkout('delivery', {}); });
grab('cko-payment', function () { return A.checkout('payment', {}); });

var ord = NK.placeOrder({ payment: 'card', detail: 'Card ending 1111',
  address: NK.defaultAddress(), shipping: NK.shipOptions('141002')[1] });
if (ord.ok) {
  grab('cko-done', function () { return A.checkout('done', { id: ord.order.id }); });
  grab('orders', function () { return A.orders({ query: {} }); });
  grab('order-detail', function () { return A.orderDetail(ord.order.id, {}); });
  grab('track', function () { return A.track(ord.order.id, {}); });
  NK.cancelOrder(ord.order.id);
  grab('order-cancelled', function () { return A.orderDetail(ord.order.id, {}); });
  grab('track-cancelled', function () { return A.track(ord.order.id, {}); });
}
grab('orders-empty', function () { NK.logout(); NK.loginDemo(); return A.orders({ query: {} }); });
grab('track-form', function () { return A.track('', {}); });

var shell = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
docs.push({ label: 'index.html', html: shell });
var ALL = docs.map(function (d) { return d.html; }).join('\n');
head('corpus');
good(docs.length + ' screens, ' + (ALL.length / 1024).toFixed(0) + ' KB of markup');

/* ---------- 2. classes used in markup but absent from the stylesheet ------ */
var css = fs.readFileSync(path.join(ROOT, 'assets/css/styles.css'), 'utf8');
var cssNoStr = css.replace(/\/\*[\s\S]*?\*\//g, '');
var defined = {};
cssNoStr.replace(/(^|[}])([^{}]+)\{/g, function (m, _b, sel) {
  sel.replace(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g, function (mm, c) { defined[c] = 1; return mm; });
  return m;
});

var used = {};
ALL.replace(/class\s*=\s*(['"])([\s\S]*?)\1/g, function (m, _q, list) {
  list.split(/\s+/).forEach(function (c) { if (c) (used[c] = used[c] || 0, used[c]++); });
  return m;
});
/* classes the JS toggles at runtime rather than printing into markup */
var jsAdded = {};
['ui.js', 'app.js', 'views.js', 'account.js'].forEach(function (f) {
  var src = fs.readFileSync(path.join(ROOT, 'assets/js', f), 'utf8');
  src.replace(/classList\.(?:add|remove|toggle)\(\s*(['"])([^'"]+)\1/g, function (m, _q, c) {
    c.split(/\s+/).forEach(function (x) { if (x) jsAdded[x] = 1; });
    return m;
  });
  /* a node built in code gets its classes by assignment, not by markup:
     sheet.className = 'fsheet'; — invisible to both the corpus and the
     class="..." scan below, so the rule would read as dead */
  src.replace(/\.className\s*=\s*(['"])([A-Za-z0-9_\- ]*)\1/g, function (m, _q, c) {
    c.split(/\s+/).forEach(function (x) { if (x) jsAdded[x] = 1; });
    return m;
  });
});

/* Sheets, modals, toasts and drawers are built imperatively on first open, so a
   corpus of rendered views cannot see them. Scanning the source for class="..."
   literals catches the panels that would otherwise ship completely unstyled.
   A class attribute is usually cut in half by concatenation —
     "<div class='fgrp" + (open ? ' is-open' : '') + "'>"
   so pattern A reads the run of class-legal characters straight after the quote
   and pattern B recovers the conditional halves. */
var srcUsed = {};
function note(f, c) { (srcUsed[c] = srcUsed[c] || {}, srcUsed[c][f] = 1); }
var definedList = Object.keys(defined);

['ui.js', 'app.js', 'views.js', 'account.js', 'imagery.js'].forEach(function (f) {
  var src = fs.readFileSync(path.join(ROOT, 'assets/js', f), 'utf8');

  /* A: the literal head of a class attribute. A capture ending in - or _ was cut
     mid-name by a concatenated modifier ("st--" + o.status), so it stands in for
     the whole family rather than for a class of its own. */
  src.replace(/class\s*=\s*\\?['"]([A-Za-z0-9_\- ]*)/g, function (m, list) {
    list.trim().split(/\s+/).forEach(function (c) {
      if (!c) return;
      if (/[-_]$/.test(c)) definedList.forEach(function (d) { if (d.indexOf(c) === 0) note(f, d); });
      else note(f, c);
    });
    return m;
  });

  /* B: a quoted string of nothing but a leading space and words is *probably* a
     conditional class append (' card--out'), but it is just as likely to be prose
     (' still in transit'). Only names the stylesheet already declares are taken,
     which keeps this pass to its one job: not calling a live rule dead. */
  src.replace(/(['"]) ((?:[A-Za-z][A-Za-z0-9_-]*)(?: [A-Za-z][A-Za-z0-9_-]*)*)\1/g, function (m, _q, list) {
    list.trim().split(/\s+/).forEach(function (c) { if (defined[c]) note(f, c); });
    return m;
  });
});

head('classes in markup with no CSS rule');
var orphans = Object.keys(used).filter(function (c) { return !defined[c]; }).sort();
if (!orphans.length) good('every class in the rendered markup has a rule');
else orphans.forEach(function (c) {
  var where = docs.filter(function (d) {
    return new RegExp('class\\s*=\\s*[\'"][^\'"]*\\b' + c.replace(/[-]/g, '\\-') + '\\b').test(d.html);
  }).map(function (d) { return d.label; }).slice(0, 3).join(', ');
  bad('.' + c + '  (x' + used[c] + ' in ' + where + ')');
});

head('CSS rules never used in markup');
var unusedCss = Object.keys(defined).filter(function (c) {
  return !used[c] && !jsAdded[c] && !srcUsed[c] && !/^(is-|has-|no-|nk-)/.test(c);
}).sort();
good(unusedCss.length ? unusedCss.length + ' unreferenced: ' + unusedCss.join(' ') : 'none');

head('runtime-only markup with no CSS rule');
var srcOrphans = Object.keys(srcUsed).filter(function (c) {
  return !defined[c] && !used[c] && !/^(is-|has-|no-|nk-)/.test(c);
}).sort();
if (!srcOrphans.length) good('every class printed by the scripts has a rule');
else srcOrphans.forEach(function (c) {
  bad('.' + c + '  (in ' + Object.keys(srcUsed[c]).join(', ') + ')');
});

module.exports = { docs: docs, ALL: ALL, ROOT: ROOT, bad: bad, good: good, head: head,
  count: function () { return problems; } };
/* ---------- 3. action hooks that nothing listens for --------------------- */
/* The brief is explicit that no button may be decorative. Every data-* hook and
   every id the markup carries is a promise that some script reacts to it; this
   compares the promises against the selectors and lookups the scripts actually
   make. It is the check that would have caught the drawer accordions, whose
   buttons were wired with a missing selector and so did nothing at all. */
var JS = {};
['ui.js', 'app.js', 'views.js', 'account.js', 'imagery.js', 'store.js'].forEach(function (f) {
  JS[f] = fs.readFileSync(path.join(ROOT, 'assets/js', f), 'utf8');
});
var JSALL = Object.keys(JS).map(function (f) { return JS[f]; }).join('\n');

/* data-foo="x" -> foo. Skip the ARIA/HTML natives and the ones read as data. */
var hooks = {};
ALL.replace(/\sdata-([a-z][a-z0-9-]*)\s*=/g, function (m, name) {
  hooks[name] = (hooks[name] || 0) + 1; return m;
});
head('action hooks with no listener');
var deadHooks = Object.keys(hooks).sort().filter(function (h) {
  /* a hook counts as live if any script selects it, reads it, or switches on it */
  return !new RegExp('data-' + h + '\\b').test(JSALL) &&
         !new RegExp('dataset\\.' + h.replace(/-([a-z])/g, function (_m, c) { return c.toUpperCase(); }) + '\\b').test(JSALL);
});
if (!deadHooks.length) good(Object.keys(hooks).length + ' data-* hooks, all referenced by a script');
else deadHooks.forEach(function (h) { bad('data-' + h + '  (x' + hooks[h] + ' in markup, no script reads it)'); });

/* ids are the other half: the scripts reach for them with qs('#x')
   Ids inside a data: URI belong to that image's own document, not to the page,
   so a hundred cards can each carry a gradient called bg without clashing. */
function stripData(h) { return h.replace(/data:image\/svg\+xml,[^'"]*/g, 'data:svg'); }
var ids = {};
stripData(ALL).replace(/\sid\s*=\s*(['"])([^'"]+)\1/g, function (m, _q, v) { ids[v] = (ids[v] || 0) + 1; return m; });
head('duplicate ids');
/* one id may legitimately repeat across screens — only a clash inside a single
   document is a defect, so re-count per view rather than over the corpus */
var realDupes = [];
Object.keys(ids).forEach(function (i) {
  docs.forEach(function (d) {
    var n = (stripData(d.html).match(new RegExp("\\sid\\s*=\\s*['\"]" + i.replace(/[-[\]{}()*+?.\\^$|]/g, '\\$&') + "['\"]", 'g')) || []).length;
    if (n > 1) realDupes.push('#' + i + '  (' + d.label + ' x' + n + ')');
  });
});
if (!realDupes.length) good(Object.keys(ids).length + ' ids, none repeated within a screen');
else realDupes.slice(0, 14).forEach(bad);

/* ---------- 4. attributes broken by their own contents ------------------- */
/* Every attribute here is written single-quoted from a JS string, so any
   apostrophe that reaches a value closes it early and the rest of the value
   is reparsed as attributes. A well-formed value is followed by whitespace,
   > or />; anything else means the quote landed in the wrong place. */
head('attribute values that break their own quoting');
var attrBad = [];
docs.forEach(function (d) {
  var re = /\s([a-zA-Z][a-zA-Z0-9-]*)='([^']*)'([^\s>\/])/g, m;
  while ((m = re.exec(d.html)) && attrBad.length < 12) {
    attrBad.push(m[1] + "='" + m[2].slice(0, 46) + "' -> stray " + JSON.stringify(m[3]) + '  (' + d.label + ')');
  }
});
if (!attrBad.length) good('every single-quoted attribute closes cleanly');
else attrBad.forEach(bad);

/*NUKKAD_AUDIT_NEXT*/
