/* Exercise every view function and report failures + basic output sanity.
   Run: node tools/render-test.js                                        */
'use strict';
var H = require('./harness.js');
var win = H.win;
var NK = win.NK, X = win.NK_VIEWS, A = win.NK_ACCOUNT || {};

var fails = 0, ran = 0;

function run(label, fn) {
  ran++;
  var out, before = win.location.hash;
  win.location.hash = '#/probe';
  try { out = fn(); } catch (e) {
    fails++;
    console.log('FAIL  ' + label + '  ->  ' + e.message);
    if (process.env.NK_TRACE) console.log('      ' + (e.stack || '').split('\n').slice(1, 4).join('\n      '));
    win.location.hash = before;
    return null;
  }
  var moved = win.location.hash !== '#/probe' ? win.location.hash : '';
  win.location.hash = before;
  var html = (out && typeof out === 'object') ? (out.html || '') : (out || '');
  /* a guard that bounces the visitor to an earlier step returns no markup —
     that is the intended outcome, not a broken view */
  if (!html && moved) {
    console.log('ok    ' + label.padEnd(34) + '  redirect -> ' + moved);
    return out;
  }
  if (typeof html !== 'string' || html.length < 40) {
    fails++;
    console.log('FAIL  ' + label + '  ->  produced ' + html.length + ' chars');
    return out;
  }
  var bad = [];
  if (/undefined/.test(html)) bad.push('literal "undefined"');
  if (/\[object Object\]/.test(html)) bad.push('[object Object]');
  if (/\bNaN\b/.test(html)) bad.push('NaN');
  if (/null/.test(html.replace(/nullable/g, ''))) bad.push('literal "null"');
  console.log((bad.length ? 'WARN  ' : 'ok    ') + label.padEnd(34) +
    String(html.length).padStart(8) + ' chars' +
    (bad.length ? '   <- ' + bad.join(', ') : ''));
  if (bad.length) fails++;
  return out;
}

console.log('\n--- catalogue ---');
console.log('products      ' + NK.all().length);
console.log('categories    ' + NK.TAXONOMY.map(function (c) { return c.slug; }).join(', '));
console.log('price range   ' + NK.money(NK.PRICE_MIN) + ' – ' + NK.money(NK.PRICE_MAX));
console.log('coupons       ' + NK.COUPONS.length);

console.log('\n--- views ---');
if (X.home) run('home', function () { return X.home({ query: {} }); });
if (X.listing) {
  run('listing men', function () { return X.listing({ cat: 'men', query: {} }); });
  run('listing men/hoodies', function () { return X.listing({ cat: 'men', sub: 'hoodies', query: {} }); });
  run('listing women/dresses', function () { return X.listing({ cat: 'women', sub: 'dresses', query: {} }); });
  run('listing accessories', function () { return X.listing({ cat: 'accessories', query: {} }); });
  run('listing new', function () { return X.listing({ preset: 'new', query: {} }); });
  run('listing trending', function () { return X.listing({ preset: 'trending', query: {} }); });
  run('listing filtered', function () {
    return X.listing({ cat: 'men', query: { sizes: 'M,L', colors: 'Black', rating: '4', sort: 'plow', price: '0,999' } });
  });
  run('listing bad cat', function () { return X.listing({ cat: 'zzz', query: {} }); });
}
if (X.offers) run('offers', function () { return X.offers({ query: {} }); });
if (X.search) {
  run('search empty', function () { return X.search({ query: {} }); });
  run('search hit', function () { return X.search({ query: { q: 'oversized' } }); });
  run('search miss', function () { return X.search({ query: { q: 'qqzzxx' } }); });
}
if (X.product) {
  var p = NK.all()[0];
  run('product', function () { return X.product(p.id, {}); });
  run('product bad id', function () { return X.product('nope', {}); });
}
if (X.cart) run('cart empty', function () { return X.cart({ query: {} }); });
if (X.wishlist) run('wishlist empty', function () { return X.wishlist({ query: {} }); });
if (X.compare) run('compare empty', function () { return X.compare({ query: {} }); });
if (X.info) run('info about', function () { return X.info('about', {}); });

console.log('\n--- with state ---');
var p1 = NK.all()[3], p2 = NK.all()[9];
NK.cartAdd(p1.id, NK.firstAvailableSize(p1), p1.colors[0].key, 2);
NK.cartAdd(p2.id, NK.firstAvailableSize(p2), p2.colors[0].key, 1);
NK.wishToggle(NK.all()[5].id);
NK.compareToggle(p1.id); NK.compareToggle(p2.id);
NK.markSeen(p1.id); NK.markSeen(p2.id);
console.log('cart count    ' + NK.cartCount() + '   wish ' + NK.wishCount() + '   compare ' + NK.compare().length);
var t = NK.totals({});
console.log('totals        subtotal ' + NK.money(t.subtotal) + '  ship ' + NK.money(t.shipping) + '  total ' + NK.money(t.total));

if (X.cart) run('cart filled', function () { return X.cart({ query: {} }); });
if (X.wishlist) run('wishlist filled', function () { return X.wishlist({ query: {} }); });
if (X.compare) run('compare filled', function () { return X.compare({ query: {} }); });
if (X.home) run('home w/ recent', function () { return X.home({ query: {} }); });

console.log('\n--- account ---');
if (A.login) run('login', function () { return A.login({ query: {} }); });
if (A.register) run('register', function () { return A.register({ query: {} }); });
if (A.forgot) run('forgot', function () { return A.forgot({ query: {} }); });
if (A.checkout) run('checkout (guest)', function () { return A.checkout('', {}); });
if (A.track) run('track (no id)', function () { return A.track('', {}); });

NK.loginDemo();
console.log('logged in as  ' + (NK.user() ? NK.user().name : '—'));
if (A.profile) run('profile', function () { return A.profile({ query: {} }); });
if (A.orders) run('orders empty', function () { return A.orders({ query: {} }); });
if (A.addresses) run('addresses', function () { return A.addresses({ query: {} }); });
if (A.settings) run('settings', function () { return A.settings({ query: {} }); });
if (A.checkout) {
  run('checkout address', function () { return A.checkout('address', {}); });
  run('checkout no step', function () { return A.checkout('', {}); });
  /* delivery and payment are gated on a chosen address — expect a bounce here */
  run('checkout delivery (no addr)', function () { return A.checkout('delivery', {}); });
  run('checkout payment (no addr)', function () { return A.checkout('payment', {}); });
}

if (NK.addressSave) {
  /* addressSave returns the saved address itself, not a result envelope */
  var sv = NK.addressSave({ name: 'Aarav Mehta', phone: '9876543210', line1: '12 Gali No 4', area: 'Model Town',
    city: 'Ludhiana', state: 'Punjab', pin: '141002', type: 'Home', isDefault: true });
  console.log('address saved ' + (sv && sv.id ? sv.id : 'FAILED'));
  if (sv && sv.id && NK.setCheckoutAddress) {
    NK.setCheckoutAddress(sv.id);
    console.log('draft addr    ' + (NK.checkoutAddress() ? NK.checkoutAddress().city : '—') +
      '   ship ' + (NK.checkoutShip() ? NK.checkoutShip().key : '—'));
    if (A.checkout) {
      run('checkout delivery', function () { return A.checkout('delivery', {}); });
      run('checkout payment', function () { return A.checkout('payment', {}); });
    }
  }
  var r = NK.placeOrder({ payment: 'upi', detail: 'Any UPI app',
    address: NK.defaultAddress(), shipping: NK.shipOptions('141002')[0] });
  console.log('order placed  ' + (r.ok ? r.order.id + '  ' + NK.money(r.order.total) : 'FAILED: ' + r.error));
  if (r.ok) {
    if (A.orders) run('orders filled', function () { return A.orders({ query: {} }); });
    if (A.orderDetail) run('order detail', function () { return A.orderDetail(r.order.id, {}); });
    if (A.track) run('track by id', function () { return A.track(r.order.id, {}); });
    if (A.checkout) run('checkout done', function () { return A.checkout('done', { id: r.order.id }); });
  }
}

console.log('\n' + (fails ? 'FAILURES: ' + fails + ' of ' + ran : 'all ' + ran + ' view renders clean'));
process.exit(fails ? 1 : 0);
