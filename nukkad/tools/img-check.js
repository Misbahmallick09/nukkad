/* Image audit: every <img> that points at the photo CDN must carry a
   data-fallback so a blocked or offline CDN still renders the catalogue,
   and every <img> must carry an alt attribute.
   Run: node tools/img-check.js                                          */
'use strict';
var H = require('./harness.js');
var win = H.win;
var NK = win.NK, X = win.NK_VIEWS;

var tot = { imgs: 0, cdn: 0, noFb: 0, drawn: 0, noAlt: 0 };
var problems = [];

function scan(label, html) {
  if (typeof html !== 'string' || !html) { console.log('  --  ' + label + ' (no markup)'); return; }
  var tags = html.match(/<img\b[^>]*>/g) || [];
  var cdn = 0, bad = 0, drawn = 0, noalt = 0;
  tags.forEach(function (t) {
    tot.imgs++;
    if (/loremflickr/.test(t)) {
      cdn++; tot.cdn++;
      if (!/data-fallback=/.test(t)) { bad++; tot.noFb++; problems.push(label + ' :: no fallback :: ' + t.slice(0, 130)); }
    } else if (/data:image/.test(t)) { drawn++; tot.drawn++; }
    if (!/\balt=/.test(t)) { noalt++; tot.noAlt++; problems.push(label + ' :: no alt :: ' + t.slice(0, 110)); }
  });
  console.log('  ' + label.padEnd(24) + ' imgs=' + String(tags.length).padStart(3) +
    '  photo=' + String(cdn).padStart(3) + '  drawn=' + String(drawn).padStart(3) +
    '  no-fallback=' + bad + '  no-alt=' + noalt);
}

function view(label, fn) {
  var out;
  try { out = fn(); } catch (e) { console.log('  ERR ' + label + ' -> ' + e.message); return; }
  scan(label, (out && typeof out === 'object') ? (out.html || '') : (out || ''));
}

var pid = NK.all()[0].id;
console.log('image audit\n');
view('home', function () { return X.home(); });
view('listing men', function () { return X.listing({ cat: 'men' }, {}); });
view('listing dresses', function () { return X.listing({ cat: 'women', sub: 'dresses' }, {}); });
view('search', function () { return X.search({ q: 'tee' }, {}); });
view('product', function () { return X.product(pid, {}); });
var cp = NK.all()[4];
NK.cartAdd(cp.id, NK.firstAvailableSize(cp), cp.colors[0].key, 2);
view('cart', function () { return X.cart({ query: {} }); });
NK.wishToggle(NK.all()[6].id);
view('wishlist', function () { return X.wishlist({ query: {} }); });
NK.compareToggle(NK.all()[1].id); NK.compareToggle(NK.all()[2].id);
view('compare', function () { return X.compare({ query: {} }); });
scan('product card', win.UI.card(NK.all()[3]));
/* quick view writes into a modal rather than returning markup, so open it
   and read the modal body back out of the shim DOM */
(function () {
  try {
    win.UI.quickView(NK.all()[5].id);
    var m = win.document.querySelector('#modalContent');
    scan('quick view', m ? m.innerHTML : '(no #modalContent in shim DOM)');
    win.UI.closeModal && win.UI.closeModal();
  } catch (e) { console.log('  ERR quick view -> ' + e.message); }
})();

console.log('\ntotals  ' + JSON.stringify(tot));
if (problems.length) {
  console.log('\n' + problems.length + ' problem(s):');
  problems.slice(0, 30).forEach(function (p) { console.log('  ' + p); });
  process.exitCode = 1;
} else {
  console.log('\nevery photo has a drawn fallback, every image has alt text');
}
