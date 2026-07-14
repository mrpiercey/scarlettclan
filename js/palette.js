// ============================================================
// palette.js — VGA-flavored palette + pixel painting toolkit.
// All art is painted at 320x200 into offscreen canvases, then
// blitted scaled so it keeps chunky KQ6-style pixels.
// ============================================================

var VW = 320, VH = 200;   // virtual resolution

// --- deterministic PRNG so painted scenes are stable frame to frame ---
var _rs = 1;
function rseed(s){ _rs = s || 1; }
function rnd(){ _rs = (_rs * 16807) % 2147483647; return _rs / 2147483647; }
function rndi(a, b){ return a + Math.floor(rnd() * (b - a + 1)); }

// --- named palette (KQ6-ish: warm earth, lush greens, dithery skies) ---
var PAL = {
  black:'#0a0a0f', white:'#f4f0e2', cream:'#e8dfc0',
  skyTop:'#2b3f8f', skyHi:'#4a6ecb', skyMid:'#7aa3e3', skyLow:'#aecdec', skyHaze:'#d8e6ee',
  nightTop:'#070a1e', nightMid:'#101838', nightLow:'#232f5e', nightHaze:'#3a4a80',
  duskTop:'#3a2a5e', duskMid:'#7a4a76', duskLow:'#c97a5a', duskHaze:'#eeb46a',
  grass1:'#2e6b22', grass2:'#4a8c2e', grass3:'#6cab3a', grass4:'#8ec84e', grass5:'#b4dd6a',
  moor1:'#5a7a2e', moor2:'#7a9a3e', moor3:'#9ab952', moor4:'#c2d47a',
  dark1:'#12200f', dark2:'#1c3316', dark3:'#28481e',
  leaf1:'#1e4a18', leaf2:'#2f6b22', leaf3:'#478a2c', leaf4:'#63a838', leaf5:'#86c44e',
  pine1:'#14341c', pine2:'#1f4c28', pine3:'#2c6436',
  trunk1:'#3a2a1a', trunk2:'#5a422a', trunk3:'#7a5c3a', trunk4:'#9a7a4e',
  dirt1:'#5a4630', dirt2:'#7a6242', dirt3:'#9a8258', dirt4:'#bca272', dirt5:'#d8c294',
  sand1:'#b49a62', sand2:'#cdb47c', sand3:'#e2cf9a', sand4:'#f0e2b4',
  rock1:'#3e3e46', rock2:'#5c5c66', rock3:'#7e7e8a', rock4:'#a2a2ae', rock5:'#c6c6d0',
  water1:'#173a6e', water2:'#1f549e', water3:'#2f74c2', water4:'#4f9ade', water5:'#8ac4ee',
  marsh1:'#2a3a24', marsh2:'#3c5232', marsh3:'#546c40', marsh4:'#70855a',
  shadow1:'#241a2e', shadow2:'#382a44', shadow3:'#4e3c5c', shadow4:'#665278',
  gold:'#e8b83a', gold2:'#f6da7a', red:'#b43a2e', red2:'#dd6a4a',
  purple:'#6a3a8a', blue:'#3a5adb', pink:'#e88aa8',
  fire1:'#c23a1e', fire2:'#e8762a', fire3:'#f6b83e', fire4:'#fce88a',
  glow:'#aef29a'
};

// --- primitive painters (g = 2d context in 320x200 space) ---
function frect(g, x, y, w, h, c){ g.fillStyle = c; g.fillRect(x|0, y|0, Math.ceil(w), Math.ceil(h)); }

function px(g, x, y, c){ g.fillStyle = c; g.fillRect(x|0, y|0, 1, 1); }

// checkerboard+noise dither of c2 over the region (d = 0..1 density)
function dither(g, x, y, w, h, c2, d){
  g.fillStyle = c2;
  x |= 0; y |= 0;
  for (var j = y; j < y + h; j++){
    for (var i = x; i < x + w; i++){
      var checker = ((i + j) & 1) === 0;
      if ((checker && rnd() < d * 1.6) || (!checker && rnd() < d * 0.4)) g.fillRect(i, j, 1, 1);
    }
  }
}

// vertical banded gradient with dithered seams — the KQ6 sky trick
function bands(g, x, y, w, h, colors){
  var n = colors.length, bh = h / n;
  for (var i = 0; i < n; i++){
    frect(g, x, y + i * bh, w, bh + 1, colors[i]);
    if (i > 0) dither(g, x, y + i * bh, w, Math.min(4, bh), colors[i - 1], 0.45);
  }
}

function ell(g, cx, cy, rx, ry, c){
  g.fillStyle = c;
  g.beginPath();
  g.ellipse(cx, cy, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2);
  g.fill();
}

function poly(g, pts, c){
  g.fillStyle = c;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fill();
}

// irregular foliage blob: cluster of jittered ellipses
function blob(g, cx, cy, rx, ry, c, n){
  n = n || 7;
  for (var i = 0; i < n; i++){
    ell(g, cx + (rnd() - 0.5) * rx * 1.2, cy + (rnd() - 0.5) * ry * 1.1,
        rx * (0.35 + rnd() * 0.4), ry * (0.35 + rnd() * 0.4), c);
  }
}

// deciduous tree with 3-tone canopy + highlight speckle
function tree(g, x, y, h, dark, mid, lite, trunkC){
  var tw = Math.max(2, h * 0.09);
  frect(g, x - tw / 2, y - h * 0.42, tw, h * 0.45, trunkC || PAL.trunk2);
  frect(g, x - tw / 2, y - h * 0.42, 1, h * 0.45, PAL.trunk1);
  var cy = y - h * 0.62, crx = h * 0.34, cry = h * 0.30;
  blob(g, x, cy + 3, crx, cry, dark, 8);
  blob(g, x - crx * 0.15, cy, crx * 0.8, cry * 0.8, mid, 7);
  blob(g, x - crx * 0.3, cy - cry * 0.25, crx * 0.5, cry * 0.5, lite, 6);
  g.fillStyle = lite;
  for (var i = 0; i < h; i++) px(g, x + (rnd() - 0.5) * crx * 1.6, cy + (rnd() - 0.5) * cry * 1.5, lite);
}

function pine(g, x, y, h, c1, c2){
  var layers = 4;
  frect(g, x - 1, y - h * 0.25, 2, h * 0.25, PAL.trunk1);
  for (var i = 0; i < layers; i++){
    var ly = y - h * 0.2 - (h * 0.75 / layers) * i;
    var lw = (h * 0.38) * (1 - i / layers) + 2;
    poly(g, [[x - lw, ly], [x + lw, ly], [x, ly - h * 0.34]], i % 2 ? c2 : c1);
  }
}

function rock(g, x, y, w, h, c1, c2, c3){
  poly(g, [[x - w/2, y], [x - w*0.42, y - h*0.7], [x - w*0.1, y - h], [x + w*0.3, y - h*0.8], [x + w/2, y - h*0.2], [x + w/2, y]], c1);
  poly(g, [[x - w*0.42, y - h*0.7], [x - w*0.1, y - h], [x + w*0.15, y - h*0.55], [x - w*0.2, y - h*0.35]], c2);
  if (c3) poly(g, [[x - w*0.1, y - h], [x + w*0.3, y - h*0.8], [x + w*0.1, y - h*0.72]], c3);
}

// dirt path from bottom toward vanishing point, dithered edges
function path(g, x1, y1, x2, y2, w1, w2, c1, c2){
  poly(g, [[x1 - w1/2, y1], [x1 + w1/2, y1], [x2 + w2/2, y2], [x2 - w2/2, y2]], c1);
  var steps = 30;
  for (var i = 0; i < steps; i++){
    var t = i / steps;
    var xx = x1 + (x2 - x1) * t, yy = y1 + (y2 - y1) * t, ww = w1 + (w2 - w1) * t;
    dither(g, xx - ww/2 - 2, yy, ww + 4, Math.abs(y2 - y1) / steps + 1, c2, 0.28);
  }
}

function tuft(g, x, y, c){
  px(g, x, y, c); px(g, x - 1, y - 1, c); px(g, x + 1, y - 1, c); px(g, x, y - 2, c);
}

function flower(g, x, y, cPetal, cCore){
  px(g, x - 1, y, cPetal); px(g, x + 1, y, cPetal); px(g, x, y - 1, cPetal); px(g, x, y + 1, cPetal);
  px(g, x, y, cCore || PAL.gold);
}

function cloud(g, x, y, w, c){
  blob(g, x, y, w, w * 0.3, c, 6);
}

function star(g, x, y, c){
  px(g, x, y, c);
  if (rnd() > 0.6){ px(g, x - 1, y, c); px(g, x + 1, y, c); px(g, x, y - 1, c); px(g, x, y + 1, c); }
}

// simple stone-block twoleg building
function house(g, x, y, w, h, wallC, roofC, darkC){
  frect(g, x, y - h, w, h, wallC);
  poly(g, [[x - 3, y - h], [x + w + 3, y - h], [x + w / 2, y - h - w * 0.32]], roofC);
  frect(g, x, y - h, 1, h, darkC);
  for (var i = 0; i < w * h / 28; i++) px(g, x + rnd() * w, y - rnd() * h, darkC);
}

function offscreen(){
  var c = document.createElement('canvas');
  c.width = VW; c.height = VH;
  var g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { canvas: c, g: g };
}
