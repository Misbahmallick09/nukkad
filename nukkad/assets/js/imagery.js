/* ==========================================================================
   NUKKAD — garment imagery engine
   Every product photo on this site is drawn as vector art at request time:
   no external image requests, no grey placeholders, four views per product
   (front, back, flat-lay, fabric detail) rendered in the product's colourway.
   ========================================================================== */
(function (w) {
  'use strict';

  var W = 600, H = 800;
  var cache = Object.create(null);

  /* ---------- colour maths -------------------------------------------- */
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgb2hex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      v = Math.max(0, Math.min(255, Math.round(v)));
      return (v < 16 ? '0' : '') + v.toString(16);
    }).join('');
  }
  function shade(hex, amt) {
    var c = hex2rgb(hex);
    if (amt >= 0) return rgb2hex(c[0] + (255 - c[0]) * amt, c[1] + (255 - c[1]) * amt, c[2] + (255 - c[2]) * amt);
    return rgb2hex(c[0] * (1 + amt), c[1] * (1 + amt), c[2] * (1 + amt));
  }
  function lum(hex) {
    var c = hex2rgb(hex);
    return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  }
  function inkOn(hex) { return lum(hex) > 0.58 ? '#151513' : '#F4F2EC'; }

  /* Spaces, = : / and , are legal in a data URI and cost three characters each
     when escaped, so they are put back verbatim to keep these strings readable.
     The apostrophe is the one that must not survive: encodeURIComponent leaves
     it alone, the SVG quotes all of its attributes with it, and the HTML
     attribute carrying the result is single-quoted too — so a raw ' would close
     the attribute at the first xmlns and truncate the whole image. */
  function uri(svg) {
    return 'data:image/svg+xml,' + encodeURIComponent(svg)
      .replace(/%20/g, ' ').replace(/%3D/g, '=').replace(/%3A/g, ':')
      .replace(/%2F/g, '/').replace(/%2C/g, ',').replace(/'/g, '%27');
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  var DSPFONT = "Impact, Haettenschweiler, 'Arial Narrow', 'Arial Black', sans-serif";
  var UIFONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

  /* ---------- backdrop -------------------------------------------------- */
  function backdrop(tone) {
    return "<rect width='" + W + "' height='" + H + "' fill='url(#bg)'/>" +
      "<ellipse cx='300' cy='728' rx='196' ry='26' fill='#0f1a15' opacity='.09'/>" +
      "<ellipse cx='300' cy='726' rx='120' ry='15' fill='#0f1a15' opacity='.07'/>";
  }
  function defs(base, extra) {
    var hi = shade(base, .17), lo = shade(base, -.24), lo2 = shade(base, -.42);
    return "<defs>" +
      "<linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>" +
        "<stop offset='0' stop-color='#F7F6F1'/><stop offset='.62' stop-color='#EFEEE7'/>" +
        "<stop offset='1' stop-color='#E4E3DA'/></linearGradient>" +
      "<linearGradient id='cloth' x1='.12' y1='0' x2='.9' y2='1'>" +
        "<stop offset='0' stop-color='" + hi + "'/><stop offset='.42' stop-color='" + base + "'/>" +
        "<stop offset='1' stop-color='" + lo + "'/></linearGradient>" +
      "<linearGradient id='clothB' x1='0' y1='0' x2='1' y2='.7'>" +
        "<stop offset='0' stop-color='" + base + "'/><stop offset='1' stop-color='" + lo2 + "'/></linearGradient>" +
      "<linearGradient id='fold' x1='0' y1='0' x2='1' y2='0'>" +
        "<stop offset='0' stop-color='#000' stop-opacity='.16'/><stop offset='.28' stop-color='#000' stop-opacity='0'/>" +
        "<stop offset='.72' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.2'/>" +
      "</linearGradient>" + (extra || '') + "</defs>";
  }

  /* ---------- generic top (tee / sweat / hoodie / shirt / jacket) ------- */
  function topPath(o) {
    var cx = 300;
    var nw = o.neckW, ny = o.neckY, nd = o.neckD;
    var sx = o.shoulderX, sy = o.shoulderY;
    var slOut = o.sleeveOut, slLen = o.sleeveLen, slIn = o.sleeveIn;
    var pit = o.pitY, bw = o.bodyW, hem = o.hemY, taper = o.taper || 0;
    var lHem = cx - bw / 2 + taper, rHem = cx + bw / 2 - taper;
    return 'M' + (cx - nw / 2) + ',' + ny +
      ' L' + (cx - sx) + ',' + sy +
      ' L' + (cx - slOut) + ',' + slLen +
      ' L' + (cx - slIn) + ',' + (slLen + o.cuff) +
      ' L' + (cx - bw / 2) + ',' + pit +
      ' L' + lHem + ',' + hem +
      ' Q' + cx + ',' + (hem + o.hemCurve) + ' ' + rHem + ',' + hem +
      ' L' + (cx + bw / 2) + ',' + pit +
      ' L' + (cx + slIn) + ',' + (slLen + o.cuff) +
      ' L' + (cx + slOut) + ',' + slLen +
      ' L' + (cx + sx) + ',' + sy +
      ' L' + (cx + nw / 2) + ',' + ny +
      ' Q' + cx + ',' + (ny + nd) + ' ' + (cx - nw / 2) + ',' + ny + ' Z';
  }

  var TOPS = {
    tee:        { neckW: 104, neckY: 196, neckD: 44, shoulderX: 130, shoulderY: 214, sleeveOut: 196, sleeveLen: 344, sleeveIn: 132, cuff: 26, pitY: 320, bodyW: 268, hemY: 636, taper: 6, hemCurve: 16 },
    oversized:  { neckW: 116, neckY: 200, neckD: 40, shoulderX: 158, shoulderY: 226, sleeveOut: 214, sleeveLen: 402, sleeveIn: 152, cuff: 30, pitY: 372, bodyW: 306, hemY: 664, taper: 0, hemCurve: 12 },
    sweatshirt: { neckW: 108, neckY: 200, neckD: 40, shoulderX: 142, shoulderY: 220, sleeveOut: 204, sleeveLen: 400, sleeveIn: 148, cuff: 30, pitY: 344, bodyW: 284, hemY: 626, taper: 4, hemCurve: 8 },
    hoodie:     { neckW: 118, neckY: 232, neckD: 34, shoulderX: 150, shoulderY: 250, sleeveOut: 210, sleeveLen: 418, sleeveIn: 152, cuff: 30, pitY: 366, bodyW: 296, hemY: 648, taper: 4, hemCurve: 8 },
    shirt:      { neckW: 96,  neckY: 194, neckD: 30, shoulderX: 134, shoulderY: 216, sleeveOut: 200, sleeveLen: 412, sleeveIn: 144, cuff: 28, pitY: 336, bodyW: 274, hemY: 654, taper: 10, hemCurve: 26 },
    jacket:     { neckW: 112, neckY: 206, neckD: 28, shoulderX: 148, shoulderY: 228, sleeveOut: 208, sleeveLen: 424, sleeveIn: 150, cuff: 26, pitY: 352, bodyW: 292, hemY: 630, taper: 6, hemCurve: 6 },
    top:        { neckW: 112, neckY: 214, neckD: 52, shoulderX: 106, shoulderY: 226, sleeveOut: 128, sleeveLen: 268, sleeveIn: 104, cuff: 12, pitY: 300, bodyW: 208, hemY: 552, taper: 14, hemCurve: 14 }
  };

  /* ---------- prints ---------------------------------------------------- */
  function printArt(kind, p, base, cx, cy, wid) {
    var c = inkOn(base), alt = base === '#E8A700' ? '#151513' : '#FFB703';
    var g = '';
    switch (kind) {
      case 'slogan':
        var lines = String(p.slogan || 'NUKKAD').split('\n');
        var fs = lines.length > 1 ? 46 : 54;
        lines.forEach(function (ln, i) {
          g += "<text x='" + cx + "' y='" + (cy - (lines.length - 1) * fs * .5 + i * fs * 1.02) + "' text-anchor='middle' " +
            "font-family=\"" + DSPFONT + "\" font-size='" + fs + "' font-weight='900' letter-spacing='1.5' " +
            "fill='" + c + "' opacity='.92'>" + esc(ln) + "</text>";
        });
        g += "<rect x='" + (cx - wid * .30) + "' y='" + (cy + (lines.length - 1) * fs * .5 + 18) + "' width='" + (wid * .60) + "' height='4' fill='" + alt + "' opacity='.9'/>";
        break;
      case 'stripe':
        for (var i = 0; i < 7; i++)
          g += "<rect x='" + (cx - wid / 2) + "' y='" + (cy - 88 + i * 26) + "' width='" + wid + "' height='11' fill='" + c + "' opacity='" + (i % 2 ? .16 : .3) + "'/>";
        break;
      case 'grid':
        for (var r = 0; r < 5; r++) for (var k = 0; k < 5; k++)
          g += "<rect x='" + (cx - 74 + k * 30) + "' y='" + (cy - 74 + r * 30) + "' width='20' height='20' rx='3' fill='" + c + "' opacity='" + ((r + k) % 2 ? .3 : .13) + "'/>";
        break;
      case 'blob':
        g += "<path d='M" + (cx - 62) + "," + cy + " q6,-64 62,-58 q58,6 56,58 q-2,56 -58,56 q-56,0 -60,-56 z' fill='" + c + "' opacity='.24'/>" +
             "<circle cx='" + (cx + 16) + "' cy='" + (cy - 14) + "' r='26' fill='" + alt + "' opacity='.72'/>";
        break;
      case 'sun':
        g += "<circle cx='" + cx + "' cy='" + cy + "' r='44' fill='" + alt + "' opacity='.85'/>";
        for (var s = 0; s < 12; s++) {
          var a = s * Math.PI / 6;
          g += "<rect x='" + (cx - 2.5) + "' y='" + (cy - 78) + "' width='5' height='20' rx='2.5' fill='" + c + "' opacity='.55' transform='rotate(" + (s * 30) + " " + cx + " " + cy + ")'/>";
        }
        break;
      case 'wave':
        for (var v = 0; v < 4; v++)
          g += "<path d='M" + (cx - 84) + "," + (cy - 40 + v * 28) + " q28,-20 56,0 t56,0' fill='none' stroke='" + c + "' stroke-width='6' stroke-linecap='round' opacity='" + (.3 - v * .04) + "'/>";
        break;
      case 'checks':
        for (var q = 0; q < 4; q++) for (var z = 0; z < 4; z++)
          if ((q + z) % 2 === 0) g += "<rect x='" + (cx - 76 + z * 38) + "' y='" + (cy - 76 + q * 38) + "' width='38' height='38' fill='" + c + "' opacity='.2'/>";
        break;
      case 'star':
        g += "<path d='M" + cx + "," + (cy - 62) + " l17,40 43,3 -33,28 10,42 -37,-23 -37,23 10,-42 -33,-28 43,-3 z' fill='" + alt + "' opacity='.9'/>";
        break;
      case 'circle':
        g += "<circle cx='" + cx + "' cy='" + cy + "' r='58' fill='none' stroke='" + c + "' stroke-width='9' opacity='.34'/>" +
             "<circle cx='" + cx + "' cy='" + cy + "' r='32' fill='none' stroke='" + alt + "' stroke-width='9' opacity='.85'/>";
        break;
      default: return '';
    }
    return g;
  }

  /* ---------- garment builders ----------------------------------------- */
  function buildTop(p, base, view) {
    var o = TOPS[p.kind] || TOPS.tee;
    var seam = shade(base, -.34), rib = shade(base, -.14);
    var g = "<path d='" + topPath(o) + "' fill='url(#" + (view === 'back' ? 'clothB' : 'cloth') + ")'/>";
    g += "<path d='" + topPath(o) + "' fill='url(#fold)'/>";
    var cx = 300;

    // neckline rib
    g += "<path d='M" + (cx - o.neckW / 2) + "," + o.neckY + " Q" + cx + "," + (o.neckY + o.neckD) + " " + (cx + o.neckW / 2) + "," + o.neckY +
      "' fill='none' stroke='" + rib + "' stroke-width='11' stroke-linecap='round'/>";
    // sleeve cuffs
    g += "<line x1='" + (cx - o.sleeveOut + 4) + "' y1='" + (o.sleeveLen + 8) + "' x2='" + (cx - o.sleeveIn - 2) + "' y2='" + (o.sleeveLen + o.cuff - 4) +
      "' stroke='" + seam + "' stroke-width='3' opacity='.5'/>";
    g += "<line x1='" + (cx + o.sleeveOut - 4) + "' y1='" + (o.sleeveLen + 8) + "' x2='" + (cx + o.sleeveIn + 2) + "' y2='" + (o.sleeveLen + o.cuff - 4) +
      "' stroke='" + seam + "' stroke-width='3' opacity='.5'/>";
    // shoulder seams
    g += "<line x1='" + (cx - o.neckW / 2 - 4) + "' y1='" + (o.neckY + 4) + "' x2='" + (cx - o.shoulderX + 8) + "' y2='" + (o.shoulderY + 4) + "' stroke='" + seam + "' stroke-width='2.5' opacity='.42'/>";
    g += "<line x1='" + (cx + o.neckW / 2 + 4) + "' y1='" + (o.neckY + 4) + "' x2='" + (cx + o.shoulderX - 8) + "' y2='" + (o.shoulderY + 4) + "' stroke='" + seam + "' stroke-width='2.5' opacity='.42'/>";
    // hem stitch
    g += "<path d='M" + (cx - o.bodyW / 2 + (o.taper || 0) + 6) + "," + (o.hemY - 12) + " Q" + cx + "," + (o.hemY + o.hemCurve - 12) + " " + (cx + o.bodyW / 2 - (o.taper || 0) - 6) + "," + (o.hemY - 12) +
      "' fill='none' stroke='" + seam + "' stroke-width='2' stroke-dasharray='7 6' opacity='.4'/>";

    if (p.kind === 'hoodie') {
      g += "<path d='M" + (cx - 96) + ",250 q-16,-72 96,-72 q112,0 96,72 q-30,-40 -96,-40 q-66,0 -96,40 z' fill='" + shade(base, -.16) + "'/>";
      g += "<path d='M" + (cx - 74) + ",244 q22,-30 74,-30 q52,0 74,30' fill='none' stroke='" + seam + "' stroke-width='3' opacity='.5'/>";
      if (view !== 'back') {
        g += "<circle cx='" + (cx - 30) + "' cy='266' r='6' fill='" + seam + "' opacity='.6'/><circle cx='" + (cx + 30) + "' cy='266' r='6' fill='" + seam + "' opacity='.6'/>";
        g += "<path d='M" + (cx - 30) + ",270 q-6,52 4,86' fill='none' stroke='#EDEAE0' stroke-width='6' stroke-linecap='round'/>";
        g += "<path d='M" + (cx + 30) + ",270 q6,46 -2,74' fill='none' stroke='#EDEAE0' stroke-width='6' stroke-linecap='round'/>";
        g += "<path d='M" + (cx - 92) + ",486 h184 v66 q-92,16 -184,0 z' fill='" + shade(base, -.1) + "' opacity='.85'/>";
        g += "<path d='M" + (cx - 92) + ",486 h184' stroke='" + seam + "' stroke-width='2.5' opacity='.5' fill='none'/>";
      }
    }
    if (p.kind === 'sweatshirt') {
      g += "<rect x='" + (cx - o.bodyW / 2 + 4) + "' y='" + (o.hemY - 30) + "' width='" + (o.bodyW - 8) + "' height='30' fill='" + rib + "' opacity='.75'/>";
    }
    if (p.kind === 'shirt') {
      if (view !== 'back') {
        g += "<rect x='" + (cx - 15) + "' y='206' width='30' height='" + (o.hemY - 200) + "' fill='" + shade(base, .07) + "'/>";
        g += "<line x1='" + (cx - 15) + "' y1='206' x2='" + (cx - 15) + "' y2='" + o.hemY + "' stroke='" + seam + "' stroke-width='2' opacity='.45'/>";
        g += "<line x1='" + (cx + 15) + "' y1='206' x2='" + (cx + 15) + "' y2='" + o.hemY + "' stroke='" + seam + "' stroke-width='2' opacity='.45'/>";
        for (var b = 0; b < 6; b++) g += "<circle cx='" + cx + "' cy='" + (250 + b * 68) + "' r='7' fill='" + shade(base, .3) + "' stroke='" + seam + "' stroke-width='1.5'/>";
        g += "<path d='M" + (cx - 96) + ",440 h68 v58 h-68 z' fill='none' stroke='" + seam + "' stroke-width='2.5' opacity='.45'/>";
      }
      g += "<path d='M" + (cx - 48) + ",192 l48,44 48,-44 l26,20 -74,58 -74,-58 z' fill='" + shade(base, .1) + "' stroke='" + seam + "' stroke-width='2'/>";
    }
    if (p.kind === 'jacket') {
      g += "<path d='M" + (cx - 56) + ",206 l56,50 56,-50 l24,18 -80,62 -80,-62 z' fill='" + shade(base, -.08) + "' stroke='" + seam + "' stroke-width='2'/>";
      if (view !== 'back') {
        g += "<line x1='" + cx + "' y1='256' x2='" + cx + "' y2='" + o.hemY + "' stroke='" + seam + "' stroke-width='4'/>";
        g += "<line x1='" + cx + "' y1='262' x2='" + cx + "' y2='" + (o.hemY - 6) + "' stroke='" + shade(base, .4) + "' stroke-width='1.5' stroke-dasharray='4 4'/>";
        g += "<rect x='" + (cx - 118) + "' y='470' width='84' height='16' rx='8' fill='" + seam + "' opacity='.4'/>";
        g += "<rect x='" + (cx + 34) + "' y='470' width='84' height='16' rx='8' fill='" + seam + "' opacity='.4'/>";
      }
      g += "<rect x='" + (cx - o.bodyW / 2 + 4) + "' y='" + (o.hemY - 26) + "' width='" + (o.bodyW - 8) + "' height='26' fill='" + rib + "' opacity='.7'/>";
    }

    // print
    var py = p.kind === 'hoodie' ? 400 : (p.kind === 'top' ? 380 : 420);
    if (p.print && p.print !== 'none') {
      var showFront = view !== 'back';
      var backOnly = /Back-Print/i.test(p.name);
      if ((backOnly && view === 'back') || (!backOnly && showFront && p.kind !== 'shirt' && p.kind !== 'jacket')) {
        g += printArt(p.print, p, base, cx, py, 220);
      } else if (p.kind === 'shirt' && p.print === 'checks') {
        g += printArt('checks', p, base, cx, py, 220);
      }
    }
    // small chest brandmark
    if (view !== 'back' && p.kind !== 'shirt' && (!p.print || p.print === 'none')) {
      g += "<text x='" + cx + "' y='330' text-anchor='middle' font-family=\"" + DSPFONT + "\" font-size='19' letter-spacing='4' fill='" + inkOn(base) + "' opacity='.55'>NUKKAD</text>";
    }
    return g;
  }

  function buildPants(p, base, view) {
    var cx = 300, seam = shade(base, -.36), top = 250, hem = p.kind === 'shorts' ? 500 : 720;
    var wW = p.kind === 'jeans' || p.kind === 'trousers' ? 176 : 168;
    var legW = p.kind === 'joggers' ? 52 : (p.kind === 'shorts' ? 74 : 60);
    var flare = p.kind === 'trousers' ? 14 : 0;
    var g = "<path d='M" + (cx - wW / 2) + ',' + top +
      ' L' + (cx + wW / 2) + ',' + top +
      ' L' + (cx + wW / 2 - 6) + ',400' +
      ' L' + (cx + legW + flare) + ',' + hem +
      ' L' + (cx + 10) + ',' + hem +
      ' L' + cx + ',470' +
      ' L' + (cx - 10) + ',' + hem +
      ' L' + (cx - legW - flare) + ',' + hem +
      ' L' + (cx - wW / 2 + 6) + ',400 Z' +
      "' fill='url(#" + (view === 'back' ? 'clothB' : 'cloth') + ")'/>";
    g += "<path d='M" + (cx - wW / 2) + ',' + top + ' L' + (cx + wW / 2) + ',' + top + ' L' + (cx + wW / 2 - 6) + ',400 L' + (cx + legW + flare) + ',' + hem +
      ' L' + (cx + 10) + ',' + hem + ' L' + cx + ',470 L' + (cx - 10) + ',' + hem + ' L' + (cx - legW - flare) + ',' + hem + ' L' + (cx - wW / 2 + 6) + ",400 Z' fill='url(#fold)'/>";
    // waistband
    g += "<rect x='" + (cx - wW / 2) + "' y='" + top + "' width='" + wW + "' height='38' fill='" + shade(base, -.12) + "'/>";
    g += "<line x1='" + (cx - wW / 2) + "' y1='" + (top + 38) + "' x2='" + (cx + wW / 2) + "' y2='" + (top + 38) + "' stroke='" + seam + "' stroke-width='2.5' opacity='.6'/>";
    if (p.kind === 'joggers') {
      g += "<path d='M" + (cx - 30) + "," + (top + 20) + " q30,14 60,0' fill='none' stroke='#EDEAE0' stroke-width='5' stroke-linecap='round'/>";
      g += "<rect x='" + (cx - legW - 4) + "' y='" + (hem - 34) + "' width='" + (legW - 6) + "' height='34' fill='" + shade(base, -.15) + "'/>";
      g += "<rect x='" + (cx + 10) + "' y='" + (hem - 34) + "' width='" + (legW - 6) + "' height='34' fill='" + shade(base, -.15) + "'/>";
    }
    if (view !== 'back') {
      g += "<line x1='" + cx + "' y1='" + (top + 38) + "' x2='" + cx + "' y2='356' stroke='" + seam + "' stroke-width='2.5' opacity='.55'/>";
      if (p.kind === 'jeans' || p.kind === 'trousers') {
        g += "<path d='M" + (cx + 8) + "," + (top + 40) + " q16,34 4,78' fill='none' stroke='" + shade(base, .34) + "' stroke-width='2' stroke-dasharray='6 5'/>";
        g += "<circle cx='" + (cx - wW / 2 + 20) + "' cy='" + (top + 19) + "' r='7' fill='" + shade(base, .3) + "' stroke='" + seam + "' stroke-width='1.5'/>";
        g += "<path d='M" + (cx - wW / 2 + 8) + "," + (top + 44) + " l52,0 -14,44 z' fill='none' stroke='" + shade(base, .28) + "' stroke-width='2' stroke-dasharray='5 4'/>";
        g += "<path d='M" + (cx + wW / 2 - 8) + "," + (top + 44) + " l-52,0 14,44 z' fill='none' stroke='" + shade(base, .28) + "' stroke-width='2' stroke-dasharray='5 4'/>";
      }
      if (p.kind === 'trousers' && /Cargo/i.test(p.name)) {
        g += "<rect x='" + (cx - legW - 2) + "' y='500' width='56' height='72' rx='5' fill='" + shade(base, -.08) + "' stroke='" + seam + "' stroke-width='2'/>";
        g += "<rect x='" + (cx + 12) + "' y='500' width='56' height='72' rx='5' fill='" + shade(base, -.08) + "' stroke='" + seam + "' stroke-width='2'/>";
      }
    } else {
      g += "<path d='M" + (cx - wW / 2 + 14) + "," + (top + 52) + " h56 v42 h-56 z' fill='none' stroke='" + shade(base, .26) + "' stroke-width='2' stroke-dasharray='5 4'/>";
      g += "<path d='M" + (cx + wW / 2 - 70) + "," + (top + 52) + " h56 v42 h-56 z' fill='none' stroke='" + shade(base, .26) + "' stroke-width='2' stroke-dasharray='5 4'/>";
    }
    // leg hem stitching
    g += "<line x1='" + (cx - legW - flare) + "' y1='" + (hem - 12) + "' x2='" + (cx - 12) + "' y2='" + (hem - 12) + "' stroke='" + seam + "' stroke-width='2' stroke-dasharray='6 5' opacity='.45'/>";
    g += "<line x1='" + (cx + 12) + "' y1='" + (hem - 12) + "' x2='" + (cx + legW + flare) + "' y2='" + (hem - 12) + "' stroke='" + seam + "' stroke-width='2' stroke-dasharray='6 5' opacity='.45'/>";
    return g;
  }

  function buildDress(p, base, view) {
    var cx = 300, seam = shade(base, -.32);
    var d = 'M' + (cx - 56) + ',214 L' + (cx - 96) + ',236 L' + (cx - 104) + ',300 L' + (cx - 92) + ',364' +
      ' L' + (cx - 150) + ',664 Q' + cx + ',702 ' + (cx + 150) + ',664' +
      ' L' + (cx + 92) + ',364 L' + (cx + 104) + ',300 L' + (cx + 96) + ',236 L' + (cx + 56) + ',214' +
      ' Q' + cx + ',256 ' + (cx - 56) + ',214 Z';
    var g = "<path d='" + d + "' fill='url(#" + (view === 'back' ? 'clothB' : 'cloth') + ")'/><path d='" + d + "' fill='url(#fold)'/>";
    g += "<path d='M" + (cx - 56) + ",214 Q" + cx + ",256 " + (cx + 56) + ",214' fill='none' stroke='" + seam + "' stroke-width='7' stroke-linecap='round'/>";
    g += "<path d='M" + (cx - 92) + ",372 Q" + cx + ",396 " + (cx + 92) + ",372' fill='none' stroke='" + seam + "' stroke-width='3' opacity='.55'/>";
    for (var i = 1; i < 5; i++)
      g += "<path d='M" + (cx - 92 + i * 37) + ",380 L" + (cx - 150 + i * 60) + ",666' fill='none' stroke='" + seam + "' stroke-width='2' opacity='.22'/>";
    g += "<path d='M" + (cx - 150) + ",656 Q" + cx + ",694 " + (cx + 150) + ",656' fill='none' stroke='" + seam + "' stroke-width='2' stroke-dasharray='7 6' opacity='.4'/>";
    if (p.print && p.print !== 'none' && view !== 'back') g += printArt(p.print, p, base, cx, 490, 190);
    return g;
  }

  function buildCoord(p, base, view) {
    var seam = shade(base, -.32), g = '';
    // cropped top
    var t = 'M186,206 L128,232 L104,330 L152,350 L160,300 L156,430 Q252,452 348,430 L344,300 L352,350 L400,330 L376,232 L318,206 Q252,244 186,206 Z';
    g += "<path d='" + t + "' fill='url(#cloth)' transform='translate(48,0) scale(0.82) translate(52,30)'/>";
    // wide trousers
    var b = 'M170,470 L430,470 L424,540 L470,760 L318,760 L300,600 L282,760 L130,760 L176,540 Z';
    g += "<path d='" + b + "' fill='url(#clothB)' transform='translate(0,-14) scale(0.86) translate(50,64)'/>";
    g += "<rect x='196' y='388' width='208' height='30' rx='4' fill='" + shade(base, -.14) + "'/>";
    g += "<path d='M270,400 q30,12 60,0' fill='none' stroke='#EDEAE0' stroke-width='5' stroke-linecap='round'/>";
    g += "<line x1='196' y1='418' x2='404' y2='418' stroke='" + seam + "' stroke-width='2.5' opacity='.5'/>";
    if (p.print && p.print !== 'none' && view !== 'back') g += printArt(p.print, p, base, 300, 268, 150);
    return g;
  }

  function buildCap(p, base) {
    var seam = shade(base, -.34), cx = 300, cy = 430;
    var g = "<path d='M" + (cx - 148) + ',' + cy + " a148,138 0 0 1 296,0 z' fill='url(#cloth)'/>";
    g += "<path d='M" + (cx - 148) + ',' + cy + " a148,138 0 0 1 296,0 z' fill='url(#fold)'/>";
    for (var i = -2; i <= 2; i++)
      g += "<path d='M" + cx + "," + (cy - 138) + " Q" + (cx + i * 62) + "," + (cy - 60) + " " + (cx + i * 76) + "," + cy + "' fill='none' stroke='" + seam + "' stroke-width='2.5' opacity='.35'/>";
    g += "<path d='M" + (cx - 154) + ',' + cy + ' q154,86 308,0 q-6,42 -154,44 q-148,-2 -154,-44 z' + "' fill='" + shade(base, -.2) + "'/>";
    g += "<path d='M" + (cx - 146) + ',' + (cy + 12) + " q146,74 292,0' fill='none' stroke='" + seam + "' stroke-width='2.5' stroke-dasharray='7 6' opacity='.5'/>";
    g += "<circle cx='" + cx + "' cy='" + (cy - 130) + "' r='9' fill='" + shade(base, -.24) + "'/>";
    if (/Trucker/i.test(p.name)) {
      g += "<path d='M" + (cx + 30) + ',' + (cy - 120) + " a148,138 0 0 1 118,120 l-118,0 z' fill='" + shade(base, .5) + "' opacity='.45'/>";
    }
    g += "<text x='" + cx + "' y='" + (cy - 44) + "' text-anchor='middle' font-family=\"" + DSPFONT + "\" font-size='30' letter-spacing='2.5' fill='" + inkOn(base) + "' opacity='.9'>NK</text>";
    return g;
  }

  function buildBag(p, base) {
    var seam = shade(base, -.34), cx = 300;
    var isBackpack = /Backpack/i.test(p.name), isTote = /Tote/i.test(p.name), isDuffle = /Duffle/i.test(p.name);
    var g = '';
    if (isDuffle) {
      g += "<rect x='" + (cx - 168) + "' y='352' width='336' height='196' rx='72' fill='url(#cloth)'/>";
      g += "<rect x='" + (cx - 168) + "' y='352' width='336' height='196' rx='72' fill='url(#fold)'/>";
      g += "<rect x='" + (cx - 60) + "' y='340' width='120' height='24' rx='12' fill='" + shade(base, -.2) + "'/>";
      g += "<path d='M" + (cx - 92) + ",364 q92,-56 184,0' fill='none' stroke='" + seam + "' stroke-width='11' stroke-linecap='round'/>";
      g += "<line x1='" + (cx - 150) + "' y1='450' x2='" + (cx + 150) + "' y2='450' stroke='" + seam + "' stroke-width='4' opacity='.55'/>";
    } else if (isTote) {
      g += "<path d='M" + (cx - 140) + ",380 h280 l-18,268 h-244 z' fill='url(#cloth)'/>";
      g += "<path d='M" + (cx - 140) + ",380 h280 l-18,268 h-244 z' fill='url(#fold)'/>";
      g += "<path d='M" + (cx - 76) + ",380 q0,-96 76,-96 q76,0 76,96' fill='none' stroke='" + seam + "' stroke-width='14' stroke-linecap='round'/>";
    } else if (isBackpack) {
      g += "<rect x='" + (cx - 122) + "' y='296' width='244' height='320' rx='42' fill='url(#cloth)'/>";
      g += "<rect x='" + (cx - 122) + "' y='296' width='244' height='320' rx='42' fill='url(#fold)'/>";
      g += "<path d='M" + (cx - 122) + ",380 q122,-64 244,0' fill='" + shade(base, -.14) + "'/>";
      g += "<path d='M" + (cx - 122) + ",380 q122,-64 244,0' fill='none' stroke='" + seam + "' stroke-width='3' opacity='.6'/>";
      g += "<rect x='" + (cx - 82) + "' y='450' width='164' height='108' rx='16' fill='" + shade(base, -.09) + "' stroke='" + seam + "' stroke-width='2.5'/>";
      g += "<path d='M" + (cx - 96) + ",300 q-44,80 -20,180' fill='none' stroke='" + shade(base, -.24) + "' stroke-width='17' stroke-linecap='round'/>";
      g += "<path d='M" + (cx + 96) + ",300 q44,80 20,180' fill='none' stroke='" + shade(base, -.24) + "' stroke-width='17' stroke-linecap='round'/>";
    } else {
      g += "<path d='M" + (cx - 128) + ",396 h256 v190 q-128,26 -256,0 z' fill='url(#cloth)'/>";
      g += "<path d='M" + (cx - 128) + ",396 h256 v190 q-128,26 -256,0 z' fill='url(#fold)'/>";
      g += "<path d='M" + (cx - 128) + ",396 h256 v54 q-128,22 -256,0 z' fill='" + shade(base, -.14) + "'/>";
      g += "<path d='M" + (cx + 116) + ",400 q56,-150 -180,-136' fill='none' stroke='" + shade(base, -.26) + "' stroke-width='15' stroke-linecap='round'/>";
      g += "<rect x='" + (cx - 26) + "' y='438' width='52' height='30' rx='7' fill='" + shade(base, -.3) + "'/>";
    }
    g += "<rect x='" + (cx - 34) + "' y='600' width='68' height='19' rx='4' fill='" + inkOn(base) + "' opacity='.16'/>";
    g += "<text x='" + cx + "' y='614' text-anchor='middle' font-family=\"" + DSPFONT + "\" font-size='14' letter-spacing='3' fill='" + inkOn(base) + "' opacity='.8'>NUKKAD</text>";
    return g;
  }

  function buildWallet(p, base) {
    var seam = shade(base, -.36), cx = 300;
    var g = "<rect x='" + (cx - 160) + "' y='330' width='320' height='230' rx='16' fill='url(#cloth)'/>";
    g += "<rect x='" + (cx - 160) + "' y='330' width='320' height='230' rx='16' fill='url(#fold)'/>";
    g += "<line x1='" + cx + "' y1='330' x2='" + cx + "' y2='560' stroke='" + seam + "' stroke-width='3' opacity='.4'/>";
    g += "<rect x='" + (cx - 146) + "' y='344' width='292' height='202' rx='11' fill='none' stroke='" + seam + "' stroke-width='2' stroke-dasharray='7 6' opacity='.55'/>";
    g += "<rect x='" + (cx + 24) + "' y='386' width='118' height='72' rx='7' fill='" + shade(base, .16) + "' opacity='.75'/>";
    g += "<rect x='" + (cx + 24) + "' y='424' width='118' height='72' rx='7' fill='" + shade(base, .08) + "' opacity='.75'/>";
    g += "<rect x='" + (cx - 142) + "' y='470' width='118' height='72' rx='7' fill='" + shade(base, .12) + "' opacity='.7'/>";
    g += "<text x='" + (cx - 84) + "' y='402' text-anchor='middle' font-family=\"" + DSPFONT + "\" font-size='20' letter-spacing='3' fill='" + inkOn(base) + "' opacity='.75'>NUKKAD</text>";
    return g;
  }

  function buildSocks(p, base) {
    var seam = shade(base, -.3);
    function sock(x, flip) {
      var s = "<path d='M" + x + ",300 h96 v168 q0,52 -56,64 q-62,12 -70,-40 q-6,-40 30,-52 z' fill='url(#cloth)' transform='" +
        (flip ? 'translate(' + (2 * x + 96) + ',0) scale(-1,1)' : '') + "'/>";
      s += "<rect x='" + (flip ? x : x) + "' y='300' width='96' height='46' fill='" + shade(base, -.16) + "' transform='" + (flip ? 'translate(' + (2 * x + 96) + ',0) scale(-1,1)' : '') + "'/>";
      s += "<line x1='" + x + "' y1='368' x2='" + (x + 96) + "' y2='368' stroke='" + seam + "' stroke-width='4' opacity='.5'/>";
      s += "<line x1='" + x + "' y1='384' x2='" + (x + 96) + "' y2='384' stroke='" + seam + "' stroke-width='4' opacity='.35'/>";
      return s;
    }
    var g = sock(148, false) + sock(356, true);
    g += "<text x='300' y='620' text-anchor='middle' font-family=\"" + DSPFONT + "\" font-size='22' letter-spacing='5' fill='#2A2E2A' opacity='.35'>NUKKAD</text>";
    return g;
  }

  function buildWatch(p, base) {
    var cx = 300, cy = 400, seam = shade(base, -.36);
    var g = "<path d='M" + (cx - 46) + ",312 h92 l-8,-104 h-76 z' fill='" + shade(base, -.2) + "'/>";
    g += "<path d='M" + (cx - 46) + ",488 h92 l-8,116 h-76 z' fill='" + shade(base, -.2) + "'/>";
    for (var i = 0; i < 5; i++) {
      g += "<rect x='" + (cx - 40) + "' y='" + (216 + i * 19) + "' width='80' height='12' rx='4' fill='" + shade(base, -.32) + "' opacity='.6'/>";
      g += "<rect x='" + (cx - 40) + "' y='" + (500 + i * 19) + "' width='80' height='12' rx='4' fill='" + shade(base, -.32) + "' opacity='.6'/>";
    }
    g += "<circle cx='" + cx + "' cy='" + cy + "' r='104' fill='" + shade(base, -.1) + "'/>";
    g += "<circle cx='" + cx + "' cy='" + cy + "' r='90' fill='url(#cloth)'/>";
    g += "<circle cx='" + cx + "' cy='" + cy + "' r='90' fill='url(#fold)'/>";
    for (var t = 0; t < 12; t++) {
      var a = t * Math.PI / 6;
      g += "<rect x='" + (cx - 2.5) + "' y='" + (cy - 82) + "' width='5' height='" + (t % 3 === 0 ? 18 : 11) + "' rx='2.5' fill='" + inkOn(shade(base, .1)) + "' opacity='.7' transform='rotate(" + (t * 30) + " " + cx + " " + cy + ")'/>";
    }
    g += "<line x1='" + cx + "' y1='" + cy + "' x2='" + cx + "' y2='" + (cy - 54) + "' stroke='" + inkOn(shade(base, .1)) + "' stroke-width='6' stroke-linecap='round'/>";
    g += "<line x1='" + cx + "' y1='" + cy + "' x2='" + (cx + 40) + "' y2='" + (cy + 22) + "' stroke='" + inkOn(shade(base, .1)) + "' stroke-width='5' stroke-linecap='round'/>";
    g += "<line x1='" + cx + "' y1='" + (cy + 14) + "' x2='" + (cx - 30) + "' y2='" + (cy - 44) + "' stroke='#FFB703' stroke-width='2.5' stroke-linecap='round'/>";
    g += "<circle cx='" + cx + "' cy='" + cy + "' r='6' fill='#FFB703'/>";
    g += "<rect x='" + (cx + 100) + "' y='" + (cy - 16) + "' width='16' height='32' rx='5' fill='" + shade(base, -.3) + "'/>";
    g += "<text x='" + cx + "' y='" + (cy + 48) + "' text-anchor='middle' font-family=\"" + DSPFONT + "\" font-size='14' letter-spacing='3' fill='" + inkOn(shade(base, .1)) + "' opacity='.65'>NUKKAD</text>";
    return g;
  }

  function buildMisc(p, base) {
    var seam = shade(base, -.34), cx = 300, g = '';
    if (/Sunglass/i.test(p.name)) {
      g += "<path d='M" + (cx - 168) + ",372 h140 q10,74 -58,78 q-70,4 -82,-78 z' fill='url(#cloth)'/>";
      g += "<path d='M" + (cx + 28) + ",372 h140 q-12,82 -82,78 q-68,-4 -58,-78 z' fill='url(#cloth)'/>";
      g += "<path d='M" + (cx - 28) + ",378 q28,-14 56,0' fill='none' stroke='" + shade(base, -.2) + "' stroke-width='11' stroke-linecap='round'/>";
      g += "<path d='M" + (cx - 168) + ",374 q-44,4 -58,52' fill='none' stroke='" + shade(base, -.2) + "' stroke-width='11' stroke-linecap='round'/>";
      g += "<path d='M" + (cx + 168) + ",374 q44,4 58,52' fill='none' stroke='" + shade(base, -.2) + "' stroke-width='11' stroke-linecap='round'/>";
    } else if (/Beanie/i.test(p.name)) {
      g += "<path d='M" + (cx - 122) + ",470 a122,148 0 0 1 244,0 z' fill='url(#cloth)'/>";
      g += "<path d='M" + (cx - 122) + ",470 a122,148 0 0 1 244,0 z' fill='url(#fold)'/>";
      g += "<rect x='" + (cx - 130) + "' y='452' width='260' height='68' rx='12' fill='" + shade(base, -.15) + "'/>";
      for (var i = 0; i < 9; i++) g += "<line x1='" + (cx - 118 + i * 30) + "' y1='456' x2='" + (cx - 118 + i * 30) + "' y2='516' stroke='" + seam + "' stroke-width='3' opacity='.28'/>";
      g += "<text x='" + cx + "' y='498' text-anchor='middle' font-family=\"" + DSPFONT + "\" font-size='24' letter-spacing='4' fill='" + inkOn(base) + "' opacity='.75'>NK</text>";
    } else if (/Scarf/i.test(p.name)) {
      g += "<path d='M" + (cx - 78) + ",230 q78,64 156,0 l30,44 q-108,80 -216,0 z' fill='url(#cloth)'/>";
      g += "<path d='M" + (cx - 92) + ",274 l-26,382 h84 l14,-336 z' fill='url(#clothB)'/>";
      g += "<path d='M" + (cx + 92) + ",274 l26,382 h-84 l-14,-336 z' fill='url(#cloth)'/>";
      for (var f = 0; f < 6; f++) {
        g += "<rect x='" + (cx - 88 + f * 13) + "' y='650' width='6' height='36' fill='" + shade(base, -.2) + "'/>";
        g += "<rect x='" + (cx + 30 + f * 13) + "' y='650' width='6' height='36' fill='" + shade(base, -.2) + "'/>";
      }
    } else if (/Sleeve/i.test(p.name)) {
      g += "<rect x='" + (cx - 176) + "' y='288' width='352' height='250' rx='22' fill='url(#cloth)'/>";
      g += "<rect x='" + (cx - 176) + "' y='288' width='352' height='250' rx='22' fill='url(#fold)'/>";
      g += "<line x1='" + (cx - 176) + "' y1='334' x2='" + (cx + 176) + "' y2='334' stroke='" + seam + "' stroke-width='5'/>";
      for (var z = 0; z < 22; z++) g += "<rect x='" + (cx - 170 + z * 16) + "' y='328' width='7' height='12' rx='2' fill='" + shade(base, .3) + "' opacity='.8'/>";
      g += "<circle cx='" + (cx + 150) + "' cy='334' r='11' fill='" + shade(base, -.3) + "'/>";
      g += "<text x='" + cx + "' y='452' text-anchor='middle' font-family=\"" + DSPFONT + "\" font-size='30' letter-spacing='6' fill='" + inkOn(base) + "' opacity='.55'>NUKKAD</text>";
    } else {
      g += "<path d='M" + (cx - 190) + ",380 h300 v56 h-300 z' fill='url(#cloth)'/>";
      g += "<path d='M" + (cx - 190) + ",380 h300 v56 h-300 z' fill='url(#fold)'/>";
      for (var h = 0; h < 7; h++) g += "<circle cx='" + (cx - 160 + h * 40) + "' cy='408' r='7' fill='" + seam + "' opacity='.55'/>";
      g += "<rect x='" + (cx + 104) + "' y='356' width='90' height='104' rx='10' fill='none' stroke='" + shade(base, -.1) + "' stroke-width='14'/>";
      g += "<rect x='" + (cx + 96) + "' y='400' width='60' height='14' rx='6' fill='" + shade(base, -.16) + "'/>";
    }
    return g;
  }

  /* ---------- flat-lay + fabric detail views --------------------------- */
  function buildFlat(p, base) {
    var seam = shade(base, -.32), cx = 300, cy = 430;
    var g = "<rect x='" + (cx - 168) + "' y='" + (cy - 148) + "' width='336' height='296' rx='10' fill='url(#cloth)'/>";
    g += "<rect x='" + (cx - 168) + "' y='" + (cy - 148) + "' width='336' height='296' rx='10' fill='url(#fold)'/>";
    g += "<path d='M" + (cx - 168) + "," + (cy - 40) + " h336' stroke='" + seam + "' stroke-width='3' opacity='.3' fill='none'/>";
    g += "<path d='M" + (cx - 168) + "," + (cy + 62) + " h336' stroke='" + seam + "' stroke-width='3' opacity='.24' fill='none'/>";
    g += "<path d='M" + (cx - 60) + "," + (cy - 148) + " v296' stroke='" + seam + "' stroke-width='2.5' opacity='.22' fill='none'/>";
    g += "<path d='M" + (cx + 60) + "," + (cy - 148) + " v296' stroke='" + seam + "' stroke-width='2.5' opacity='.22' fill='none'/>";
    g += "<rect x='" + (cx - 168) + "' y='" + (cy - 148) + "' width='336' height='296' rx='10' fill='none' stroke='" + seam + "' stroke-width='2' opacity='.35'/>";
    // folded sleeve flap
    g += "<path d='M" + (cx - 60) + "," + (cy - 148) + " l-108,58 v70 l108,-42 z' fill='" + shade(base, .07) + "' opacity='.9'/>";
    g += "<path d='M" + (cx + 60) + "," + (cy - 148) + " l108,58 v70 l-108,-42 z' fill='" + shade(base, -.1) + "' opacity='.9'/>";
    // care label
    g += "<rect x='" + (cx + 14) + "' y='" + (cy + 92) + "' width='72' height='40' rx='4' fill='#F2EFE6' opacity='.95'/>";
    g += "<text x='" + (cx + 50) + "' y='" + (cy + 110) + "' text-anchor='middle' font-family=\"" + UIFONT + "\" font-size='11' font-weight='700' fill='#2A2E2A' letter-spacing='1'>NUKKAD</text>";
    g += "<text x='" + (cx + 50) + "' y='" + (cy + 124) + "' text-anchor='middle' font-family=\"" + UIFONT + "\" font-size='9' fill='#6B7671'>" + esc(p.sizes[0] || 'M') + " / IND</text>";
    return g;
  }

  function buildDetail(p, base) {
    var seam = shade(base, -.3), hi = shade(base, .12);
    var g = "<rect width='" + W + "' height='" + H + "' fill='" + base + "'/>";
    g += "<rect width='" + W + "' height='" + H + "' filter='url(#weave)' opacity='.5'/>";
    // diagonal twill
    for (var i = -12; i < 34; i++)
      g += "<line x1='" + (i * 32) + "' y1='0' x2='" + (i * 32 + 800) + "' y2='800' stroke='" + hi + "' stroke-width='3' opacity='.10'/>";
    // seam with stitching
    g += "<rect x='0' y='300' width='" + W + "' height='96' fill='" + shade(base, -.09) + "'/>";
    g += "<line x1='0' y1='300' x2='" + W + "' y2='300' stroke='" + seam + "' stroke-width='3'/>";
    g += "<line x1='0' y1='396' x2='" + W + "' y2='396' stroke='" + seam + "' stroke-width='3'/>";
    g += "<line x1='0' y1='324' x2='" + W + "' y2='324' stroke='" + shade(base, .42) + "' stroke-width='4' stroke-dasharray='16 12' opacity='.85'/>";
    g += "<line x1='0' y1='372' x2='" + W + "' y2='372' stroke='" + shade(base, .42) + "' stroke-width='4' stroke-dasharray='16 12' opacity='.85'/>";
    // woven label
    g += "<rect x='150' y='494' width='300' height='128' rx='6' fill='#F2EFE6'/>";
    g += "<rect x='150' y='494' width='300' height='128' rx='6' fill='none' stroke='#D6D2C4' stroke-width='2'/>";
    g += "<rect x='170' y='514' width='260' height='4' fill='#0C3B2E'/>";
    g += "<text x='300' y='560' text-anchor='middle' font-family=\"" + DSPFONT + "\" font-size='34' letter-spacing='5' fill='#0C3B2E'>NUKKAD</text>";
    g += "<text x='300' y='584' text-anchor='middle' font-family=\"" + UIFONT + "\" font-size='12' letter-spacing='2.5' fill='#6B7671'>" + esc((p.fabric || '').toUpperCase()) + "</text>";
    g += "<text x='300' y='604' text-anchor='middle' font-family=\"" + UIFONT + "\" font-size='11' letter-spacing='2' fill='#9AA39E'>MADE IN INDIA</text>";
    g += "<rect x='0' y='0' width='" + W + "' height='" + H + "' fill='url(#vig)'/>";
    return g;
  }

  /* ---------- assembler ------------------------------------------------- */
  var BUILDERS = {
    tee: buildTop, oversized: buildTop, shirt: buildTop, hoodie: buildTop,
    sweatshirt: buildTop, jacket: buildTop, top: buildTop,
    jeans: buildPants, trousers: buildPants, joggers: buildPants, shorts: buildPants,
    dress: buildDress, coord: buildCoord,
    cap: buildCap, bag: buildBag, wallet: buildWallet, socks: buildSocks,
    watch: buildWatch, misc: buildMisc
  };

  function render(p, colorHex, view) {
    var base = colorHex || (p.colors && p.colors[0] ? p.colors[0].hex : '#3A3D42');
    var extra = '';
    if (view === 'detail') {
      extra = "<filter id='weave' x='0' y='0' width='100%' height='100%'>" +
        "<feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' seed='7' result='n'/>" +
        "<feColorMatrix type='saturate' values='0'/>" +
        "<feComponentTransfer><feFuncA type='linear' slope='.34'/></feComponentTransfer></filter>" +
        "<radialGradient id='vig' cx='.5' cy='.45' r='.78'>" +
        "<stop offset='.55' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.28'/></radialGradient>";
    }
    var inner;
    if (view === 'detail') inner = buildDetail(p, base);
    else if (view === 'flat') inner = backdrop() + buildFlat(p, base);
    else inner = backdrop() + (BUILDERS[p.kind] || buildTop)(p, base, view);

    var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + W + " " + H + "' width='" + W + "' height='" + H + "' role='img'>" +
      defs(base, extra) + inner + "</svg>";
    return uri(svg);
  }

  /* ---------- photo layer ------------------------------------------------
     Real apparel photography, pulled per-product from a keyword-addressable
     free-licence CDN. Nothing is bundled and no API key is needed: the tag
     list and the deterministic `lock` seed fully describe the image, so the
     same product always resolves to the same photo.

     The generated SVG below stays as the guaranteed fallback. Every photo
     <img> carries data-fallback, and ui.js swaps to it on error — so with no
     network, a blocked CDN or a 404, the catalogue still renders complete
     rather than showing broken-image icons.                                */
  var PHOTO = {
    on: true,
    host: 'https://loremflickr.com',
    /* subject keywords per garment kind — narrow enough to stay on-topic,
       broad enough that the CDN always has a match */
    tags: {
      tee:        'tshirt,apparel,clothing',
      oversized:  'tshirt,streetwear,apparel',
      shirt:      'shirt,menswear,clothing',
      hoodie:     'hoodie,streetwear,apparel',
      sweatshirt: 'sweatshirt,hoodie,apparel',
      jeans:      'jeans,denim,clothing',
      trousers:   'trousers,pants,clothing',
      joggers:    'joggers,sweatpants,apparel',
      shorts:     'shorts,summer,clothing',
      jacket:     'jacket,outerwear,fashion',
      top:        'blouse,top,womenswear',
      dress:      'dress,womenswear,fashion',
      coord:      'outfit,womenswear,fashion',
      bag:        'backpack,bag,accessory',
      cap:        'cap,hat,accessory',
      wallet:     'wallet,leather,accessory',
      socks:      'socks,accessory',
      watch:      'watch,wristwatch,accessory',
      misc:       'accessory,fashion'
    },
    /* each gallery view gets a different framing keyword and its own lock, so
       the four PDP images are four distinct photos of the same garment type */
    views: { front: 'model', back: 'back', flat: 'flatlay', detail: 'fabric,texture' },
    /* stable positive integer from any string — same product, same photo */
    lock: function (s) {
      var h = 2166136261, i;
      for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
      return (h % 100000) + 1;
    },
    url: function (tags, wid, hei, seedStr) {
      return this.host + '/' + Math.round(wid) + '/' + Math.round(hei) + '/' +
        encodeURIComponent(tags) + '/all?lock=' + this.lock(seedStr);
    },
    forProduct: function (p, view, wid, hei) {
      var t = this.tags[p.kind] || 'clothing,fashion';
      var v = this.views[view || 'front'];
      return this.url(t + (v ? ',' + v : ''), wid || W, hei || H, p.id + '|' + (view || 'front'));
    },
    forBanner: function (o) {
      return this.url(o.tags || 'fashion,streetwear,editorial',
        o.w || 1600, o.h || 760, 'bn' + (o.seed || 1) + (o.tags || ''));
    }
  };

  /* ---------- public API ------------------------------------------------ */
  var VIEWS = ['front', 'back', 'flat', 'detail'];

  function img(p, colorHex, view) {
    var key = p.id + '|' + (colorHex || '') + '|' + (view || 'front');
    if (!cache[key]) cache[key] = render(p, colorHex, view || 'front');
    return cache[key];
  }
  /* photo first, drawn garment as the fallback the <img> falls back to */
  function photo(p, view, wid, hei) {
    return PHOTO.on ? PHOTO.forProduct(p, view, wid, hei) : '';
  }
  function gallery(p, colorHex) {
    return VIEWS.map(function (v) {
      return { view: v, src: photo(p, v) || img(p, colorHex, v),
        fallback: img(p, colorHex, v), label: LABELS[v] };
    });
  }
  var LABELS = { front: 'Front view', back: 'Back view', flat: 'Folded flat-lay', detail: 'Fabric and label detail' };

  /* ---------- editorial / banner art ------------------------------------ */
  /* the drawn signboard stays exactly as it was and becomes the fallback
     that sits beneath the editorial photograph */
  function bannerArt(opts) {
    var o = opts || {};
    var a = o.a || '#0C3B2E', b = o.b || '#101512', accent = o.accent || '#FFB703';
    var bw = o.w || 1200, bh = o.h || 700, seed = o.seed || 3;
    var g = "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='" + a + "'/><stop offset='1' stop-color='" + b + "'/></linearGradient>" +
      "<linearGradient id='sh' x1='0' y1='1' x2='0' y2='0'>" +
      "<stop offset='0' stop-color='#000' stop-opacity='.34'/><stop offset='1' stop-color='#000' stop-opacity='0'/></linearGradient></defs>";
    g += "<rect width='" + bw + "' height='" + bh + "' fill='url(#g)'/>";
    var rnd = (window.NK_DATA && window.NK_DATA.seeded) ? window.NK_DATA.seeded('bn' + seed) : function () { return .5; };
    // shutter slats — the corner-shop signboard motif
    for (var i = 0; i < 26; i++) {
      var y = (i / 26) * bh;
      g += "<rect x='0' y='" + y + "' width='" + bw + "' height='" + (bh / 52) + "' fill='#fff' opacity='" + (0.02 + rnd() * .035).toFixed(3) + "'/>";
    }
    // painted arcs
    for (var k = 0; k < 3; k++) {
      var cxx = bw * (0.18 + rnd() * .7), cyy = bh * (0.15 + rnd() * .7), r = 90 + rnd() * 190;
      g += "<circle cx='" + cxx.toFixed(0) + "' cy='" + cyy.toFixed(0) + "' r='" + r.toFixed(0) + "' fill='none' stroke='" + (k === 1 ? accent : '#ffffff') + "' stroke-width='" + (14 + rnd() * 26).toFixed(0) + "' opacity='" + (k === 1 ? .16 : .06) + "'/>";
    }
    g += "<rect y='" + (bh * .55) + "' width='" + bw + "' height='" + (bh * .45) + "' fill='url(#sh)'/>";
    if (o.text) {
      g += "<text x='" + (bw / 2) + "' y='" + (bh / 2) + "' text-anchor='middle' font-family=\"" + DSPFONT + "\" font-size='" + (bh * .3) + "' fill='#ffffff' opacity='.07' letter-spacing='6'>" + esc(o.text) + "</text>";
    }
    return uri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + bw + " " + bh + "' width='" + bw + "' height='" + bh + "' preserveAspectRatio='xMidYMid slice'>" + g + "</svg>");
  }

  /* Banner call sites pass palette + seed and expect a single src back, so the
     photo swap happens here rather than at 40-odd call sites. `tags` steers the
     subject; omit it and the seed still picks a stable editorial frame. */
  function banner(opts) {
    var o = opts || {};
    if (!PHOTO.on || o.art) return bannerArt(o);
    return PHOTO.forBanner(o);
  }
  /* what a photo banner falls back to when the CDN is unreachable */
  function bannerFallback(opts) { return bannerArt(opts || {}); }

  /* ---------- category tile art ----------------------------------------- */
  /* tile() keeps its original contract — a drawn garment on a coloured ground —
     because it is what every tile falls back to. tilePhoto() is the photograph
     that sits on top of it, keyed to the same garment kind. */
  function tile(kind, hex, label) {
    var p = { kind: kind, name: label || '', print: 'none', slogan: 'NK', colors: [{ hex: hex }], sizes: ['M'], fabric: '' };
    return render(p, hex, 'front');
  }
  function tilePhoto(kind, wid, hei, seedStr) {
    if (!PHOTO.on) return '';
    var t = PHOTO.tags[kind] || 'clothing,fashion';
    return PHOTO.url(t + ',model', wid || 400, hei || 400, 'tl|' + kind + '|' + (seedStr || ''));
  }

  /* ---------- QR-ish block (app promo) ---------------------------------- */  function qr(seedStr) {
    var rnd = (window.NK_DATA && window.NK_DATA.seeded) ? window.NK_DATA.seeded(seedStr || 'nukkad-app') : function () { return .5; };
    var n = 25, cell = 8, s = n * cell, g = "<rect width='" + s + "' height='" + s + "' fill='#fff'/>";
    function eye(x, y) {
      return "<rect x='" + (x * cell) + "' y='" + (y * cell) + "' width='" + (7 * cell) + "' height='" + (7 * cell) + "' fill='#0C3B2E'/>" +
        "<rect x='" + ((x + 1) * cell) + "' y='" + ((y + 1) * cell) + "' width='" + (5 * cell) + "' height='" + (5 * cell) + "' fill='#fff'/>" +
        "<rect x='" + ((x + 2) * cell) + "' y='" + ((y + 2) * cell) + "' width='" + (3 * cell) + "' height='" + (3 * cell) + "' fill='#0C3B2E'/>";
    }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var inEye = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (inEye) continue;
      if (rnd() > .52) g += "<rect x='" + (x * cell) + "' y='" + (y * cell) + "' width='" + cell + "' height='" + cell + "' fill='#101512'/>";
    }
    g += eye(0, 0) + eye(n - 7, 0) + eye(0, n - 7);
    return uri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + s + " " + s + "' width='" + s + "' height='" + s + "'>" + g + "</svg>");
  }

  w.NK_IMG = { img: img, photo: photo, gallery: gallery, banner: banner, bannerArt: bannerArt,
    bannerFallback: bannerFallback, tile: tile, tilePhoto: tilePhoto, qr: qr, VIEWS: VIEWS, LABELS: LABELS,
    shade: shade, inkOn: inkOn, PHOTO: PHOTO };
})(window);
