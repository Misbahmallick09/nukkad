/* ==========================================================================
   NUKKAD — catalog, taxonomy, coupons, review seeds
   All data is generated deterministically so the catalog is stable across
   reloads (same product ids, prices, ratings and stock every time).
   ========================================================================== */
(function (w) {
  'use strict';

  /* ---------- deterministic pseudo-random ------------------------------ */
  function seeded(seedStr) {
    var h = 2166136261;
    for (var i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return function () {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 100000) / 100000;
    };
  }
  function pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length) % arr.length]; }
  function pickN(rnd, arr, n) {
    var pool = arr.slice(), out = [];
    n = Math.min(n, pool.length);
    while (out.length < n) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    return out;
  }
  function intBetween(rnd, a, b) { return a + Math.floor(rnd() * (b - a + 1)); }

  /* ---------- colour vocabulary --------------------------------------- */
  var COLORS = {
    black:      { name: 'Jet Black',     hex: '#171717', fam: 'Black' },
    charcoal:   { name: 'Charcoal',      hex: '#3A3D42', fam: 'Grey' },
    grey:       { name: 'Heather Grey',  hex: '#9A9C99', fam: 'Grey' },
    white:      { name: 'Chalk White',   hex: '#F4F2EC', fam: 'White' },
    offwhite:   { name: 'Ecru',          hex: '#E7E0CE', fam: 'White' },
    bottle:     { name: 'Bottle Green',  hex: '#0C3B2E', fam: 'Green' },
    sage:       { name: 'Sage',          hex: '#9FB09A', fam: 'Green' },
    olive:      { name: 'Olive',         hex: '#5C6046', fam: 'Green' },
    navy:       { name: 'Deep Navy',     hex: '#1C2541', fam: 'Blue' },
    cobalt:     { name: 'Cobalt',        hex: '#2A4BC4', fam: 'Blue' },
    denim:      { name: 'Mid Denim',     hex: '#4A6D9B', fam: 'Blue' },
    icedenim:   { name: 'Ice Wash',      hex: '#9FB6CE', fam: 'Blue' },
    maroon:     { name: 'Maroon',        hex: '#6A2230', fam: 'Red' },
    verm:       { name: 'Vermilion',     hex: '#D2461F', fam: 'Red' },
    rose:       { name: 'Dusty Rose',    hex: '#C58A93', fam: 'Pink' },
    lilac:      { name: 'Lilac',         hex: '#A99AC9', fam: 'Purple' },
    mustard:    { name: 'Marigold',      hex: '#E8A700', fam: 'Yellow' },
    sand:       { name: 'Desert Sand',   hex: '#C8A97E', fam: 'Beige' },
    coffee:     { name: 'Coffee',        hex: '#4B3626', fam: 'Brown' },
    teal:       { name: 'Deep Teal',     hex: '#1E5A62', fam: 'Blue' },
    coral:      { name: 'Coral',         hex: '#E9705B', fam: 'Pink' }
  };
  var COLOR_FAMS = ['Black', 'White', 'Grey', 'Blue', 'Green', 'Red', 'Pink', 'Purple', 'Yellow', 'Beige', 'Brown'];

  /* ---------- size systems -------------------------------------------- */
  var SZ_ALPHA = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  var SZ_WAIST = ['28', '30', '32', '34', '36', '38'];
  var SZ_FREE = ['Free Size'];
  var SZ_SHOE = ['S/M', 'L/XL'];

  /* ---------- taxonomy ------------------------------------------------- */
  var TAXONOMY = [
    {
      slug: 'men', name: 'Men', tagline: 'Everyday street fits, built to be worn out.',
      groups: [
        { name: 'Topwear', subs: ['t-shirts', 'oversized-t-shirts', 'shirts', 'hoodies', 'sweatshirts'] },
        { name: 'Bottomwear', subs: ['jeans', 'trousers', 'joggers', 'shorts'] },
        { name: 'Layering', subs: ['jackets'] }
      ],
      subs: [
        { slug: 't-shirts',           name: 'T-Shirts',          kind: 'tee',        sizes: SZ_ALPHA, price: [449, 899] },
        { slug: 'oversized-t-shirts', name: 'Oversized T-Shirts',kind: 'oversized',  sizes: SZ_ALPHA, price: [599, 1199] },
        { slug: 'shirts',             name: 'Shirts',            kind: 'shirt',      sizes: SZ_ALPHA, price: [899, 1799] },
        { slug: 'hoodies',            name: 'Hoodies',           kind: 'hoodie',     sizes: SZ_ALPHA, price: [1299, 2499] },
        { slug: 'sweatshirts',        name: 'Sweatshirts',       kind: 'sweatshirt', sizes: SZ_ALPHA, price: [1099, 1999] },
        { slug: 'jeans',              name: 'Jeans',             kind: 'jeans',      sizes: SZ_WAIST, price: [1299, 2699] },
        { slug: 'trousers',           name: 'Trousers',          kind: 'trousers',   sizes: SZ_WAIST, price: [1099, 2199] },
        { slug: 'joggers',            name: 'Joggers',           kind: 'joggers',    sizes: SZ_ALPHA, price: [899, 1699] },
        { slug: 'shorts',             name: 'Shorts',            kind: 'shorts',     sizes: SZ_ALPHA, price: [599, 1199] },
        { slug: 'jackets',            name: 'Jackets',           kind: 'jacket',     sizes: SZ_ALPHA, price: [1699, 3999] }
      ]
    },
    {
      slug: 'women', name: 'Women', tagline: 'Relaxed silhouettes with a sharp finish.',
      groups: [
        { name: 'Topwear', subs: ['t-shirts', 'tops', 'hoodies', 'sweatshirts'] },
        { name: 'Dresses & Sets', subs: ['dresses', 'co-ords'] },
        { name: 'Bottomwear', subs: ['jeans', 'bottomwear'] },
        { name: 'Layering', subs: ['jackets'] }
      ],
      subs: [
        { slug: 't-shirts',    name: 'T-Shirts',    kind: 'tee',        sizes: SZ_ALPHA, price: [449, 899] },
        { slug: 'tops',        name: 'Tops',        kind: 'top',        sizes: SZ_ALPHA, price: [649, 1499] },
        { slug: 'dresses',     name: 'Dresses',     kind: 'dress',      sizes: SZ_ALPHA, price: [1199, 2999] },
        { slug: 'hoodies',     name: 'Hoodies',     kind: 'hoodie',     sizes: SZ_ALPHA, price: [1299, 2499] },
        { slug: 'sweatshirts', name: 'Sweatshirts', kind: 'sweatshirt', sizes: SZ_ALPHA, price: [1099, 1999] },
        { slug: 'jeans',       name: 'Jeans',       kind: 'jeans',      sizes: SZ_WAIST, price: [1399, 2799] },
        { slug: 'bottomwear',  name: 'Bottomwear',  kind: 'trousers',   sizes: SZ_ALPHA, price: [899, 1899] },
        { slug: 'co-ords',     name: 'Co-ords',     kind: 'coord',      sizes: SZ_ALPHA, price: [1599, 3299] },
        { slug: 'jackets',     name: 'Jackets',     kind: 'jacket',     sizes: SZ_ALPHA, price: [1699, 3699] }
      ]
    },
    {
      slug: 'accessories', name: 'Accessories', tagline: 'The small stuff that finishes the fit.',
      groups: [
        { name: 'Carry', subs: ['bags', 'wallets'] },
        { name: 'Wear', subs: ['caps', 'socks'] },
        { name: 'Tech & Time', subs: ['watches', 'other-accessories'] }
      ],
      subs: [
        { slug: 'bags',              name: 'Bags',        kind: 'bag',    sizes: SZ_FREE, price: [999, 2999] },
        { slug: 'caps',              name: 'Caps',        kind: 'cap',    sizes: SZ_FREE, price: [499, 999] },
        { slug: 'wallets',           name: 'Wallets',     kind: 'wallet', sizes: SZ_FREE, price: [699, 1799] },
        { slug: 'socks',             name: 'Socks',       kind: 'socks',  sizes: SZ_SHOE, price: [249, 599] },
        { slug: 'watches',           name: 'Watches',     kind: 'watch',  sizes: SZ_FREE, price: [1999, 5999] },
        { slug: 'other-accessories', name: 'Accessories', kind: 'misc',   sizes: SZ_FREE, price: [349, 1299] }
      ]
    }
  ];

  /* ---------- naming vocabulary (original copy) ----------------------- */
  var SERIES = ['Corner', 'Lane', 'Rooftop', 'Monsoon', 'Night Shift', 'Platform 9', 'Chai Break',
    'Local Train', 'Terrace', 'Gully', 'Signal', 'Adda', 'Late Show', 'Off Duty', 'Rewind',
    'Static', 'Overcast', 'Sunday Slow', 'Blackout', 'Crosswalk'];
  var MOTIF = {
    tee: ['Graphic', 'Typographic', 'Pocket', 'Striped', 'Colour-block', 'Minimal'],
    oversized: ['Drop-Shoulder', 'Boxy', 'Back-Print', 'Acid Wash', 'Heavy Knit'],
    shirt: ['Camp Collar', 'Corduroy', 'Checked', 'Linen-Blend', 'Overshirt'],
    hoodie: ['Zip-Through', 'Pullover', 'Panelled', 'Heavyweight', 'Cropped'],
    sweatshirt: ['Crew Neck', 'Raglan', 'Embroidered', 'Half-Zip'],
    jeans: ['Straight Fit', 'Relaxed', 'Baggy', 'Slim Tapered', 'Wide Leg'],
    trousers: ['Pleated', 'Cargo', 'Tapered', 'Wide Leg', 'Utility'],
    joggers: ['Tapered', 'Cuffed', 'Cargo', 'Fleece'],
    shorts: ['Mesh', 'Cargo', 'Terry', 'Woven'],
    jacket: ['Bomber', 'Denim', 'Puffer', 'Coach', 'Windcheater', 'Trucker'],
    top: ['Corset', 'Wrap', 'Halter', 'Ribbed', 'Cami'],
    dress: ['Slip', 'Midi', 'Shirt', 'Tiered', 'Bodycon'],
    coord: ['Knit Set', 'Poplin Set', 'Terry Set', 'Utility Set'],
    bag: ['Sling', 'Tote', 'Backpack', 'Duffle', 'Belt Bag'],
    cap: ['Baseball', 'Trucker', 'Dad', '5-Panel', 'Bucket'],
    wallet: ['Bifold', 'Cardholder', 'Zip Around', 'Slim'],
    socks: ['Crew', 'Ankle', 'No-Show', 'Ribbed'],
    watch: ['Analog', 'Digital', 'Chronograph', 'Field'],
    misc: ['Belt', 'Sunglasses', 'Beanie', 'Scarf', 'Keyring', 'Laptop Sleeve']
  };
  var FABRIC = {
    tee: ['180 GSM Combed Cotton', '100% Cotton Jersey', 'Cotton-Modal Blend'],
    oversized: ['240 GSM Terry Cotton', '220 GSM Combed Cotton', 'Heavy Cotton Jersey'],
    shirt: ['Cotton Poplin', 'Cotton Corduroy', 'Linen-Cotton Blend', 'Viscose Rayon'],
    hoodie: ['320 GSM Fleece', 'Cotton-Poly Fleece', 'Brushed Terry'],
    sweatshirt: ['300 GSM Loopback Cotton', 'Cotton-Poly Fleece'],
    jeans: ['Stretch Cotton Denim', 'Rigid Cotton Denim', '12 oz Cotton Denim'],
    trousers: ['Cotton Twill', 'Poly-Viscose Blend', 'Ripstop Cotton'],
    joggers: ['Cotton Terry', 'Poly-Cotton Fleece'],
    shorts: ['Cotton Terry', 'Poly Mesh', 'Cotton Twill'],
    jacket: ['Cotton Canvas', 'Nylon Shell', 'Cotton Denim', 'Quilted Poly'],
    top: ['Cotton Rib', 'Viscose Crepe', 'Cotton-Lycra'],
    dress: ['Viscose Rayon', 'Cotton Poplin', 'Georgette', 'Cotton-Lycra Rib'],
    coord: ['Cotton Rib Knit', 'Cotton Poplin', 'Cotton Terry'],
    bag: ['600D Poly Canvas', 'Cotton Canvas', 'Vegan Leather'],
    cap: ['Cotton Twill', 'Poly Mesh Back', 'Brushed Cotton'],
    wallet: ['Vegan Leather', 'Canvas & PU'],
    socks: ['Combed Cotton Blend', 'Cotton-Spandex Rib'],
    watch: ['Stainless Steel & Silicone', 'Alloy Case, Leather Strap'],
    misc: ['Mixed Materials', 'Poly Canvas', 'Vegan Leather']
  };
  var CARE = {
    default: ['Machine wash cold, inside out', 'Do not bleach', 'Tumble dry low', 'Warm iron on reverse'],
    denim: ['Machine wash cold separately', 'Do not bleach', 'Line dry in shade', 'Wash less, wear more'],
    hard: ['Wipe clean with a damp cloth', 'Keep away from prolonged moisture', 'Do not machine wash']
  };
  var FITS = {
    tee: 'Regular fit', oversized: 'Oversized fit', shirt: 'Relaxed fit', hoodie: 'Relaxed fit',
    sweatshirt: 'Regular fit', jeans: 'True to size', trousers: 'Relaxed fit', joggers: 'Tapered fit',
    shorts: 'Regular fit', jacket: 'Relaxed fit', top: 'Slim fit', dress: 'Regular fit',
    coord: 'Relaxed fit', bag: 'One size', cap: 'Adjustable', wallet: 'One size',
    socks: 'Stretch fit', watch: 'Adjustable strap', misc: 'One size'
  };
  var PRINTS = ['none', 'slogan', 'stripe', 'grid', 'blob', 'sun', 'wave', 'checks', 'star', 'circle'];
  var SLOGANS = ['NUKKAD', 'OFF THE\nCORNER', 'GULLY\nBOYS', 'NO PLAN\nJUST VIBES',
    'SLOW\nSUNDAY', 'LATE\nSHOW', 'CITY\nSIDE', 'ROOFTOP\nCLUB', '4 AM\nCHAI', 'STREET\nSIDE'];

  /* ---------- generate catalog ---------------------------------------- */
  var PRODUCTS = [];
  var pid = 1000;

  TAXONOMY.forEach(function (cat) {
    cat.subs.forEach(function (sub) {
      var per = cat.slug === 'accessories' ? 12 : 14;
      for (var i = 0; i < per; i++) {
        pid++;
        var seed = cat.slug + '|' + sub.slug + '|' + i;
        var rnd = seeded(seed);
        var kind = sub.kind;
        var motif = pick(rnd, MOTIF[kind] || ['Classic']);
        var series = pick(rnd, SERIES);
        var name = motif + ' ' + sub.name.replace(/s$/, '') + ' — ' + series;
        if (kind === 'misc') name = motif + ' — ' + series;

        var colorKeys = Object.keys(COLORS);
        var nColors = intBetween(rnd, 2, 5);
        var chosen = pickN(rnd, colorKeys, nColors);

        var base = intBetween(rnd, sub.price[0], sub.price[1]);
        var mrp = Math.round((base * (1 + intBetween(rnd, 25, 62) / 100)) / 10) * 10 + 9;
        var price = Math.round(base / 10) * 10 + 9;
        var discount = Math.round((1 - price / mrp) * 100);

        var ratingN = intBetween(rnd, 11, 2480);
        var rating = Math.round((3.5 + rnd() * 1.5) * 10) / 10;
        if (rating > 5) rating = 5;

        // stock per size
        var stock = {}, totalStock = 0;
        sub.sizes.forEach(function (s) {
          var q = rnd() < 0.11 ? 0 : intBetween(rnd, 1, 34);
          stock[s] = q; totalStock += q;
        });
        if (totalStock === 0) { stock[sub.sizes[0]] = 6; totalStock = 6; }

        var isNew = rnd() < 0.22;
        var isBest = rnd() < 0.2;
        var pop = intBetween(rnd, 40, 9800);
        var print = pick(rnd, PRINTS);
        if (kind === 'jeans' || kind === 'trousers' || kind === 'watch' || kind === 'wallet') print = 'none';

        PRODUCTS.push({
          id: 'nk-' + pid,
          name: name,
          brand: pick(rnd, ['NUKKAD', 'NUKKAD', 'NUKKAD ORIGINALS', 'NUKKAD LABS', 'GULLY CO.']),
          cat: cat.slug, catName: cat.name,
          sub: sub.slug, subName: sub.name,
          kind: kind,
          price: price, mrp: mrp, discount: discount,
          rating: rating, ratingCount: ratingN,
          sizes: sub.sizes.slice(),
          stock: stock, totalStock: totalStock,
          colors: chosen.map(function (k) { return { key: k, name: COLORS[k].name, hex: COLORS[k].hex, fam: COLORS[k].fam }; }),
          print: print,
          slogan: pick(rnd, SLOGANS),
          fabric: pick(rnd, FABRIC[kind] || ['Cotton Blend']),
          fit: FITS[kind] || 'Regular fit',
          care: (kind === 'watch' || kind === 'wallet' || kind === 'bag') ? CARE.hard
              : (kind === 'jeans' ? CARE.denim : CARE.default),
          isNew: isNew, isBest: isBest, popularity: pop,
          added: Date.now() - intBetween(rnd, 0, 210) * 86400000,
          sku: 'NK' + String(pid) + '-' + sub.slug.slice(0, 3).toUpperCase(),
          origin: 'Made in India',
          seed: seed
        });
      }
    });
  });

  /* ---------- coupons -------------------------------------------------- */
  var DAY = 86400000, NOW = Date.now();
  var COUPONS = [
    { code: 'CORNER15',  type: 'percent', value: 15, minOrder: 999,  maxDiscount: 400,
      label: '15% off orders over Rs 999', expires: NOW + 26 * DAY, limit: 5, active: true },
    { code: 'FIRSTFIT',  type: 'percent', value: 25, minOrder: 1499, maxDiscount: 600,
      label: '25% off your first order over Rs 1,499', expires: NOW + 60 * DAY, limit: 1, active: true },
    { code: 'FLAT300',   type: 'flat',    value: 300, minOrder: 1799, maxDiscount: 300,
      label: 'Flat Rs 300 off orders over Rs 1,799', expires: NOW + 14 * DAY, limit: 3, active: true },
    { code: 'BULK500',   type: 'flat',    value: 500, minOrder: 2999, maxDiscount: 500,
      label: 'Flat Rs 500 off orders over Rs 2,999', expires: NOW + 40 * DAY, limit: 4, active: true },
    { code: 'MONSOON10', type: 'percent', value: 10, minOrder: 599,  maxDiscount: 250,
      label: '10% off, no minimum fuss', expires: NOW + 9 * DAY, limit: 10, active: true },
    { code: 'REWIND20',  type: 'percent', value: 20, minOrder: 2499, maxDiscount: 800,
      label: '20% off orders over Rs 2,499', expires: NOW - 3 * DAY, limit: 5, active: true },
    { code: 'CLOSEOUT',  type: 'percent', value: 30, minOrder: 999,  maxDiscount: 900,
      label: 'Ended — 30% off closeout', expires: NOW + 5 * DAY, limit: 2, active: false }
  ];

  /* ---------- review seeds -------------------------------------------- */
  var RV_NAMES = ['Aarav M.', 'Ishita R.', 'Rohan K.', 'Meera S.', 'Kabir J.', 'Ananya P.',
    'Devansh T.', 'Sara V.', 'Nikhil B.', 'Tara G.', 'Yash D.', 'Riya N.', 'Arjun L.',
    'Zoya H.', 'Vikram A.', 'Neha C.', 'Farhan Q.', 'Diya W.', 'Manav E.', 'Kritika O.'];
  var RV_TITLES = ['Exactly what I wanted', 'Fabric is the highlight', 'Good pick for the price',
    'Fits better than expected', 'Wearing it on repeat', 'Solid everyday piece',
    'Colour is spot on', 'Would buy again', 'Nice weight to it', 'Comfortable all day'];
  var RV_BODIES = [
    'Ordered my usual size and the fit is bang on. Fabric feels thick without being warm, which is rare at this price.',
    'The colour in the photos matches what arrived. Held up well after two washes with no fading so far.',
    'Comfortable for long days. Stitching looks neat on the inside too, which tells you a lot.',
    'Slightly roomier than I expected but that is the point of the cut. Sizing down would have been too tight.',
    'Delivery was quicker than the estimate. Packaging was simple and recyclable, no plastic waste.',
    'Wore it through a full workday and an evening out. No sagging at the neck, no itch.',
    'Good drape and the shade is versatile enough to pair with almost anything I own.',
    'Bought two colours after trying the first one. That is probably the strongest review I can give.',
    'Fabric softened nicely after the first wash. Length is right for my height at 5 feet 9.',
    'Does what it says. Nothing flashy, just well made and easy to wear.'
  ];
  var RV_FITS = ['True to size', 'Runs slightly large', 'Runs slightly small'];

  w.NK_DATA = {
    TAXONOMY: TAXONOMY,
    PRODUCTS: PRODUCTS,
    COLORS: COLORS,
    COLOR_FAMS: COLOR_FAMS,
    COUPONS: COUPONS,
    SIZE_SETS: { alpha: SZ_ALPHA, waist: SZ_WAIST, free: SZ_FREE, shoe: SZ_SHOE },
    REVIEW_SEED: { names: RV_NAMES, titles: RV_TITLES, bodies: RV_BODIES, fits: RV_FITS },
    seeded: seeded, pick: pick, pickN: pickN, intBetween: intBetween
  };
})(window);
