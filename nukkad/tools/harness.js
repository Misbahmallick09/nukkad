/* Minimal DOM shim so the render layer can be executed in Node.
   Not a browser — just enough surface to catch runtime errors in the
   HTML-building functions. Run: node tools/harness.js            */
'use strict';
var fs = require('fs'), path = require('path'), vm = require('vm');
var ROOT = path.join(__dirname, '..');

function El(tag) {
  this.tagName = (tag || 'div').toUpperCase();
  this.children = [];
  this.style = {};
  this.dataset = {};
  this.attrs = {};
  this.hidden = false;
  this._html = '';
  this.classList = {
    _s: {},
    add: function () {}, remove: function () {}, toggle: function () {},
    contains: function () { return false; }
  };
}
El.prototype.appendChild = function (c) { this.children.push(c); return c; };
El.prototype.removeChild = function () {};
El.prototype.setAttribute = function (k, v) { this.attrs[k] = String(v); };
El.prototype.getAttribute = function (k) { return k in this.attrs ? this.attrs[k] : null; };
El.prototype.removeAttribute = function (k) { delete this.attrs[k]; };
El.prototype.hasAttribute = function (k) { return k in this.attrs; };
El.prototype.addEventListener = function () {};
El.prototype.removeEventListener = function () {};
El.prototype.querySelector = function (s) { return stub(s); };
El.prototype.querySelectorAll = function () { return []; };
El.prototype.closest = function (s) { return stub(s); };
El.prototype.matches = function () { return false; };
El.prototype.contains = function () { return false; };
El.prototype.remove = function () {};
El.prototype.focus = function () {};
El.prototype.blur = function () {};
El.prototype.scrollIntoView = function () {};
El.prototype.getBoundingClientRect = function () {
  return { top: 0, left: 0, width: 300, height: 400, right: 300, bottom: 400 };
};
El.prototype.insertAdjacentHTML = function () {};
Object.defineProperty(El.prototype, 'innerHTML', {
  get: function () { return this._html; },
  set: function (v) { this._html = String(v); }
});
Object.defineProperty(El.prototype, 'textContent', {
  get: function () { return this._text || ''; },
  set: function (v) { this._text = String(v); }
});
Object.defineProperty(El.prototype, 'firstElementChild', {
  get: function () { return this.children[0] || null; }
});

var body = new El('body');

/* One memoized node per selector, so `qs('#hdr')` is stable across calls and
   boot() runs far enough to surface real errors instead of dying on null. */
var stubs = {};
function stub(sel) {
  var k = String(sel || 'x');
  if (!stubs[k]) {
    var e = new El(/^[a-z]+$/i.test(k) ? k : 'div');
    e.selector = k;
    e.value = '';
    e.checked = false;
    stubs[k] = e;
  }
  return stubs[k];
}

var doc = {
  body: body,
  documentElement: new El('html'),
  head: new El('head'),
  title: '',
  createElement: function (t) { return new El(t); },
  createDocumentFragment: function () { return new El('fragment'); },
  createTextNode: function (t) { var e = new El('#text'); e.textContent = t; return e; },
  querySelector: function (s) { return stub(s); },
  querySelectorAll: function () { return []; },
  getElementById: function (id) { return stub('#' + id); },
  addEventListener: function () {},
  removeEventListener: function () {},
  activeElement: body,
  readyState: 'complete',
  visibilityState: 'visible'
};

var store = {};
var win = {
  document: doc,
  location: { hash: '#/', href: 'file:///index.html', search: '', pathname: '/index.html' },
  history: { replaceState: function () {}, pushState: function () {} },
  navigator: { userAgent: 'node-harness', onLine: true, share: undefined, clipboard: undefined },
  localStorage: {
    getItem: function (k) { return k in store ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    clear: function () { store = {}; }
  },
  matchMedia: function () { return { matches: false, addEventListener: function () {}, addListener: function () {} }; },
  addEventListener: function () {},
  removeEventListener: function () {},
  requestAnimationFrame: function (fn) { return setTimeout(fn, 0); },
  cancelAnimationFrame: function (id) { clearTimeout(id); },
  IntersectionObserver: function () {
    this.observe = function () {}; this.unobserve = function () {}; this.disconnect = function () {};
  },
  scrollTo: function () {},
  scrollY: 0,
  innerWidth: 1440,
  innerHeight: 900,
  devicePixelRatio: 1,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: function () { return 0; },
  clearInterval: clearInterval,
  console: console,
  btoa: function (s) { return Buffer.from(s, 'binary').toString('base64'); },
  encodeURIComponent: encodeURIComponent,
  decodeURIComponent: decodeURIComponent,
  Math: Math, Date: Date, JSON: JSON, Object: Object, Array: Array,
  String: String, Number: Number, Boolean: Boolean, RegExp: RegExp,
  Error: Error, isNaN: isNaN, parseInt: parseInt, parseFloat: parseFloat,
  Promise: Promise, Map: Map, Set: Set
};
win.window = win;
win.self = win;
win.globalThis = win;

var ctx = vm.createContext(win);
var FILES = ['data.js', 'imagery.js', 'store.js', 'ui.js', 'views.js', 'account.js', 'app.js'];
var loaded = [];
FILES.forEach(function (f) {
  var p = path.join(ROOT, 'assets/js', f);
  if (!fs.existsSync(p)) return;
  try {
    vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
    loaded.push(f);
  } catch (e) {
    console.log('LOAD FAIL  ' + f + '  ->  ' + e.message);
    if (process.env.NK_TRACE) console.log(e.stack);
  }
});
console.log('loaded: ' + loaded.join(', '));
module.exports = { win: win, doc: doc, El: El, ctx: ctx, stub: stub };
