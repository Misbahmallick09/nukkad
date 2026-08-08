/* ==========================================================================
   NUKKAD — account: auth, dashboard, orders, addresses, checkout, tracking
   ========================================================================== */
(function (w, d) {
  'use strict';

  var NK = w.NK, U = w.UI, IMG = w.NK_IMG, X = w.NK_VIEWS;
  var qs = U.qs, qsa = U.qsa, esc = U.esc, attr = U.attr, icon = U.icon;
  var V = NK.V;
  var A = {};

  function go(hash, force) {
    if (w.NK_APP) w.NK_APP.go(hash, force);
    else w.location.hash = hash || '#/';
  }
  function initials(name) {
    return String(name || 'NK').trim().split(/\s+/).slice(0, 2)
      .map(function (p) { return p.charAt(0).toUpperCase(); }).join('');
  }
  /* a "next" hop survives the login round-trip so nobody loses their place */
  function nextOf(q) {
    var n = q && q.next ? decodeURIComponent(q.next) : '';
    return /^#\//.test(n) ? n : '';
  }

  /* ======================================================================
     AUTH
     ====================================================================== */
  function pwField(id, label, o) {
    o = o || {};
    return "<div class='pwtoggle'>" +
      U.field({ id: id, label: label, type: 'password', autocomplete: o.autocomplete || 'current-password',
        placeholder: o.placeholder || '', hint: o.hint }) +
      "<button class='pwtoggle__b' type='button' data-pw='" + attr(id) + "'" +
        " aria-label='Show password' aria-pressed='false'>" + icon('eye') + "</button></div>";
  }
  function wirePwToggles(root) {
    U.on(root, 'click', '[data-pw]', function (e, t) {
      var inp = qs('#' + t.getAttribute('data-pw'), root);
      if (!inp) return;
      var show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      t.setAttribute('aria-pressed', show ? 'true' : 'false');
      t.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      inp.focus();
    });
  }
  /* strength is advisory only — NK.pwStrength scores 0..5, the meter shows 5 bars */
  var PW_COLORS = ['var(--verm)', 'var(--verm)', 'var(--warn)', 'var(--warn)', 'var(--ok)', 'var(--ok)'];
  function pwMeterHtml() {
    var bars = '';
    for (var i = 0; i < 5; i++) bars += "<i class='pwmeter__s'></i>";
    return "<div class='pwmeter' id='pwMeter' aria-hidden='true'>" + bars + "</div>" +
      "<p class='pwmeter__t' id='pwWord'>Use at least 8 characters</p>";
  }
  function wirePwMeter(root, id) {
    var inp = qs('#' + id, root), meter = qs('#pwMeter', root), word = qs('#pwWord', root);
    if (!inp || !meter || !word) return;
    inp.addEventListener('input', function () {
      var s = NK.pwStrength(inp.value);
      qsa('.pwmeter__s', meter).forEach(function (b, i) {
        b.style.background = i < s.score ? PW_COLORS[s.score] : 'var(--wash-2)';
      });
      word.textContent = inp.value ? s.label : 'Use at least 8 characters';
      word.style.color = inp.value ? PW_COLORS[s.score] : 'var(--muted)';
    });
  }

  function authShell(o) {
    return "<div class='auth'><div class='authbox'>" +
      "<p class='authbox__k'>" + esc(o.kicker) + "</p>" +
      "<h1 class='authbox__t dsp'>" + esc(o.title) + "</h1>" +
      "<p class='authbox__s'>" + esc(o.sub) + "</p>" +
      "<form class='authbox__f' id='" + attr(o.formId) + "' novalidate>" + o.form + "</form>" +
      (o.demo ? "<div class='authbox__demo'>" + icon('spark') +
        "<div>This is a demonstration store. Use <b>demo@nukkad.example</b> with the password " +
        "<b>nukkad123</b>, or make an account — either way nothing leaves your browser." +
        "<br><button class='lnk' type='button' id='useDemo' style='margin-top:6px'>Fill the demo login</button></div></div>" : '') +
      "<p class='authbox__alt'>" + o.alt + "</p>" +
      "</div></div>";
  }

  A.login = function (m, q) {
    if (NK.isAuthed()) { go(nextOf(q) || '#/account', true); return { title: 'My account — NUKKAD', html: '' }; }
    var next = nextOf(q);
    var html = authShell({
      kicker: 'Welcome back', title: 'Log in', formId: 'loginForm', demo: true,
      sub: 'Your bag, wishlist and addresses are already waiting.',
      form:
        U.field({ id: 'email', label: 'Email address', type: 'email', autocomplete: 'email',
          placeholder: 'you@example.com', autofocus: true }) +
        pwField('password', 'Password', { autocomplete: 'current-password' }) +
        "<div class='authbox__row'><a class='lnk' href='#/forgot'>Forgot your password?</a></div>" +
        "<button class='btn btn--lg btn--pri btn--wide' type='submit' id='loginBtn'>Log in</button>",
      alt: "New here? <a class='lnk' href='#/register" + (next ? '?next=' + encodeURIComponent(next) : '') + "'>Create an account</a>"
    });

    return {
      title: 'Log in — NUKKAD',
      desc: 'Log in to your NUKKAD account to see your orders, addresses and wishlist.',
      html: html,
      mounted: function (root) {
        wirePwToggles(root);
        var rules = { email: V.email, password: V.required };
        U.liveValidate(root, rules);

        U.on(root, 'click', '#useDemo', function () {
          qs('#email', root).value = 'demo@nukkad.example';
          qs('#password', root).value = 'nukkad123';
          U.setFieldError(root, 'email', '');
          U.setFieldError(root, 'password', '');
          qs('#loginBtn', root).focus();
        });

        U.on(root, 'submit', '#loginForm', function (e) {
          e.preventDefault();
          if (!U.validate(root, rules)) return;
          var btn = qs('#loginBtn', root), f = U.readForm(root, ['email', 'password']);
          U.busy(btn, true, 'Logging in…');
          U.pretend(560).then(function () {
            /* the demo account is seeded on first use, so it works on a fresh browser */
            var demo = f.email.trim().toLowerCase() === 'demo@nukkad.example';
            var r = demo && f.password === 'nukkad123' ? NK.loginDemo() : NK.login(f.email, f.password);
            U.busy(btn, false);
            if (!r.ok) {
              if (r.field) U.setFieldError(root, r.field, r.msg);
              U.err(r.msg);
              return;
            }
            U.ok(r.msg);
            go(next || '#/account', true);
          });
        });
      }
    };
  };

  A.register = function (m, q) {
    if (NK.isAuthed()) { go(nextOf(q) || '#/account', true); return { title: 'My account — NUKKAD', html: '' }; }
    var next = nextOf(q);
    var html = authShell({
      kicker: 'Join the corner', title: 'Create account', formId: 'regForm',
      sub: 'One account for orders, saved addresses and a wishlist that survives a refresh.',
      form:
        U.field({ id: 'name', label: 'Full name', autocomplete: 'name', placeholder: 'Aarav Mehta', autofocus: true }) +
        U.field({ id: 'email', label: 'Email address', type: 'email', autocomplete: 'email', placeholder: 'you@example.com' }) +
        U.field({ id: 'phone', label: 'Mobile number', type: 'tel', autocomplete: 'tel', inputmode: 'numeric',
          placeholder: '9876543210', hint: 'For delivery updates only.' }) +
        pwField('password', 'Password', { autocomplete: 'new-password', placeholder: 'At least 8 characters' }) +
        pwMeterHtml() +
        "<label class='check' style='margin:16px 0 18px'><input type='checkbox' id='terms' checked>" +
          "<span>Send me an email when a drop lands. No more than twice a month.</span></label>" +
        "<button class='btn btn--lg btn--pri btn--wide' type='submit' id='regBtn'>Create my account</button>",
      alt: "Already have one? <a class='lnk' href='#/login" + (next ? '?next=' + encodeURIComponent(next) : '') + "'>Log in</a>"
    });

    return {
      title: 'Create an account — NUKKAD',
      desc: 'Create a NUKKAD account to track orders and save your wishlist.',
      html: html,
      mounted: function (root) {
        wirePwToggles(root);
        wirePwMeter(root, 'password');
        var rules = { name: V.name, email: V.email, phone: V.phone, password: V.password };
        U.liveValidate(root, rules);

        U.on(root, 'submit', '#regForm', function (e) {
          e.preventDefault();
          if (!U.validate(root, rules)) return;
          var btn = qs('#regBtn', root), f = U.readForm(root, ['name', 'email', 'phone', 'password']);
          U.busy(btn, true, 'Creating…');
          U.pretend(680).then(function () {
            var r = NK.register(f);
            U.busy(btn, false);
            if (!r.ok) {
              if (r.field) U.setFieldError(root, r.field, r.msg);
              U.err(r.msg);
              return;
            }
            U.ok(r.msg);
            go(next || '#/account', true);
          });
        });
      }
    };
  };

  A.forgot = function () {
    var html = authShell({
      kicker: 'Password help', title: 'Reset password', formId: 'fgForm',
      sub: 'Enter the email on your account and we will send a reset link.',
      form:
        U.field({ id: 'email', label: 'Email address', type: 'email', autocomplete: 'email',
          placeholder: 'you@example.com', autofocus: true }) +
        "<button class='btn btn--lg btn--pri btn--wide' type='submit' id='fgBtn'>Send reset link</button>" +
        "<div id='fgDone'></div>",
      alt: "Remembered it? <a class='lnk' href='#/login'>Back to log in</a>"
    });

    return {
      title: 'Reset your password — NUKKAD',
      html: html,
      mounted: function (root) {
        var rules = { email: V.email };
        U.liveValidate(root, rules);
        U.on(root, 'submit', '#fgForm', function (e) {
          e.preventDefault();
          if (!U.validate(root, rules)) return;
          var btn = qs('#fgBtn', root), f = U.readForm(root, ['email']);
          U.busy(btn, true, 'Sending…');
          U.pretend(700).then(function () {
            var r = NK.resetRequest(f.email);
            U.busy(btn, false);
            if (!r.ok) { U.setFieldError(root, 'email', r.msg); U.err(r.msg); return; }
            U.ok(r.msg);
            qs('#fgDone', root).innerHTML = "<div class='note' style='margin-top:16px'>" +
              esc(r.msg) + " Nothing is actually emailed on this demo — " +
              "<a class='lnk' href='#/login'>log in</a> with your existing password.</div>";
          });
        });
      }
    };
  };

  /* ======================================================================
     ACCOUNT SHELL
     ====================================================================== */
  var NAV = [
    { key: 'profile', href: '#/account', label: 'Profile', ic: 'user' },
    { key: 'orders', href: '#/account/orders', label: 'My orders', ic: 'box' },
    { key: 'wishlist', href: '#/wishlist', label: 'Wishlist', ic: 'heart' },
    { key: 'addresses', href: '#/account/addresses', label: 'Saved addresses', ic: 'pin' },
    { key: 'settings', href: '#/account/settings', label: 'Account settings', ic: 'lock' }
  ];

  /* Anything under /account needs a session. Rather than bouncing straight to
     the login page we return a real view that explains why. */
  function gate(hash, what) {
    return {
      title: 'Log in — NUKKAD',
      html: "<div class='wrap'>" + U.state({
        artKind: 'warn', title: 'Log in to see ' + what,
        body: 'Your orders, addresses and account settings live behind a login. It takes a moment, and the demo account is pre-filled for you.',
        actions: "<a class='btn btn--pri' href='#/login?next=" + encodeURIComponent(hash) + "'>Log in</a>" +
          "<a class='btn btn--ghost' href='#/register?next=" + encodeURIComponent(hash) + "'>Create an account</a>"
      }) + "</div>"
    };
  }

  function acctShell(active, title, body, o) {
    o = o || {};
    var u = NK.user(), counts = { orders: NK.orders().length, wishlist: NK.wishCount(),
      addresses: NK.addresses().length };
    return "<div class='wrap'>" +
      "<nav class='crumb' aria-label='Breadcrumb'><a href='#/'>Home</a>" + icon('chev') +
        (active === 'profile' ? "<span aria-current='page'>My account</span>"
          : "<a href='#/account'>My account</a>" + icon('chev') + "<span aria-current='page'>" + esc(title) + "</span>") +
      "</nav>" +
      "<div class='phead'><h1 class='phead__t dsp'>" + esc(title) + "</h1>" +
        (o.sub ? "<p class='phead__c'>" + esc(o.sub) + "</p>" : '') + "</div>" +
      "<div class='acctpage'>" +
        "<aside class='asidenav'>" +
          "<div class='asidenav__u'><span class='asidenav__av' aria-hidden='true'>" +
            esc(initials(u && u.name)) + "</span>" +
            "<span><b>" + esc(u ? u.name : 'Guest') + "</b>" +
            "<span>" + esc(u ? u.email : '') + "</span></span></div>" +
          NAV.map(function (n) {
            var c = counts[n.key];
            return "<a class='asidenav__l" + (n.key === active ? ' is-on' : '') + "' href='" + n.href + "'" +
              (n.key === active ? " aria-current='page'" : '') + ">" + icon(n.ic) +
              "<span>" + esc(n.label) + "</span>" + (c ? "<i>" + c + "</i>" : '') + "</a>";
          }).join('') +
          "<button class='asidenav__l asidenav__l--danger' type='button' id='logoutBtn'>" +
            icon('arrowR') + "<span>Log out</span></button>" +
        "</aside>" +
        "<div class='atabs' role='tablist' aria-label='Account sections'>" +
          NAV.map(function (n) {
            return "<a class='chip" + (n.key === active ? ' is-on' : '') + "' href='" + n.href + "'>" +
              esc(n.label) + "</a>";
          }).join('') + "</div>" +
        "<div>" + body + "</div>" +
      "</div></div>";
  }

  /* logout is offered from every account page, so wire it in one place */
  function wireShell(root) {
    U.on(root, 'click', '#logoutBtn', function () {
      U.confirm({
        title: 'Log out?', body: 'Your cart and wishlist stay on this device — you just will not see your orders until you log back in.',
        confirm: 'Log out', cancel: 'Stay logged in'
      }).then(function (yes) {
        if (!yes) return;
        NK.logout();
        U.info('Logged out.');
        go('#/', true);
      });
    });
  }

  /* ======================================================================
     PROFILE / DASHBOARD
     ====================================================================== */
  A.profile = function () {
    if (!NK.isAuthed()) return gate('#/account', 'your account');
    var u = NK.user(), s = NK.orderStats(), recent = NK.orders().slice(0, 2);
    var addr = NK.defaultAddress();

    var body =
      "<div class='stats'>" +
        stat('Orders placed', s.total, s.live ? s.live + ' still in transit' : 'Nothing in transit') +
        stat('Total spent', NK.money(s.spent), 'Across all orders') +
        stat('You saved', NK.money(s.saved), 'On discounts and coupons') +
        stat('Wishlist', NK.wishCount(), 'Pieces saved for later') +
      "</div>" +

      "<div class='panel'><h2 class='panel__t'>Your details</h2>" +
        "<p class='panel__s'>Used for delivery updates. Your email is the login and cannot be changed here.</p>" +
        "<form id='profForm' novalidate>" +
          U.field({ id: 'name', label: 'Full name', value: u.name, autocomplete: 'name' }) +
          U.field({ id: 'email', label: 'Email address', value: u.email, type: 'email', disabled: true,
            hint: 'Contact care@nukkad.example to change the email on an account.' }) +
          U.field({ id: 'phone', label: 'Mobile number', value: u.phone, type: 'tel', inputmode: 'numeric',
            autocomplete: 'tel', placeholder: '9876543210' }) +
          "<button class='btn btn--pri' type='submit' id='profBtn'>Save changes</button>" +
        "</form></div>" +

      "<div class='panel'><h2 class='panel__t'>Default address</h2>" +
        (addr
          ? "<p class='panel__s'>Where your orders go unless you pick another at checkout.</p>" + addrHtml(addr, { plain: true }) +
            "<a class='btn btn--ghost btn--sm' href='#/account/addresses'>Manage addresses</a>"
          : "<p class='panel__s'>No address saved yet. Add one now and checkout becomes two taps.</p>" +
            "<a class='btn btn--sm' href='#/account/addresses'>Add an address</a>") +
      "</div>" +

      "<div class='panel'><h2 class='panel__t'>Recent orders</h2>" +
        (recent.length
          ? "<p class='panel__s'>Your two most recent orders.</p>" +
            recent.map(function (o) { return ordCard(o, { compact: true }); }).join('') +
            "<a class='btn btn--ghost btn--sm' href='#/account/orders'>See all " + s.total + " orders</a>"
          : "<p class='panel__s'>Nothing ordered yet — when you do, it shows up here with live tracking.</p>" +
            "<a class='btn btn--sm' href='#/new'>Browse new arrivals</a>") +
      "</div>";

    return {
      title: 'My account — NUKKAD',
      html: acctShell('profile', 'My account', body, { sub: 'Hello, ' + u.name.split(' ')[0] + '.' }),
      mounted: function (root) {
        wireShell(root);
        wireOrderCards(root);
        var rules = { name: V.name, phone: V.phone };
        U.liveValidate(root, rules);
        U.on(root, 'submit', '#profForm', function (e) {
          e.preventDefault();
          if (!U.validate(root, rules)) return;
          var btn = qs('#profBtn', root), f = U.readForm(root, ['name', 'phone']);
          U.busy(btn, true, 'Saving…');
          U.pretend(500).then(function () {
            U.busy(btn, false);
            U.fromResult(NK.updateProfile(f), 'Profile updated.');
            go('#/account', true);
          });
        });
      }
    };
  };

  function stat(label, value, note) {
    return "<div class='stat'><p class='stat__l'>" + esc(label) + "</p>" +
      "<p class='stat__v dsp'>" + esc(String(value)) + "</p>" +
      "<p class='stat__d'>" + esc(note) + "</p></div>";
  }

  /* ======================================================================
     ADDRESSES
     ====================================================================== */
  /* One renderer for three jobs: a plain read-only block on the dashboard,
     a pickable radio row at checkout, and an editable row in the address book. */
  function addrLines(a) {
    return [a.line, a.area, a.city + ' ' + a.pin, a.state].filter(Boolean).join(', ');
  }
  function addrHtml(a, o) {
    o = o || {};
    var body =
      "<div class='addr__b'>" +
        "<p class='addr__n'>" + esc(a.name) +
          (a.type ? "<span class='addr__type'>" + esc(a.type) + "</span>" : '') +
          (a.isDefault ? "<span class='addr__type'>Default</span>" : '') + "</p>" +
        "<p class='addr__l'>" + esc(addrLines(a)) + "</p>" +
        "<p class='addr__p'>" + esc(a.phone) + "</p>" +
        (o.acts
          ? "<div class='addr__acts'>" +
              "<button type='button' data-addredit='" + attr(a.id) + "'>Edit</button>" +
              (a.isDefault ? '' : "<button type='button' data-addrdef='" + attr(a.id) + "'>Make default</button>") +
              "<button type='button' class='is-danger' data-addrdrop='" + attr(a.id) + "'>Delete</button>" +
            "</div>"
          : '') +
      "</div>";
    if (o.plain) return "<div class='addr' style='cursor:default'>" + body + "</div>";
    if (o.pick) {
      return "<button class='addr" + (o.on ? ' is-on' : '') + "' type='button' data-addrpick='" + attr(a.id) + "'" +
        " role='radio' aria-checked='" + (o.on ? 'true' : 'false') + "'>" +
        "<span class='addr__r' aria-hidden='true'></span>" + body + "</button>";
    }
    return "<div class='addr" + (a.isDefault ? ' is-on' : '') + "' style='cursor:default'>" +
      "<span class='addr__r' aria-hidden='true'></span>" + body + "</div>";
  }

  var ADDR_TYPES = [{ value: 'Home', label: 'Home' }, { value: 'Work', label: 'Work' }, { value: 'Other', label: 'Other' }];
  var STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha',
    'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

  function addrForm(a, o) {
    a = a || {}; o = o || {};
    return "<form id='addrForm' novalidate>" +
      "<input type='hidden' id='addrId' value='" + attr(a.id || '') + "'>" +
      "<div class='grid2'>" +
        U.field({ id: 'aname', label: 'Full name', value: a.name, autocomplete: 'name', placeholder: 'Aarav Mehta' }) +
        U.field({ id: 'aphone', label: 'Mobile number', value: a.phone, type: 'tel', inputmode: 'numeric',
          autocomplete: 'tel', placeholder: '9876543210' }) +
      "</div>" +
      U.field({ id: 'aline', label: 'Flat, house number and street', value: a.line,
        autocomplete: 'address-line1', placeholder: '12B, Sunder Nagar, 4th Cross' }) +
      U.field({ id: 'aarea', label: 'Area, colony or landmark', value: a.area, optional: true,
        autocomplete: 'address-line2', placeholder: 'Near Kammanahalli market' }) +
      "<div class='grid2'>" +
        U.field({ id: 'apin', label: 'PIN code', value: a.pin, inputmode: 'numeric', max: 6,
          autocomplete: 'postal-code', placeholder: '560043' }) +
        U.field({ id: 'acity', label: 'City', value: a.city, autocomplete: 'address-level2', placeholder: 'Bengaluru' }) +
      "</div>" +
      "<div class='grid2'>" +
        U.field({ id: 'astate', label: 'State', value: a.state || 'Karnataka', tag: 'select',
          options: STATES.map(function (s) { return { value: s, label: s }; }) }) +
        U.field({ id: 'atype', label: 'Address type', value: a.type || 'Home', tag: 'select', options: ADDR_TYPES }) +
      "</div>" +
      "<label class='check' style='margin:4px 0 18px'><input type='checkbox' id='adefault'" +
        (a.isDefault ? ' checked' : '') + "><span>Use this as my default address</span></label>" +
      "<div class='minirow' style='gap:9px'>" +
        "<button class='btn btn--pri' type='submit' id='addrSave'>" + esc(o.submit || 'Save address') + "</button>" +
        (o.noCancel ? '' : "<button class='btn btn--ghost' type='button' id='addrCancel'>Cancel</button>") +
      "</div></form>";
  }
  var ADDR_RULES = { aname: V.name, aphone: V.phone, aline: V.address, apin: V.pin, acity: V.required };

  /* Reads the form, fills city/state from the PIN when the shopper left them alone. */
  function readAddr(root) {
    var f = U.readForm(root, ['addrId', 'aname', 'aphone', 'aline', 'aarea', 'apin', 'acity', 'astate', 'atype']);
    var box = qs('#adefault', root);
    return { id: f.addrId || '', name: f.aname.trim(), phone: f.aphone.trim(), line: f.aline.trim(),
      area: f.aarea.trim(), pin: f.apin.trim(), city: f.acity.trim(), state: f.astate, type: f.atype,
      isDefault: !!(box && box.checked) };
  }

  /* ======================================================================
     ORDER CARDS
     ====================================================================== */
  function stPill(k) {
    var m = NK.statusMeta(k);
    return "<span class='st st--" + k + "'><i></i>" + esc(m.label) + "</span>";
  }
  function hi(label, value, mono) {
    return "<div class='ordcard__hi'><span>" + esc(label) + "</span>" +
      "<b" + (mono ? " class='mono'" : '') + ">" + esc(value) + "</b></div>";
  }
  function ordLine(it) {
    var p = NK.byId(it.id);
    var src = p ? U.srcPair(p, it.colorHex, 'front', 200, true) : '';
    var name = "<span class='ordline__n'>" + esc(it.name) + "</span>";
    return "<div class='ordline'>" +
      "<a class='ordline__m' href='#/p/" + attr(it.id) + "'>" +
        (src ? "<img" + src + " alt='" + attr(it.name) + "' width='58' height='74' loading='lazy'>" : '') + "</a>" +
      "<div class='ordline__b'>" +
        (p ? "<a href='#/p/" + attr(it.id) + "'>" + name + "</a>" : name) +
        "<p class='ordline__v'>" + esc(it.colorName) + " · Size " + esc(it.size) + " · Qty " + it.qty + "</p>" +
      "</div>" +
      "<span class='ordline__p'>" + esc(NK.money(it.lineTotal)) + "</span>" +
    "</div>";
  }
  /* compact cards show two lines and a count; the orders list shows everything */
  function ordCard(o, opt) {
    opt = opt || {};
    var items = opt.compact ? o.items.slice(0, 2) : o.items;
    var more = o.items.length - items.length;
    var open = o.status !== 'delivered' && o.status !== 'cancelled';
    return "<article class='ordcard' data-ord='" + attr(o.id) + "'>" +
      "<header class='ordcard__h'>" +
        hi('Order', o.id, true) +
        hi('Placed', NK.fmtDate(o.created)) +
        (opt.compact ? '' : hi('Payment', o.paymentLabel)) +
        (opt.compact ? '' : hi(o.status === 'cancelled' ? 'Was due' : 'Arriving', NK.fmtDate(o.eta))) +
        "<span class='ordcard__st'>" + stPill(o.status) + "</span>" +
      "</header>" +
      "<div class='ordcard__b'>" + items.map(ordLine).join('') +
        (more > 0 ? "<div class='ordline'><span class='ordline__v'>+ " + more + ' more ' +
          NK.plural(more, 'item') + " in this order</span></div>" : '') +
      "</div>" +
      "<footer class='ordcard__f'>" +
        "<span class='ordcard__tot'>Total paid<b>" + esc(NK.money(o.total)) + "</b></span>" +
        (open ? "<a class='btn btn--sm btn--ghost' href='#/track/" + attr(o.id) + "'>Track</a>" : '') +
        "<a class='btn btn--sm btn--ghost' href='#/account/orders/" + attr(o.id) + "'>Details</a>" +
        (opt.compact ? '' :
          "<button class='btn btn--sm btn--ghost' type='button' data-ordagain='" + attr(o.id) + "'>Buy again</button>" +
          (NK.cancellable(o) ? "<button class='btn btn--sm btn--danger' type='button' data-ordcancel='" +
            attr(o.id) + "'>Cancel</button>" : '')) +
      "</footer>" +
    "</article>";
  }
  /* one delegated listener covers every card on the page */
  function wireOrderCards(root) {
    U.on(root, 'click', '[data-ordagain]', function (e, t) {
      U.busy(t, true, 'Adding…');
      U.pretend(420).then(function () {
        U.busy(t, false);
        U.fromResult(NK.reorder(t.getAttribute('data-ordagain')));
        U.refreshBadges();
      });
    });
    U.on(root, 'click', '[data-ordcancel]', function (e, t) {
      var id = t.getAttribute('data-ordcancel');
      U.confirm({
        title: 'Cancel order ' + id + '?', danger: true,
        body: 'The order stops where it is and any payment is refunded in 3–5 working days. This cannot be undone.',
        confirm: 'Cancel the order', cancel: 'Keep it'
      }).then(function (yes) {
        if (!yes) return;
        var r = NK.cancelOrder(id);
        U.fromResult(r);
        if (r.ok) go(w.location.hash, true);
      });
    });
  }

  /* ======================================================================
     MY ORDERS
     ====================================================================== */
  var ORD_TABS = [
    { key: 'all', label: 'All orders' },
    { key: 'open', label: 'In progress' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' }
  ];
  function ordFilter(list, tab) {
    if (tab === 'open') return list.filter(function (o) { return NK.cancellable(o) || o.status === 'out'; });
    if (tab === 'delivered') return list.filter(function (o) { return o.status === 'delivered'; });
    if (tab === 'cancelled') return list.filter(function (o) { return o.status === 'cancelled'; });
    return list;
  }

  A.orders = function (m, q) {
    if (!NK.isAuthed()) return gate('#/account/orders', 'your orders');
    NK.progress();
    var all = NK.orders();
    var tab = (q && q.tab) || 'all';
    if (!ORD_TABS.some(function (t) { return t.key === tab; })) tab = 'all';
    var list = ordFilter(all, tab);

    var body = !all.length
      ? U.state({ artKind: 'box', title: 'No orders yet',
          body: 'Once you place an order it lands here with live tracking, invoices and a one-tap reorder.',
          actions: "<a class='btn btn--pri' href='#/new'>Shop new arrivals</a>" +
            "<a class='btn btn--ghost' href='#/trending'>See what is trending</a>" })
      : "<div class='chips' style='margin-bottom:16px'>" +
          ORD_TABS.map(function (t) {
            var n = ordFilter(all, t.key).length;
            return "<a class='chip" + (t.key === tab ? ' is-on' : '') + "' href='#/account/orders?tab=" +
              t.key + "'>" + esc(t.label) + (n ? " <b>" + n + "</b>" : '') + "</a>";
          }).join('') +
        "</div>" +
        (list.length
          ? list.map(function (o) { return ordCard(o); }).join('')
          : U.state({ artKind: 'box', title: 'Nothing in this tab',
              body: 'You have ' + all.length + ' ' + NK.plural(all.length, 'order') + ' in total — try another tab.',
              actions: "<a class='btn btn--ghost' href='#/account/orders'>Show all orders</a>" }));

    return {
      title: 'My orders — NUKKAD',
      html: acctShell('orders', 'My orders', body, {
        sub: all.length ? all.length + ' ' + NK.plural(all.length, 'order') + ' placed with us so far.' : '' }),
      mounted: function (root) { wireShell(root); wireOrderCards(root); }
    };
  };

  /* ======================================================================
     ORDER DETAIL
     ====================================================================== */
  function rowLine(label, value, o) {
    o = o || {};
    return "<div class='srow" + (o.mod ? ' srow--' + o.mod : '') + "'><span>" + esc(label) + "</span>" +
      "<b>" + esc(value) + "</b></div>";
  }
  function payRows(o) {
    return "<div class='pricebox'>" +
      rowLine('Items at MRP', NK.money(o.mrp)) +
      (o.mrp > o.subtotal ? rowLine('Product discount', '- ' + NK.money(o.mrp - o.subtotal), { mod: 'save' }) : '') +
      (o.couponAmount ? rowLine('Coupon ' + o.coupon, '- ' + NK.money(o.couponAmount), { mod: 'save' }) : '') +
      rowLine('Delivery', o.shippingFee ? NK.money(o.shippingFee) : 'Free',
        { mod: o.shippingFee ? '' : 'free' }) +
      (o.codFee ? rowLine('Cash on delivery fee', NK.money(o.codFee)) : '') +
      rowLine('Total paid', NK.money(o.total), { mod: 'tot' }) +
    "</div>";
  }

  A.orderDetail = function (id) {
    if (!NK.isAuthed()) return gate('#/account/orders', 'your orders');
    NK.progress();
    var o = NK.orderById(id);
    if (!o) {
      return {
        title: 'Order not found — NUKKAD',
        html: acctShell('orders', 'Order not found', U.state({
          artKind: 'warn', title: 'We cannot find that order',
          body: 'The order ID ' + (id || '—') + ' is not on this account. Check the ID, or pick the order from your list.',
          actions: "<a class='btn btn--pri' href='#/account/orders'>My orders</a>" +
            "<a class='btn btn--ghost' href='#/track'>Track by ID</a>" }))
      };
    }
    var open = NK.cancellable(o) || o.status === 'out';
    var body =
      "<div class='panel'>" +
        "<div class='ordcard__h' style='margin:-24px -24px 18px;border-radius:0'>" +
          hi('Order', o.id, true) + hi('Placed', NK.fmtDateTime(o.created)) +
          "<span class='ordcard__st'>" + stPill(o.status) + "</span>" +
        "</div>" +
        "<div class='phead__acts' style='margin:0 0 4px'>" +
          (open ? "<a class='btn btn--sm btn--pri' href='#/track/" + attr(o.id) + "'>" +
            icon('truck') + "Track this order</a>" : '') +
          "<button class='btn btn--sm btn--ghost' type='button' data-ordagain='" + attr(o.id) + "'>Buy it again</button>" +
          "<button class='btn btn--sm btn--ghost' type='button' id='ordCopy'>" + icon('copy') + "Copy order ID</button>" +
          (NK.cancellable(o) ? "<button class='btn btn--sm btn--danger' type='button' data-ordcancel='" +
            attr(o.id) + "'>Cancel order</button>" : '') +
        "</div>" +
      "</div>" +
      "<div class='panel'><h2 class='panel__t'>" + o.items.length + ' ' +
        NK.plural(o.items.length, 'item') + "</h2>" +
        "<p class='panel__s'>Prices are what you paid on " + esc(NK.fmtDate(o.created)) + ".</p>" +
        "<div class='ordcard__b' style='padding:0'>" + o.items.map(ordLine).join('') + "</div></div>" +
      "<div class='panel'><h2 class='panel__t'>Payment</h2>" +
        "<p class='panel__s'>" + esc(o.paymentLabel) +
          (o.paymentDetail ? ' · ' + esc(o.paymentDetail) : '') + " · " + esc(o.paymentStatus) +
          (o.paymentRef ? ' · ref ' + esc(o.paymentRef) : '') + "</p>" +
        payRows(o) +
        (o.saving ? "<p class='panel__s' style='margin:12px 0 0;color:var(--ok)'>You saved " +
          esc(NK.money(o.saving)) + " on this order.</p>" : '') +
      "</div>" +
      "<div class='panel'><h2 class='panel__t'>Delivery address</h2>" +
        "<p class='panel__s'>" + esc(o.shipping ? o.shipping.name : 'Standard delivery') +
          (o.status === 'delivered' ? ' · delivered ' + esc(NK.fmtDate(o.updated))
            : o.status === 'cancelled' ? ' · order cancelled'
            : ' · arriving by ' + esc(NK.fmtDate(o.eta))) + "</p>" +
        addrHtml(o.address, { plain: true }) +
      "</div>";

    return {
      title: 'Order ' + o.id + ' — NUKKAD',
      html: acctShell('orders', 'Order details', body, { sub: 'Order ' + o.id + '.' }),
      mounted: function (root) {
        wireShell(root);
        wireOrderCards(root);
        U.on(root, 'click', '#ordCopy', function (e, t) { copyText(o.id, t); });
      }
    };
  };

  /* clipboard is not available from file:// in every browser, so fall back to select-all */
  function copyText(text, btn) {
    function done() { U.ok('Order ID copied.', text); }
    if (w.navigator && w.navigator.clipboard && w.navigator.clipboard.writeText) {
      w.navigator.clipboard.writeText(text).then(done, function () { U.info('Copy it manually: ' + text); });
      return;
    }
    var ta = d.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', 'readonly');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    d.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = d.execCommand('copy'); } catch (err) { ok = false; }
    d.body.removeChild(ta);
    if (btn) btn.focus();
    if (ok) done(); else U.info('Copy it manually: ' + text);
  }

  /* ======================================================================
     SAVED ADDRESSES
     ====================================================================== */
  A.addresses = function () {
    if (!NK.isAuthed()) return gate('#/account/addresses', 'your saved addresses');
    var list = NK.addresses();

    var body =
      "<div class='panel'><h2 class='panel__t'>Saved addresses</h2>" +
        "<p class='panel__s'>" + (list.length
          ? 'Pick one at checkout, or set a default so you never have to.'
          : 'Add an address once and checkout becomes two taps.') + "</p>" +
        (list.length ? "<div class='addrs'>" +
          list.map(function (a) { return addrHtml(a, { acts: true }); }).join('') + "</div>" : '') +
        "<button class='addnew' type='button' id='addrNew'>" + icon('plus') + "Add a new address</button>" +
      "</div>" +
      "<div class='panel' id='addrPanel' hidden><h2 class='panel__t' id='addrPanelT'>New address</h2>" +
        "<p class='panel__s'>We only use this to get the parcel to you.</p>" +
        "<div id='addrHost'></div></div>";

    return {
      title: 'Saved addresses — NUKKAD',
      html: acctShell('addresses', 'Saved addresses', body, {
        sub: list.length ? list.length + ' ' + NK.plural(list.length, 'address', 'addresses') + ' on file.' : '' }),
      mounted: function (root) {
        wireShell(root);
        var panel = qs('#addrPanel', root), host = qs('#addrHost', root), heading = qs('#addrPanelT', root);

        function openForm(a) {
          heading.textContent = a ? 'Edit address' : 'New address';
          host.innerHTML = addrForm(a);
          panel.hidden = false;
          U.liveValidate(host, ADDR_RULES);
          /* the PIN fills the city when it is still blank — one less thing to type */
          var pin = qs('#apin', host), city = qs('#acity', host);
          pin.addEventListener('blur', function () {
            var r = NK.checkPin(pin.value);
            if (r.ok && r.city && !city.value.trim()) city.value = r.city;
          });
          panel.scrollIntoView({ block: 'start', behavior: U.reduced() ? 'auto' : 'smooth' });
          var first = qs('#aname', host);
          if (first) first.focus();
        }
        function closeForm() { panel.hidden = true; host.innerHTML = ''; }

        U.on(root, 'click', '#addrNew', function () { openForm(null); });
        U.on(root, 'click', '[data-addredit]', function (e, t) {
          var id = t.getAttribute('data-addredit');
          var a = NK.addresses().filter(function (x) { return x.id === id; })[0];
          if (a) openForm(a);
        });
        U.on(root, 'click', '#addrCancel', closeForm);

        U.on(root, 'click', '[data-addrdef]', function (e, t) {
          var id = t.getAttribute('data-addrdef');
          var a = NK.addresses().filter(function (x) { return x.id === id; })[0];
          if (!a) return;
          a.isDefault = true;
          NK.addressSave(a);
          U.ok('Default address updated.', a.name + ', ' + a.city);
          go('#/account/addresses', true);
        });
        U.on(root, 'click', '[data-addrdrop]', function (e, t) {
          var id = t.getAttribute('data-addrdrop');
          var a = NK.addresses().filter(function (x) { return x.id === id; })[0];
          if (!a) return;
          U.confirm({
            title: 'Delete this address?', danger: true,
            body: a.name + ', ' + addrLines(a) + '. You can always add it again later.',
            confirm: 'Delete it', cancel: 'Keep it'
          }).then(function (yes) {
            if (!yes) return;
            NK.addressRemove(id);
            U.info('Address deleted.');
            go('#/account/addresses', true);
          });
        });

        U.on(root, 'submit', '#addrForm', function (e) {
          e.preventDefault();
          if (!U.validate(host, ADDR_RULES)) return;
          var btn = qs('#addrSave', host), a = readAddr(host);
          var pinCheck = NK.checkPin(a.pin);
          if (!pinCheck.ok) { U.setFieldError(host, 'apin', pinCheck.msg); U.err(pinCheck.msg); return; }
          U.busy(btn, true, 'Saving…');
          U.pretend(520).then(function () {
            var existed = !!a.id;
            NK.addressSave(a);
            U.busy(btn, false);
            U.ok(existed ? 'Address updated.' : 'Address saved.', a.name + ', ' + a.city);
            go('#/account/addresses', true);
          });
        });
      }
    };
  };

  /* ======================================================================
     ACCOUNT SETTINGS
     ====================================================================== */
  A.settings = function () {
    if (!NK.isAuthed()) return gate('#/account/settings', 'your account settings');
    var u = NK.user(), s = NK.orderStats();

    var body =
      "<div class='panel'><h2 class='panel__t'>Change password</h2>" +
        "<p class='panel__s'>Eight characters or more, with at least one number.</p>" +
        "<form id='pwForm' novalidate>" +
          pwField('current', 'Current password', { autocomplete: 'current-password' }) +
          pwField('next', 'New password', { autocomplete: 'new-password', placeholder: 'At least 8 characters' }) +
          pwMeterHtml() +
          "<button class='btn btn--pri' type='submit' id='pwBtn' style='margin-top:18px'>Change password</button>" +
        "</form></div>" +

      "<div class='panel'><h2 class='panel__t'>Email preferences</h2>" +
        "<p class='panel__s'>Sent to " + esc(u.email) + ". Change these any time.</p>" +
        "<form id='prefForm'>" +
          "<label class='check' style='margin-bottom:13px'><input type='checkbox' id='prefDrops' checked>" +
            "<span><b>New drops</b><br><span class='note' style='padding:0;background:none'>" +
            "A note when a collection lands. Twice a month at most.</span></span></label>" +
          "<label class='check' style='margin-bottom:13px'><input type='checkbox' id='prefOffers' checked>" +
            "<span><b>Offers and coupons</b><br><span class='note' style='padding:0;background:none'>" +
            "Sale openings and the codes that go with them.</span></span></label>" +
          "<label class='check' style='margin-bottom:18px'><input type='checkbox' id='prefOrders' checked disabled>" +
            "<span><b>Order updates</b><br><span class='note' style='padding:0;background:none'>" +
            "Dispatch and delivery notices. These cannot be turned off.</span></span></label>" +
          "<button class='btn btn--pri' type='submit' id='prefBtn'>Save preferences</button>" +
        "</form></div>" +

      "<div class='panel'><h2 class='panel__t'>Your data</h2>" +
        "<p class='panel__s'>Everything on this demo lives in this browser only — nothing is sent anywhere. " +
          "Clearing it removes your account, " + s.total + ' ' + NK.plural(s.total, 'order') +
          ", your bag, wishlist and addresses.</p>" +
        "<div class='phead__acts' style='margin:0'>" +
          "<button class='btn btn--ghost btn--sm' type='button' id='dataExport'>" +
            icon('box') + "Download my data</button>" +
          "<button class='btn btn--danger btn--sm' type='button' id='dataWipe'>" +
            icon('trash') + "Erase everything</button>" +
        "</div></div>";

    return {
      title: 'Account settings — NUKKAD',
      html: acctShell('settings', 'Account settings', body, { sub: 'Passwords, email and your data.' }),
      mounted: function (root) {
        wireShell(root);
        wirePwToggles(root);
        wirePwMeter(root, 'next');
        var rules = { current: V.required, next: V.password };
        U.liveValidate(root, rules);

        U.on(root, 'submit', '#pwForm', function (e) {
          e.preventDefault();
          if (!U.validate(root, rules)) return;
          var btn = qs('#pwBtn', root), f = U.readForm(root, ['current', 'next']);
          if (f.current === f.next) {
            U.setFieldError(root, 'next', 'Choose a password you have not used here before.');
            return;
          }
          U.busy(btn, true, 'Changing…');
          U.pretend(620).then(function () {
            var r = NK.changePassword(f.current, f.next);
            U.busy(btn, false);
            if (!r.ok) {
              if (r.field) U.setFieldError(root, r.field, r.msg);
              U.err(r.msg);
              return;
            }
            U.ok(r.msg, 'Use it next time you log in.');
            go('#/account/settings', true);
          });
        });

        U.on(root, 'submit', '#prefForm', function (e) {
          e.preventDefault();
          var btn = qs('#prefBtn', root);
          var on = ['prefDrops', 'prefOffers'].filter(function (id) {
            var el = qs('#' + id, root); return el && el.checked;
          }).length;
          U.busy(btn, true, 'Saving…');
          U.pretend(430).then(function () {
            U.busy(btn, false);
            U.ok('Preferences saved.', on ? on + ' of 2 optional emails on.' : 'Optional emails off.');
          });
        });

        U.on(root, 'click', '#dataExport', function (e, t) {
          U.busy(t, true, 'Preparing…');
          U.pretend(500).then(function () {
            U.busy(t, false);
            downloadJson();
          });
        });

        U.on(root, 'click', '#dataWipe', function () {
          U.confirm({
            title: 'Erase everything?', danger: true,
            body: 'Your account, orders, bag, wishlist and addresses are deleted from this browser. This cannot be undone.',
            confirm: 'Erase it all', cancel: 'Keep my data'
          }).then(function (yes) {
            if (!yes) return;
            NK.resetAll();
            U.info('Everything cleared. Starting fresh.');
            go('#/', true);
          });
        });
      }
    };
  };

  /* an honest export: the same JSON the demo keeps in localStorage */
  function downloadJson() {
    var u = NK.user();
    var payload = { exported: new Date().toISOString(), profile: u, addresses: NK.addresses(),
      orders: NK.orders(), wishlist: NK.wishlist().map(function (p) { return { id: p.id, name: p.name }; }) };
    var text = JSON.stringify(payload, null, 2);
    try {
      var blob = new w.Blob([text], { type: 'application/json' });
      var url = w.URL.createObjectURL(blob);
      var a = d.createElement('a');
      a.href = url; a.download = 'nukkad-account.json';
      d.body.appendChild(a); a.click(); d.body.removeChild(a);
      w.setTimeout(function () { w.URL.revokeObjectURL(url); }, 1000);
      U.ok('Download started.', 'nukkad-account.json');
    } catch (err) {
      U.err('Your browser blocked the download.', 'Try again from a served page rather than a local file.');
    }
  }

  /* ======================================================================
     CHECKOUT — shared chrome
     ====================================================================== */
  /* every step needs a non-empty cart and, from delivery onward, an address */
  function ckoGuard(step) {
    var t = NK.totals();
    if (!t.lines.length) {
      return {
        title: 'Your cart is empty — NUKKAD',
        html: "<div class='wrap'>" + X.stepsHtml('cart') + U.state({
          artKind: 'bag', title: 'There is nothing to check out',
          body: 'Your bag is empty, so there is no order to place. Pick something up first and the checkout will be waiting.',
          actions: "<a class='btn btn--pri' href='#/new'>Shop new arrivals</a>" +
            "<a class='btn btn--ghost' href='#/men'>Shop men</a>" +
            "<a class='btn btn--ghost' href='#/women'>Shop women</a>"
        }) + "</div>"
      };
    }
    if (step !== 'address' && !NK.checkoutAddress()) {
      go('#/checkout/address', true);
      return { title: 'Checkout — NUKKAD', html: '' };
    }
    return null;
  }
  function ckoShell(step, o) {
    return "<div class='wrap'>" +
      X.stepsHtml(step) +
      "<div class='phead'><h1 class='phead__t dsp'>" + esc(o.title) + "</h1>" +
        (o.sub ? "<p class='phead__c'>" + esc(o.sub) + "</p>" : '') + "</div>" +
      "<div class='cko'><div>" + o.main + "</div><div>" + o.side + "</div></div>" +
    "</div>";
  }
  /* a compact read-only list so people can see what they are paying for */
  function miniHtml(t) {
    return "<div class='minicart'>" +
      t.lines.map(function (l) {
        return "<div class='minirow'>" +
          "<span class='minirow__m'><img" + U.srcPair(l.product, l.color.hex, 'front', 200, true) +
            " alt='' width='44' height='56' loading='lazy'></span>" +
          "<span class='minirow__b'><span class='minirow__n'>" + esc(l.product.name) + "</span>" +
            "<span class='minirow__v'>" + esc(l.color.name) + " · " + esc(l.size) + " · x" + l.qty + "</span></span>" +
          "<span class='minirow__p'>" + esc(NK.money(l.lineTotal)) + "</span></div>";
      }).join('') +
      "<a class='minicart__e' href='#/cart'>" + icon('edit') + "Edit your bag</a>" +
    "</div>";
  }
  function ckoSide(t, cta, opts) {
    opts = opts || {};
    return (opts.coupon === false ? '' : "<div id='couponHost'>" + X.couponHtml(t) + "</div>") +
      X.summaryHtml(t, { title: 'Order summary', mini: miniHtml(t), cta: cta });
  }

  /* ======================================================================
     CHECKOUT — step 2, address
     ====================================================================== */
  function ckoAddress() {
    var g = ckoGuard('address');
    if (g) return g;
    var t = NK.totals(), list = NK.addresses(), picked = NK.checkoutAddress() || NK.defaultAddress();
    var pickedId = picked ? picked.id : '';

    var main =
      "<div class='panel'><h2 class='panel__t'>Where should it go?</h2>" +
        "<p class='panel__s'>" + (list.length
          ? 'Pick a saved address, or add another.'
          : 'Add the address you want this order delivered to.') + "</p>" +
        (list.length ? "<div class='addrs' role='radiogroup' aria-label='Saved addresses'>" +
          list.map(function (a) {
          return addrHtml(a, { pick: true, on: a.id === pickedId });
        }).join('') + "</div>" : '') +
        "<button class='addnew' type='button' id='ckoNew'>" + icon('plus') + "Deliver somewhere else</button>" +
        "<div id='ckoForm' hidden>" + '' + "</div>" +
      "</div>";

    var cta = "<button class='btn btn--lg btn--gold btn--wide' type='button' id='ckoNext'" +
      (list.length ? '' : ' disabled') + ">Continue to delivery" + icon('arrowR') + "</button>";

    return {
      title: 'Checkout · address — NUKKAD',
      html: ckoShell('address', { title: 'Delivery address', sub: 'Step 2 of 4.', main: main, side: ckoSide(t, cta) }),
      mounted: function (root) {
        var host = qs('#ckoForm', root), next = qs('#ckoNext', root);

        function openForm() {
          host.innerHTML = addrForm(null, { submit: 'Save and continue', noCancel: !list.length });
          host.hidden = false;
          U.liveValidate(host, ADDR_RULES);
          var pin = qs('#apin', host), city = qs('#acity', host);
          pin.addEventListener('blur', function () {
            var r = NK.checkPin(pin.value);
            if (r.ok && r.city && !city.value.trim()) city.value = r.city;
          });
          var first = qs('#aname', host);
          if (first) first.focus();
        }
        if (!list.length) openForm();

        U.on(root, 'click', '#ckoNew', function () { openForm(); host.scrollIntoView({ block: 'nearest' }); });
        U.on(root, 'click', '#addrCancel', function () { host.hidden = true; host.innerHTML = ''; });

        U.on(root, 'click', '[data-addrpick]', function (e, t2) {
          var id = t2.getAttribute('data-addrpick');
          NK.setCheckoutAddress(id);
          qsa('[data-addrpick]', root).forEach(function (el) {
            var on = el.getAttribute('data-addrpick') === id;
            el.classList.toggle('is-on', on);
            el.setAttribute('aria-checked', on ? 'true' : 'false');
          });
          if (next) next.disabled = false;
        });

        U.on(root, 'submit', '#addrForm', function (e) {
          e.preventDefault();
          if (!U.validate(host, ADDR_RULES)) return;
          var btn = qs('#addrSave', host), a = readAddr(host);
          var pc = NK.checkPin(a.pin);
          if (!pc.ok) { U.setFieldError(host, 'apin', pc.msg); U.err(pc.msg); return; }
          U.busy(btn, true, 'Saving…');
          U.pretend(520).then(function () {
            var saved = NK.addressSave(a);
            NK.setCheckoutAddress(saved.id);
            U.ok('Address saved.', a.name + ', ' + a.city);
            go('#/checkout/delivery', true);
          });
        });

        U.on(root, 'click', '#ckoNext', function () {
          if (!NK.checkoutAddress()) { U.err('Pick an address first.'); return; }
          go('#/checkout/delivery', true);
        });

        X.wireCoupons(root, function () { go('#/checkout/address', true); });
      }
    };
  }

  /* ======================================================================
     CHECKOUT — step 3, delivery speed
     ====================================================================== */
  function etaText(days) {
    var t0 = new Date(Date.now() + days * 86400000);
    return NK.fmtDate(t0.getTime());
  }
  function ckoDelivery() {
    var g = ckoGuard('delivery');
    if (g) return g;
    var t = NK.totals(), a = NK.checkoutAddress();
    var opts = NK.checkoutShipOptions(), live = NK.checkoutShip();

    var main =
      "<div class='panel'><h2 class='panel__t'>Delivering to</h2>" +
        addrHtml(a, { plain: true }) +
        "<a class='btn btn--ghost btn--sm' href='#/checkout/address'>Change address</a></div>" +
      "<div class='panel'><h2 class='panel__t'>How fast do you want it?</h2>" +
        "<p class='panel__s'>Estimates are for " + esc(a.city) + " " + esc(a.pin) + ", excluding Sundays.</p>" +
        "<div class='ships' role='radiogroup' aria-label='Delivery speed'>" +
          opts.map(function (o) {
            var on = o.key === live.key;
            return "<button class='ship" + (on ? ' is-on' : '') + "' type='button' role='radio'" +
              " aria-checked='" + (on ? 'true' : 'false') + "' data-ship='" + attr(o.key) + "'>" +
              "<span class='ship__r' aria-hidden='true'></span>" +
              "<span class='ship__b'><span class='ship__n'>" + esc(o.name) + "</span>" +
                "<span class='ship__s'>Arrives by " + esc(etaText(o.days)) + " · " + esc(o.note) + "</span></span>" +
              "<span class='ship__p" + (o.fee ? '' : ' is-free') + "'>" +
                (o.fee ? esc(NK.money(o.fee)) : 'Free') + "</span>" +
            "</button>";
          }).join('') +
        "</div></div>";

    var cta = "<button class='btn btn--lg btn--gold btn--wide' type='button' id='ckoNext'>" +
      "Continue to payment" + icon('arrowR') + "</button>" +
      "<a class='btn btn--ghost btn--wide' href='#/checkout/address' style='margin-top:9px'>Back to address</a>";

    return {
      title: 'Checkout · delivery — NUKKAD',
      html: ckoShell('delivery', { title: 'Delivery speed', sub: 'Step 3 of 4.', main: main,
        side: ckoSide(shipTotals(t, live), cta) }),
      mounted: function (root) {
        U.on(root, 'click', '[data-ship]', function (e, t2) {
          NK.setCheckoutShip(t2.getAttribute('data-ship'));
          go('#/checkout/delivery', true);
        });
        U.on(root, 'click', '#ckoNext', function () { go('#/checkout/payment', true); });
        X.wireCoupons(root, function () { go('#/checkout/delivery', true); });
      }
    };
  }
  /* the summary is built from NK.totals(), which knows nothing about the
     chosen courier — fold the fee in before handing it over */
  function shipTotals(t, ship) {
    var fee = ship && ship.fee ? ship.fee : 0;
    if (!fee) return t;
    var out = {};
    Object.keys(t).forEach(function (k) { out[k] = t[k]; });
    out.shipping = t.shipping + fee;
    out.shipFree = out.shipping === 0;
    out.total = t.total + fee;
    return out;
  }

  /* ======================================================================
     CHECKOUT — step 4, payment
     ====================================================================== */
  var PAYS = [
    { key: 'upi', name: 'UPI', note: 'Google Pay, PhonePe, Paytm or any UPI app', ic: 'upi' },
    { key: 'card', name: 'Card', note: 'Credit or debit — Visa, Mastercard, RuPay', ic: 'card' },
    { key: 'netbanking', name: 'Net banking', note: 'All major Indian banks', ic: 'bank' },
    { key: 'cod', name: 'Cash on delivery', note: 'Pay the courier when it arrives', ic: 'cash' }
  ];
  /* generic swatches — deliberately not any real payment brand's colours */
  var UPI_APPS = [
    { key: 'any', name: 'Any UPI app', hex: '#1F4B3F' },
    { key: 'qr', name: 'Scan a QR', hex: '#7C2D12' },
    { key: 'number', name: 'Pay to number', hex: '#3F3A66' },
    { key: 'id', name: 'Pay to UPI ID', hex: '#6B5416' }
  ];
  var BANKS = [
    { name: 'Meridian Bank', hex: '#1F4B3F' }, { name: 'Kaveri Co-op Bank', hex: '#7C2D12' },
    { name: 'Deccan National', hex: '#3F3A66' }, { name: 'Ashvin Bank', hex: '#6B5416' },
    { name: 'Sarita Finance Bank', hex: '#20514F' }, { name: 'Peninsula Bank', hex: '#5A2A4D' },
    { name: 'Girnar Bank', hex: '#4A4A2E' }, { name: 'Konkan Urban Bank', hex: '#2C4763' }
  ];

  function payPanel(key) {
    if (key === 'upi') {
      return "<div class='upiapps' role='radiogroup' aria-label='UPI app'>" + UPI_APPS.map(function (u, i) {
        return "<button class='upiapp" + (i === 0 ? ' is-on' : '') + "' type='button' role='radio'" +
          " aria-checked='" + (i === 0 ? 'true' : 'false') + "' data-upi='" + attr(u.key) + "'" +
          " data-name='" + attr(u.name) + "'>" +
          "<span class='upiapp__d' aria-hidden='true' style='background:" + attr(u.hex) + "'>" +
          esc(u.name.charAt(0)) + "</span>" + esc(u.name) + "</button>";
      }).join('') + "</div>" +
      U.field({ id: 'upiid', label: 'Or enter a UPI ID', placeholder: 'yourname@bank',
        hint: 'Nothing is charged — this demo only checks the format.' });
    }
    if (key === 'card') {
      return "<div class='cardart' aria-hidden='true'>" +
          "<span class='cardart__chip'></span>" +
          "<div class='cardart__num' id='cardArtNo'>•••• •••• •••• ••••</div>" +
          "<div class='cardart__r'><div><span>Card holder</span><b id='cardArtName'>YOUR NAME</b></div>" +
            "<div><span>Expires</span><b id='cardArtExp'>MM/YY</b></div></div>" +
        "</div>" +
        U.field({ id: 'cardno', label: 'Card number', inputmode: 'numeric', autocomplete: 'cc-number',
          max: 19, placeholder: '4111 1111 1111 1111',
          hint: 'Test card 4111 1111 1111 1111 passes the format check.' }) +
        U.field({ id: 'cardname', label: 'Name on card', autocomplete: 'cc-name', placeholder: 'AARAV MEHTA' }) +
        "<div class='grid2'>" +
          U.field({ id: 'cardexp', label: 'Expiry', placeholder: 'MM/YY', inputmode: 'numeric',
            autocomplete: 'cc-exp', max: 5 }) +
          U.field({ id: 'cardcvv', label: 'CVV', type: 'password', inputmode: 'numeric',
            autocomplete: 'cc-csc', max: 4, placeholder: '123' }) +
        "</div>";
    }
    if (key === 'netbanking') {
      return "<div class='netbanks' role='radiogroup' aria-label='Bank'>" + BANKS.map(function (b, i) {
        return "<button class='netbank" + (i === 0 ? ' is-on' : '') + "' type='button' role='radio'" +
          " aria-checked='" + (i === 0 ? 'true' : 'false') + "' data-bank='" + attr(b.name) + "'>" +
          "<span class='netbank__d' aria-hidden='true' style='background:" + attr(b.hex) + "'>" +
          esc(b.name.charAt(0)) + "</span><span>" + esc(b.name) + "</span></button>";
      }).join('') + "</div>";
    }
    return "<div class='codnote'>" + icon('info') +
      "<div><b>Pay " + esc(NK.money(NK.COD_FEE)) + " extra for cash on delivery.</b>" +
      "<span>Keep the exact amount ready. The courier also carries a card machine on request.</span></div></div>";
  }

  var payPick = 'upi';
  function ckoPayment() {
    var g = ckoGuard('payment');
    if (g) return g;
    var a = NK.checkoutAddress(), ship = NK.checkoutShip();
    var pin = NK.checkPin(a.pin);
    var codOk = !!pin.cod;
    if (!codOk && payPick === 'cod') payPick = 'upi';
    var t = shipTotals(NK.totals({ cod: payPick === 'cod' }), ship, payPick === 'cod');

    var main =
      "<div class='panel'><h2 class='panel__t'>Order going to</h2>" +
        addrHtml(a, { plain: true }) +
        "<div class='note' style='margin-top:12px'>" + icon('truck') + "<span><b>" + esc(ship.name) +
          "</b> — arrives by " + esc(etaText(ship.days)) +
          ". <a class='linkish' href='#/checkout/delivery'>Change</a></span></div></div>" +
      "<div class='panel'><h2 class='panel__t'>How would you like to pay?</h2>" +
        "<div class='pays' role='radiogroup' aria-label='Payment method'>" +
          PAYS.map(function (p) {
            var on = p.key === payPick;
            var off = p.key === 'cod' && !codOk;
            return "<div class='pay" + (on ? ' is-on' : '') + "'>" +
              "<button class='pay__t' type='button' role='radio' data-pay='" + attr(p.key) + "'" +
                " aria-checked='" + (on ? 'true' : 'false') + "'" + (off ? ' disabled' : '') + ">" +
                "<span class='pay__r' aria-hidden='true'></span>" +
                "<span class='pay__ic' aria-hidden='true'>" + icon(p.ic) + "</span>" +
                "<span class='pay__b'><span class='pay__n'>" + esc(p.name) +
                  (p.key === 'cod' ? "<span class='tag tag--low'>+" + esc(NK.money(NK.COD_FEE)) + "</span>" : '') +
                  (p.key === 'upi' ? "<span class='tag tag--ok'>Fastest</span>" : '') + "</span>" +
                  "<span class='pay__s'>" + esc(off ? 'Not available for PIN ' + a.pin : p.note) + "</span></span>" +
              "</button>" +
              (on ? "<div class='pay__body'>" + payPanel(p.key) + "</div>" : '') +
            "</div>";
          }).join('') +
        "</div>" +
        "<p class='secure'>" + icon('lock') + "This is a demo storefront. No card, UPI or bank " +
          "details are sent anywhere — everything stays in this browser.</p></div>";

    var cta = "<button class='btn btn--lg btn--gold btn--wide' type='button' id='ckoPay'>" +
      (payPick === 'cod' ? 'Place order' : 'Pay ' + NK.money(t.total)) + icon('lock') + "</button>" +
      "<a class='btn btn--ghost btn--wide' href='#/checkout/delivery' style='margin-top:9px'>Back to delivery</a>";

    return {
      title: 'Checkout · payment — NUKKAD',
      html: ckoShell('payment', { title: 'Payment', sub: 'Step 4 of 4.', main: main,
        side: ckoSide(t, cta) }),
      mounted: function (root) {
        U.on(root, 'click', '[data-pay]', function (e, b) {
          var k = b.getAttribute('data-pay');
          if (k === payPick) return;
          payPick = k; go('#/checkout/payment', true);
        });
        U.on(root, 'click', '[data-upi]', function (e, b) { pickOne(root, '[data-upi]', b); });
        U.on(root, 'click', '[data-bank]', function (e, b) { pickOne(root, '[data-bank]', b); });
        wireCardArt(root);
        U.on(root, 'click', '#ckoPay', function (e, b) { payNow(root, b); });
        X.wireCoupons(root, function () { go('#/checkout/payment', true); });
      }
    };
  }
  function pickOne(root, sel, btn) {
    qsa(sel, root).forEach(function (o) {
      var on = o === btn;
      o.classList.toggle('is-on', on);
      o.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  /* the card preview mirrors what is typed, so a typo is easy to spot */
  function groups(v) { return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); }
  function wireCardArt(root) {
    var no = qs('#cardno', root); if (!no) return;
    var art = qs('#cardArtNo', root), nm = qs('#cardArtName', root), ex = qs('#cardArtExp', root);
    U.on(root, 'input', '#cardno', function (e, i) {
      i.value = groups(i.value);
      art.textContent = (i.value + ' •••• •••• •••• ••••').slice(0, 19);
    });
    U.on(root, 'input', '#cardname', function (e, i) {
      nm.textContent = i.value.toUpperCase() || 'YOUR NAME';
    });
    U.on(root, 'input', '#cardexp', function (e, i) {
      var d0 = i.value.replace(/\D/g, '').slice(0, 4);
      i.value = d0.length > 2 ? d0.slice(0, 2) + '/' + d0.slice(2) : d0;
      ex.textContent = i.value || 'MM/YY';
    });
    U.on(root, 'input', '#cardcvv', function (e, i) { i.value = i.value.replace(/\D/g, '').slice(0, 4); });
  }

  function payValid(root) {
    if (payPick === 'card')
      return U.validate(root, { cardno: V.card, cardname: V.name, cardexp: V.expiry, cardcvv: V.cvv });
    if (payPick === 'upi') {
      var id = qs('#upiid', root), typed = id ? id.value.trim() : '';
      if (!typed) return true;                       /* an app was picked instead */
      return U.validate(root, { upiid: V.upi });
    }
    return true;
  }
  function payDetail(root) {
    if (payPick === 'card') {
      var no = (qs('#cardno', root).value || '').replace(/\s/g, '');
      return 'Card ending ' + no.slice(-4);
    }
    if (payPick === 'upi') {
      var id = qs('#upiid', root), typed = id ? id.value.trim() : '';
      if (typed) return typed;
      var b = qsa('[data-upi].is-on', root)[0];
      return b ? (b.getAttribute('data-name') || 'UPI') : 'UPI';
    }
    if (payPick === 'netbanking') {
      var nb = qsa('[data-bank].is-on', root)[0];
      return nb ? nb.getAttribute('data-bank') : 'Net banking';
    }
    return 'Cash on delivery';
  }
  function payNow(root, btn) {
    if (!payValid(root)) return;
    var label = payPick === 'cod' ? 'Placing your order' : 'Contacting your bank';
    U.busy(btn, true, label);
    U.pretend(payPick === 'cod' ? 700 : 1500).then(function () {
      var r = NK.placeOrder({
        payment: payPick, detail: payDetail(root),
        address: NK.checkoutAddress(), shipping: NK.checkoutShip()
      });
      U.busy(btn, false);
      if (!r.ok) { U.err(r.msg || 'We could not place that order.'); return; }
      NK.clearDraft();
      payPick = 'upi';
      go('#/checkout/done?id=' + encodeURIComponent(r.order.id), true);
    });
  }

  /* ======================================================================
     CHECKOUT — step 5, confirmation
     ====================================================================== */
  function ckoDone(q) {
    var o = NK.orderById(q && q.id ? q.id : '') || NK.orders()[0];
    if (!o) {
      return {
        title: 'Checkout — NUKKAD',
        html: "<div class='wrap'>" + U.state({
          artKind: 'box', title: 'No order to show',
          body: 'We could not find that order in this browser. If you placed one, it will be in your orders.',
          actions: "<a class='btn btn--pri' href='#/account/orders'>My orders</a>" +
            "<a class='btn btn--ghost' href='#/'>Back home</a>"
        }) + "</div>"
      };
    }
    var first = NK.byId(o.items[0].id);
    var main =
      "<div class='done'>" +
        "<div class='done__ring' aria-hidden='true'>" + icon('check') + "</div>" +
        "<h1 class='done__t dsp'>Order placed</h1>" +
        "<p class='done__s'>Thanks" + (o.address && o.address.name ? ', ' + esc(o.address.name.split(' ')[0]) : '') +
          ". We have your order — it is packed and dispatched from our Bengaluru warehouse, and " +
          "you can follow every step below.</p>" +
        "<div class='done__id'><span>Order ID</span><b>" + esc(o.id) + "</b>" +
          "<button class='iconbtn' type='button' data-copy='" + attr(o.id) + "' " +
          "aria-label='Copy order ID'>" + icon('copy') + "</button></div>" +
        "<p class='note' style='margin-top:20px;text-align:left'>" + icon('truck') +
          "<span>Arriving by <b>" + esc(NK.fmtDate(o.eta)) + "</b> at " + esc(o.address.city) +
          " " + esc(o.address.pin) + " · paid by " + esc(o.paymentLabel) + "</span></p>" +
        "<div class='done__acts'>" +
          "<a class='btn btn--pri' href='#/track/" + attr(o.id) + "'>Track this order</a>" +
          "<a class='btn btn--ghost' href='#/order/" + attr(o.id) + "'>View details</a>" +
          "<a class='btn btn--ghost' href='#/new'>Keep shopping</a>" +
        "</div>" +
      "</div>" +
      ordCard(o, { compact: true, noActs: true });

    return {
      title: 'Order placed — NUKKAD',
      html: "<div class='wrap'>" + X.stepsHtml('done') + main + "</div>" +
        U.section({ title: 'Goes with what you just bought', mod: 'wash',
          more: { href: '#/new', label: 'Shop new in' },
          html: U.rail(NK.related(first, 12), { label: 'Recommended with your order' }) }),
      mounted: function (root) {
        U.on(root, 'click', '[data-copy]', function (e, b) { copyText(b.getAttribute('data-copy')); });
        U.wireCards(root); U.wireRails(root); U.hydrate(root);
      }
    };
  }

  A.checkout = function (step, q) {
    if (step === 'address') return ckoAddress();
    if (step === 'delivery') return ckoDelivery();
    if (step === 'payment') return ckoPayment();
    if (step === 'done') return ckoDone(q);
    go('#/checkout/address', true);
    return { title: 'Checkout — NUKKAD', html: '' };
  };

  /* ======================================================================
     ORDER TRACKING
     ====================================================================== */
  var TRACK_STEPS = [
    { key: 'confirmed', label: 'Order confirmed', note: 'We have your order and payment.' },
    { key: 'processing', label: 'Packed', note: 'Picked, quality-checked and packed.' },
    { key: 'shipped', label: 'Shipped', note: 'Handed to the courier and on the move.' },
    { key: 'out', label: 'Out for delivery', note: 'With the delivery partner near you.' },
    { key: 'delivered', label: 'Delivered', note: 'Left with you or someone at your address.' }
  ];
  function stepIndex(status) {
    var at = -1;
    TRACK_STEPS.forEach(function (s, i) { if (s.key === status) at = i; });
    return at;
  }
  function whenOf(o, key) {
    var hit = null;
    (o.timeline || []).forEach(function (e) { if (e.status === key) hit = e; });
    return hit ? NK.fmtDateTime(hit.at) : '';
  }
  function tnode(o2) {
    return "<li class='tnode" + (o2.cls || '') + "'" + (o2.now ? " aria-current='step'" : '') + ">" +
      "<span class='tnode__d' aria-hidden='true'>" + icon(o2.ic || 'check') + "</span>" +
      "<p class='tnode__t'>" + esc(o2.label) + "</p>" +
      (o2.sub ? "<p class='tnode__s'>" + esc(o2.sub) + "</p>" : '') +
      (o2.when ? "<p class='tnode__w'>" + icon('clock') + esc(o2.when) + "</p>" : '') +
    "</li>";
  }
  function trackLine(o) {
    if (o.status === 'cancelled') {
      return "<div class='tline'><ol>" +
        tnode({ cls: ' is-done', label: 'Order confirmed', when: whenOf(o, 'confirmed') }) +
        tnode({ cls: ' is-now', ic: 'x', label: 'Cancelled',
          sub: 'Nothing was shipped. Any amount paid is refunded to the original payment method within 3–5 working days.',
          when: whenOf(o, 'cancelled') || NK.fmtDateTime(o.updated) }) +
      "</ol></div>";
    }
    var at = stepIndex(o.status);
    /* the green fill stops at the live node, so progress reads at a glance */
    var pct = at <= 0 ? 0 : Math.round(at / (TRACK_STEPS.length - 1) * 100);
    return "<div class='tline'>" +
      "<span class='tline__f' style='height:calc(" + pct + "% - " + (pct ? 14 : 0) + "px)' aria-hidden='true'></span>" +
      "<ol>" + TRACK_STEPS.map(function (s, i) {
        var done = i < at, now = i === at, when = whenOf(o, s.key);
        return tnode({
          cls: done ? ' is-done' : (now ? ' is-now' : ''),
          ic: done ? 'check' : (now ? 'truck' : 'clock'),
          label: s.label,
          sub: now && i < TRACK_STEPS.length - 1
            ? s.note + ' Next: ' + TRACK_STEPS[i + 1].label.toLowerCase() + ' by ' + NK.fmtDate(o.eta) + '.'
            : (done ? '' : s.note),
          when: when
        });
      }).join('') + "</ol></div>";
  }

  /*NUKKAD_ACCOUNT_NEXT*/

  /* the lookup form doubles as the empty state, so a wrong ID is never a dead end */
  function trackForm(id, msg) {
    return "<div class='panel'><h2 class='panel__t'>Track an order</h2>" +
      "<p class='panel__s'>Enter the order ID from your confirmation — it looks like NK20261234501.</p>" +
      "<form class='trkform' id='trkForm' novalidate>" +
        "<input class='inp' id='trkId' name='trkId' value='" + attr(id || '') + "' " +
          "placeholder='NK20261234501' aria-label='Order ID' autocomplete='off' spellcheck='false'>" +
        "<button class='btn btn--pri' type='submit'>Track" + icon('arrowR') + "</button>" +
      "</form>" +
      (msg ? "<p class='note note--warn' style='margin-top:14px'>" + icon('info') +
        "<span>" + esc(msg) + "</span></p>" : '') +
      (NK.orders().length ? "<p class='panel__s' style='margin-top:14px'>Or pick one from " +
        "<a class='linkish' href='#/account/orders'>your orders</a>.</p>" : '') +
    "</div>";
  }
  function wireTrackForm(root) {
    U.on(root, 'submit', '#trkForm', function (e) {
      e.preventDefault();
      var v = (qs('#trkId', root).value || '').trim();
      if (!v) { U.err('Enter an order ID to track.'); return; }
      go('#/track/' + encodeURIComponent(v.toUpperCase()), true);
    });
  }

  A.track = function (id) {
    id = String(id || '').trim();
    var o = id ? NK.orderById(id) : null;

    if (!o) {
      return {
        title: 'Track your order — NUKKAD',
        html: "<div class='wrap'>" +
          "<div class='phead'><h1 class='phead__t dsp'>Track your order</h1>" +
            "<p class='phead__c'>Follow a parcel from our warehouse to your door.</p></div>" +
          trackForm(id, id ? 'We could not find order ' + id + ' in this browser. Orders live only ' +
            'on the device that placed them in this demo — check the ID, or open it from your orders.' : '') +
        "</div>"
      };
    }

    var late = o.status !== 'delivered' && o.status !== 'cancelled' && Date.now() > o.eta;
    var main =
      "<div class='panel'>" +
        "<div class='ordcard__h' style='margin:-24px -24px 18px;border-radius:0'>" +
          hi('Order', o.id, true) +
          hi(o.status === 'delivered' ? 'Delivered' : o.status === 'cancelled' ? 'Cancelled' : 'Arriving by',
            o.status === 'cancelled' ? NK.fmtDate(o.updated) : NK.fmtDate(o.eta)) +
          hi('Total', NK.money(o.total)) +
          "<span class='ordcard__st'>" + stPill(o.status) + "</span>" +
        "</div>" +
        (late ? "<p class='note note--warn'>" + icon('info') + "<span>This one is running behind our " +
          "estimate. Couriers slow down around festivals and heavy rain — it is still moving.</span></p>" : '') +
        trackLine(o) +
      "</div>" +
      "<div class='panel'><h2 class='panel__t'>What is in this parcel</h2>" +
        "<div class='ordcard__b' style='padding:0'>" + o.items.map(ordLine).join('') + "</div></div>";

    var side =
      "<div class='panel'><h2 class='panel__t'>Delivery address</h2>" +
        addrHtml(o.address, { plain: true }) + "</div>" +
      "<div class='panel'><h2 class='panel__t'>Need a hand?</h2>" +
        "<p class='panel__s'>Our support desk answers in about four hours on working days.</p>" +
        "<div class='phead__acts' style='margin:0'>" +
          "<a class='btn btn--sm btn--ghost' href='#/order/" + attr(o.id) + "'>Order details</a>" +
          (NK.cancellable(o) ? "<button class='btn btn--sm btn--danger' type='button' " +
            "data-ordcancel='" + attr(o.id) + "'>Cancel this order</button>" : '') +
          "<a class='btn btn--sm btn--ghost' href='#/info/shipping'>Shipping policy</a>" +
          "<a class='btn btn--sm btn--ghost' href='#/info/returns'>Start a return</a>" +
        "</div></div>";

    return {
      title: 'Tracking ' + o.id + ' — NUKKAD',
      html: "<div class='wrap'>" +
        "<nav class='crumb' aria-label='Breadcrumb'><a href='#/'>Home</a>" + icon('chev') +
          "<a href='#/account/orders'>My orders</a>" + icon('chev') +
          "<span aria-current='page'>Tracking</span></nav>" +
        "<div class='phead'><h1 class='phead__t dsp'>Tracking</h1></div>" +
        "<div class='track'><div>" + main + "</div><div>" + side + "</div></div>" +
        trackForm('') +
      "</div>",
      mounted: function (root) {
        wireTrackForm(root);
        wireOrderCards(root);
        /* orders advance on real elapsed time — repaint if one moves while a track page is open */
        if (!A.track.sub) {
          A.track.sub = true;
          NK.on('orders', function () {
            var m = /^#\/track\/(.+)$/.exec(w.location.hash || '');
            if (m) go('#/track/' + decodeURIComponent(m[1]), true);
          });
        }
      }
    };
  };

  w.NK_ACCOUNT = A;
})(window, document);
