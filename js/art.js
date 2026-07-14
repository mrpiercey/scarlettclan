// ============================================================
// art.js — every background painted procedurally at 320x200,
// KQ6 style: dithered band skies, painted hills, chunky detail.
// ART.get('name') returns a cached offscreen canvas.
// ============================================================

var ART = {
  cache: {},
  get: function(name){
    if (!this.cache[name]){
      var o = offscreen();
      rseed(name.length * 977 + 13);
      this.painters[name](o.g);
      this.cache[name] = o.canvas;
    }
    return this.cache[name];
  },
  painters: {}
};

// ---- shared bits ----------------------------------------------------------
function daySky(g, hor){
  bands(g, 0, 0, VW, hor, [PAL.skyTop, PAL.skyHi, PAL.skyMid, PAL.skyLow, PAL.skyHaze]);
  cloud(g, 60, 22, 26, '#eef4f8'); cloud(g, 210, 34, 34, '#e4eef6'); cloud(g, 290, 16, 20, '#eef4f8');
}
function nightSky(g, hor){
  bands(g, 0, 0, VW, hor, [PAL.nightTop, PAL.nightTop, PAL.nightMid, PAL.nightLow, PAL.nightHaze]);
  for (var i = 0; i < 70; i++) star(g, rndi(0, VW), rndi(0, hor - 12), i % 5 ? '#cdd8f0' : '#fff');
  ell(g, 262, 30, 13, 13, '#e8ecd8'); ell(g, 257, 27, 10, 10, PAL.nightTop); // crescent moon
}
function grassGround(g, hor, t1, t2, t3){
  bands(g, 0, hor, VW, VH - hor, [t3, t2, t1, t1]);
  dither(g, 0, hor, VW, 8, PAL.skyHaze, 0.15);
  for (var i = 0; i < 130; i++){
    var y = hor + 6 + rnd() * (VH - hor - 8);
    tuft(g, rndi(0, VW), y, y > 160 ? t3 : t2);
  }
}
function treeline(g, y, h, c1, c2){
  for (var x = -10; x < VW + 10; x += rndi(10, 22)) blob(g, x, y - rnd() * h * 0.5, rndi(12, 26), h * 0.5, c1, 5);
  for (var x2 = -10; x2 < VW + 10; x2 += rndi(14, 30)) blob(g, x2, y - rnd() * h * 0.3, rndi(8, 18), h * 0.35, c2, 4);
}

// small standing pixel person for the ending yard (y = feet baseline)
// opt: {h, skin, hair, hairLong, legC, top:'plaid'|'jersey'|'dress'|'tee', topC, topC2, cap, capB}
function homePerson(g, x, y, opt){
  var h = opt.h;                       // total height
  var headH = Math.round(h * 0.26), torsoH = Math.round(h * 0.36), legH = h - headH - torsoH;
  var w = Math.round(h * 0.3);
  var tx = x - w / 2, ty = y - legH - torsoH;   // torso top-left
  if (opt.top === 'dress'){
    poly(g, [[x - w * 0.45, y - 2], [x + w * 0.45, y - 2], [x + w * 0.32, ty], [x - w * 0.32, ty]], opt.topC);
    frect(g, x - 2, y - 3, 2, 3, opt.skin); frect(g, x + 1, y - 3, 2, 3, opt.skin);   // ankles
  } else {
    frect(g, x - w * 0.4, y - legH, w * 0.36, legH, opt.legC || '#3a5a9e');           // legs
    frect(g, x + w * 0.06, y - legH, w * 0.36, legH, opt.legC || '#3a5a9e');
    frect(g, tx, ty, w, torsoH, opt.topC);                                            // torso
    if (opt.top === 'plaid'){
      g.fillStyle = opt.topC2;
      for (var px2 = 0; px2 < w; px2 += 3) g.fillRect(tx + px2, ty, 1, torsoH);
      for (var py2 = 0; py2 < torsoH; py2 += 3) g.fillRect(tx, ty + py2, w, 1);
    }
    if (opt.top === 'jersey'){
      frect(g, tx, ty, w, 2, opt.topC2);                                              // shoulder stripe
      frect(g, x - 2, ty + Math.round(torsoH * 0.3), 1, 4, '#f0f0f4');                // "1"
      frect(g, x + 1, ty + Math.round(torsoH * 0.3), 3, 4, '#f0f0f4');                // "0"
      px(g, x + 2, ty + Math.round(torsoH * 0.3) + 1, opt.topC);
      px(g, x + 2, ty + Math.round(torsoH * 0.3) + 2, opt.topC);
    }
  }
  frect(g, tx - 2, ty + 1, 2, Math.round(torsoH * 0.7), opt.topC);                    // arms
  frect(g, tx + w, ty + 1, 2, Math.round(torsoH * 0.7), opt.topC);
  var hy = ty - headH;
  frect(g, x - headH * 0.42, hy, headH * 0.84, headH, opt.skin);                      // head
  if (opt.hairLong){
    frect(g, x - headH * 0.55, hy, headH * 0.25, headH + 4, opt.hair);
    frect(g, x + headH * 0.3, hy, headH * 0.25, headH + 4, opt.hair);
  }
  frect(g, x - headH * 0.5, hy - 1, headH, headH * 0.4, opt.hair);                    // top hair
  if (opt.cap){
    frect(g, x - headH * 0.5, hy - 2, headH, headH * 0.42, opt.cap);
    frect(g, x - headH * 0.7, hy + headH * 0.28, headH * 0.5, 1.5, opt.cap);          // brim
    px(g, x, hy, opt.capB || '#c8102e');
  }
  px(g, x - 2, hy + headH * 0.5, '#2a2a30'); px(g, x + 1, hy + headH * 0.5, '#2a2a30'); // eyes
  if (opt.freckles){ px(g, x - 2, hy + headH * 0.68, '#c08a5a'); px(g, x + 2, hy + headH * 0.68, '#c08a5a'); }
}

// ---- TITLE (KQ6-style: carved stone, thorn border, crest medallion) --------
// metallic beveled text on a shallow upward arch
function archText(g, text, cx, baseY, font, amp){
  g.font = font; g.textBaseline = 'alphabetic';
  var cw = g.measureText('M').width;
  var total = cw * text.length;
  for (var i = 0; i < text.length; i++){
    var ch = text[i];
    var t = (i + 0.5) / text.length - 0.5;              // -0.5 .. 0.5
    var x = cx - total / 2 + i * cw;
    var y = baseY - amp * (1 - 4 * t * t);              // bows upward in the middle
    g.fillStyle = '#1e0e06'; g.fillText(ch, x + 2, y + 2);   // drop shadow
    g.fillStyle = '#6a2e10'; g.fillText(ch, x + 1, y + 1);   // dark bevel
    g.fillStyle = '#c87a2e'; g.fillText(ch, x, y);           // copper body
    g.fillStyle = '#f6d08a'; g.fillText(ch, x - 0.5, y - 1); // gold highlight
  }
}

ART.painters.title = function(g){
  // mottled blue-gray stone wall
  bands(g, 0, 0, VW, VH, ['#5a6480', '#6a7490', '#5f6a86', '#525c78', '#5a6480']);
  dither(g, 0, 0, VW, VH, '#49536e', 0.30);
  dither(g, 0, 0, VW, VH, '#7a86a4', 0.12);
  // cracks in the stone
  g.strokeStyle = '#3e4660'; g.lineWidth = 1;
  for (var cr = 0; cr < 7; cr++){
    var cx0 = rndi(20, 300), cy0 = rndi(10, 190);
    g.beginPath(); g.moveTo(cx0, cy0);
    for (var seg = 0; seg < 4; seg++){ cx0 += rndi(-10, 10); cy0 += rndi(4, 12); g.lineTo(cx0, cy0); }
    g.stroke();
  }
  // ---- carved crest medallion ----
  ell(g, 160, 108, 46, 44, '#454f6a');                       // recess shadow
  ell(g, 160, 106, 43, 41, '#8a94ae');                       // raised rim
  ell(g, 160, 107, 38, 36, '#6c7692');                       // face
  dither(g, 124, 74, 72, 66, '#5a6480', 0.25);
  // carved great "S" monogram
  g.font = 'bold 44px monospace'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#3c4660'; g.fillText('S', 148, 126);        // carved shadow
  g.fillStyle = '#a4b0c8'; g.fillText('S', 146, 124);        // lit edge
  g.fillStyle = '#59647f'; g.fillText('S', 147, 125);        // stone face
  // a golden collar hung over the top of the medallion
  g.strokeStyle = '#8a6614'; g.lineWidth = 3;
  g.beginPath(); g.arc(160, 78, 9, Math.PI * 0.95, Math.PI * 2.05); g.stroke();
  g.strokeStyle = PAL.gold2; g.lineWidth = 1.5;
  g.beginPath(); g.arc(160, 77.5, 9, Math.PI * 1.0, Math.PI * 2.0); g.stroke();
  poly(g, [[157, 85], [163, 85], [160, 91]], PAL.gold);      // tag
  px(g, 160, 87, PAL.red);
  // two stone cats carved into the wall, flanking the medallion
  rseed(7);
  drawCat(g, 96, 148, {fur:'#78829e', belly:'#8b95b0', eye:'#4a5470'}, 2, 1.25, false);
  rseed(7);
  drawCat(g, 224, 148, {fur:'#78829e', belly:'#8b95b0', eye:'#4a5470'}, 2, 1.25, true);
  // ---- thorny branches with blossoms creeping over every edge ----
  // each border gets thick gnarled vines that hug it, with thorns, leaf
  // clusters and blossoms placed ON the vine, KQ6-style
  function vine(x0, y0, dx, dy, wob){
    var pts = [[x0, y0]];
    var vx = x0, vy = y0;
    for (var sg = 0; sg < 14; sg++){
      vx += dx + rndi(-3, 3); vy += dy + rndi(-3, 3);
      vy += dx ? rndi(-wob, wob) : 0; vx += dy ? rndi(-wob, wob) : 0;
      pts.push([vx, vy]);
    }
    // dark under-stroke then lighter bark stroke
    for (var pass = 0; pass < 2; pass++){
      g.strokeStyle = pass ? '#4a3018' : '#241408';
      g.lineWidth = pass ? 2 : 3.5;
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (var p = 1; p < pts.length; p++) g.lineTo(pts[p][0], pts[p][1]);
      g.stroke();
    }
    for (var p2 = 1; p2 < pts.length - 1; p2++){
      var px0 = pts[p2][0], py0 = pts[p2][1];
      if (p2 % 2 === 0){                                     // thorn
        var tdx = dy === 0 ? 0 : rndi(-3, 3), tdy = dx === 0 ? 0 : rndi(-3, 3);
        poly(g, [[px0 - 1.5, py0], [px0 + tdx + (dy ? (px0 < 160 ? 4 : -4) : 0), py0 + tdy + (dx ? (py0 < 100 ? 4 : -4) : 0)], [px0 + 1.5, py0]], '#241408');
      }
      if (p2 % 3 === 0){                                     // leaf cluster
        ell(g, px0 + rndi(-2, 2), py0 + rndi(-2, 2), 3, 2, '#3a5a2c');
        ell(g, px0 + rndi(-3, 3), py0 + rndi(-2, 2), 2.2, 1.5, '#4c7038');
      }
      if (p2 % 4 === 1){                                     // blossom on the vine
        flower(g, px0 + rndi(-2, 2), py0 + rndi(-2, 2), p2 % 8 === 1 ? '#e8b8c8' : '#f0ece2', PAL.gold2);
        px(g, px0 + rndi(-3, 3), py0 + rndi(-3, 3), '#fff');
      }
    }
  }
  vine(-6, 4, 24, 0, 5);    vine(-10, 12, 24, 0, 4);         // top
  vine(-6, 194, 24, 0, 4);  vine(-10, 187, 24, 0, 5);        // bottom
  vine(5, -6, 0, 16, 4);    vine(12, -10, 0, 16, 5);         // left
  vine(315, -6, 0, 16, 4);  vine(308, -10, 0, 16, 5);        // right
  // ---- the arched metallic title ----
  archText(g, "SCARLETT'S", 160, 30, 'bold 13px monospace', 5);
  archText(g, 'WARRIOR CATS QUEST', 160, 54, 'bold 16px monospace', 8);
  // ---- wooden banner: THE 15 COLLARS ----
  poly(g, [[80, 160], [74, 169], [80, 178]], '#4a2c16');     // notched ends
  poly(g, [[240, 160], [246, 169], [240, 178]], '#4a2c16');
  frect(g, 80, 158, 160, 22, '#2c1a0c');
  frect(g, 82, 160, 156, 18, '#6a3e1e');
  frect(g, 82, 160, 156, 2, '#8a562e');
  frect(g, 82, 176, 156, 2, '#3e2410');
  px(g, 86, 168, '#c8a24a'); px(g, 233, 168, '#c8a24a');     // nails
  g.font = 'bold 10px monospace'; g.textBaseline = 'top';
  g.fillStyle = '#2a1408'; g.fillText('THE FIFTEEN COLLARS', 104, 164);
  g.fillStyle = PAL.gold2;  g.fillText('THE FIFTEEN COLLARS', 103, 163);
};

// ---- RICHMOND ROAD (intro: the bus seen from outside, rolling home) ---------
ART.painters.busride = function(g){
  // warm afternoon sky
  bands(g, 0, 0, VW, 50, [PAL.skyTop, PAL.skyHi, PAL.skyMid, PAL.skyLow]);
  cloud(g, 60, 12, 24, '#eef4f8'); cloud(g, 200, 20, 30, '#e4eef6'); cloud(g, 290, 10, 18, '#eef4f8');
  // base fill behind everything (no transparent pixels, ever)
  bands(g, 0, 48, VW, 152, ['#b8c0ba', '#a8b0a8', '#5a564e', '#4c4842', '#443f39']);
  treeline(g, 54, 14, PAL.leaf2, PAL.leaf3);
  // --- the Richmond Road strip mall row ---
  // Chick-fil-A: white walls, red roofline & sign
  frect(g, 6, 56, 76, 42, '#f2eee6');
  frect(g, 6, 56, 76, 5, '#d8d4cc');
  frect(g, 2, 52, 84, 8, '#e4001b');                          // red fascia
  frect(g, 10, 66, 68, 10, '#e4001b');                        // sign band
  g.fillStyle = '#fff'; g.font = 'bold 7px monospace'; g.textBaseline = 'top';
  g.fillText('Chick-fil-A', 13, 67);
  frect(g, 14, 80, 14, 18, '#8ab4d8'); frect(g, 34, 80, 14, 18, '#8ab4d8');   // windows
  frect(g, 56, 80, 16, 18, '#5a4a3a');                        // door
  // McDonald's: gray box, mansard, golden arches on a pole
  frect(g, 100, 60, 62, 38, '#d8d4cc');
  frect(g, 96, 54, 70, 8, '#8a2a1e');                         // mansard roof
  frect(g, 106, 70, 20, 16, '#8ab4d8'); frect(g, 134, 70, 20, 16, '#8ab4d8');
  frect(g, 126, 86, 12, 12, '#5a5a5a');
  frect(g, 90, 56, 3, 34, '#9a9a9a');                         // sign pole
  g.fillStyle = '#f6c500'; g.font = 'bold 14px monospace';
  g.fillText('M', 86, 40);
  g.fillStyle = '#e4001b'; g.font = 'bold 5px monospace';
  g.fillText("McDonald's", 104, 62);
  // Home Depot: big orange box
  frect(g, 178, 52, 118, 46, '#e8701e');
  frect(g, 178, 52, 118, 4, '#c85a12');
  g.fillStyle = '#fff'; g.font = 'bold 8px monospace';
  g.fillText('THE HOME', 210, 58); g.fillText('DEPOT', 222, 68);
  frect(g, 186, 78, 30, 20, '#3a3a44');                       // entrance
  frect(g, 188, 80, 12, 18, '#7a8a9a'); frect(g, 202, 80, 12, 18, '#7a8a9a');
  frect(g, 240, 80, 44, 12, '#c85a12');                       // garden center fence
  for (var hd = 242; hd < 282; hd += 6) frect(g, hd, 82, 2, 10, '#e8701e');
  // shrubs between the lots
  blob(g, 92, 100, 10, 5, PAL.leaf2, 5); blob(g, 172, 100, 9, 5, PAL.leaf3, 5); blob(g, 302, 100, 12, 6, PAL.leaf2, 5);
  // sidewalk + grass verge
  bands(g, 0, 98, VW, 8, ['#c0bcb0', '#b0aca0']);
  bands(g, 0, 106, VW, 6, [PAL.grass3, PAL.grass2]);
  // RICHMOND RD street sign
  frect(g, 292, 74, 2, 32, '#8a8a92');
  frect(g, 276, 68, 40, 9, '#1e6a34');
  frect(g, 276, 68, 40, 1, '#4a9a5e');
  g.fillStyle = '#fff'; g.font = 'bold 5px monospace';
  g.fillText('RICHMOND RD', 278, 70);
  // the road itself (center dashes are drawn live in drawIntro so they slide)
  bands(g, 0, 112, VW, 88, ['#5a564e', '#524e46', '#4a463e', '#423e38']);
  dither(g, 0, 112, VW, 88, '#6a665c', 0.10);
  frect(g, 0, 114, VW, 2, '#d8d0b8');                         // edge line
};

// the big yellow bus itself, drawn live so it can bob and roll (x = left edge, y = road contact)
function drawBusSprite(g, x, y, t){
  // exhaust puffing from the tailpipe (bus points left, so pipe is at the right)
  var puff = (t / 8 | 0) % 3;
  ell(g, x + 208 + puff * 6, y - 8 - puff * 2, 4 + puff * 2, 3 + puff, 'rgba(150,150,150,' + (0.4 - puff * 0.12) + ')');
  // body
  frect(g, x + 4, y - 48, 198, 38, '#f2be32');
  frect(g, x + 4, y - 48, 198, 4, '#f8d874');                 // roof highlight
  frect(g, x + 4, y - 12, 198, 2, '#c89422');                 // skirt shade
  // short nose + bumper + grille
  frect(g, x - 6, y - 36, 12, 24, '#f2be32');
  frect(g, x - 6, y - 36, 12, 3, '#c89422');
  frect(g, x - 9, y - 16, 8, 5, '#8a8a92');                   // bumper
  frect(g, x - 5, y - 30, 3, 10, '#5a564e');                  // grille
  px(g, x - 5, y - 33, '#f8f4e0');                            // headlight
  // rub rails
  frect(g, x + 4, y - 28, 198, 2, '#2a2620');
  frect(g, x + 4, y - 18, 198, 2, '#2a2620');
  // windshield + driver
  frect(g, x + 7, y - 46, 13, 17, '#3a4a5e');
  frect(g, x + 7, y - 46, 13, 2, '#5a6a7e');
  frect(g, x + 10, y - 40, 7, 6, '#8a6a4a');                  // driver's head (cap)
  frect(g, x + 10, y - 42, 7, 3, '#3a3a44');
  // passenger windows with the kids' faces
  var hairC = ['#3a2a1a', '#c05a2a', '#e8d48a', '#1a1a20', '#6a4226', '#8a5c36'];
  for (var wI = 0; wI < 6; wI++){
    var wx = x + 28 + wI * 27;
    frect(g, wx, y - 44, 21, 15, '#4a6a8e');
    frect(g, wx, y - 44, 21, 2, '#7a92ac');                   // glass shine
    if (wI === 3){
      // Scarlett, dozing against the glass: long brown hair, tipped head
      frect(g, wx + 3, y - 40, 12, 10, '#6a4226');
      frect(g, wx + 5, y - 37, 8, 7, '#e8b48e');
      frect(g, wx + 6, y - 34, 2, 1, '#5a3a20'); frect(g, wx + 10, y - 34, 2, 1, '#5a3a20');  // closed eyes
      frect(g, wx + 13, y - 39, 3, 9, '#8a5c36');             // hair against the window
    } else {
      // another kid on the ride home
      frect(g, wx + 6, y - 39, 8, 8, ['#e8b48e', '#c88a62', '#e8c098', '#a86a42', '#e8b48e', '#d09a72'][wI]);
      frect(g, wx + 5, y - 41, 10, 4, hairC[wI]);
      px(g, wx + 8, y - 36, '#2a2a30'); px(g, wx + 11, y - 36, '#2a2a30');
    }
  }
  // lettering + number
  g.fillStyle = '#2a2620'; g.font = 'bold 6px monospace'; g.textBaseline = 'top';
  g.fillText('LEXINGTON SWIM TEAM', x + 26, y - 26);
  g.fillText('BUS FIFTEEN', x + 138, y - 26);                 // spelled out, no ambiguous digits
  // roof flashers
  px(g, x + 6, y - 50, '#e43a2a'); px(g, x + 198, y - 50, '#e43a2a');
  // wheels, spinning
  var wheels = [x + 42, x + 168];
  for (var wh = 0; wh < 2; wh++){
    var cx = wheels[wh];
    ell(g, cx, y - 2, 10, 10, '#1a1a1e');
    ell(g, cx, y - 2, 4.5, 4.5, '#8a8a92');
    var a = t * 0.35 + wh;
    g.strokeStyle = '#4a4a52'; g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(cx - Math.cos(a) * 4, y - 2 - Math.sin(a) * 4);
    g.lineTo(cx + Math.cos(a) * 4, y - 2 + Math.sin(a) * 4);
    g.moveTo(cx - Math.cos(a + 1.57) * 4, y - 2 - Math.sin(a + 1.57) * 4);
    g.lineTo(cx + Math.cos(a + 1.57) * 4, y - 2 + Math.sin(a + 1.57) * 4);
    g.stroke();
  }
  // speed streaks trailing behind
  g.fillStyle = 'rgba(255,255,255,0.5)';
  for (var st = 0; st < 4; st++){
    g.fillRect(x + 205 + ((t * 3 + st * 17) % 30), y - 40 + st * 9, 10 + st * 2, 1);
  }
}

// ---- BUS 15 interior (the wake-up: same bus, from Scarlett's seat) ----------
ART.painters.bus = function(g){
  // ceiling + handrail
  bands(g, 0, 0, VW, 26, ['#d0ccbc', '#c0bcac', '#b0ac9c']);
  frect(g, 0, 8, VW, 3, '#8a8676');                          // handrail
  for (var h = 20; h < VW; h += 60) frect(g, h, 11, 2, 8, '#7a7666'); // rail straps
  frect(g, 0, 26, VW, 6, '#98947f');
  // window band
  frect(g, 0, 32, VW, 66, '#3a3630');
  for (var w = 0; w < 4; w++){
    var wx = 10 + w * 78;
    // sky + passing countryside
    bands(g, wx, 36, 62, 30, [PAL.skyMid, PAL.skyLow, PAL.skyHaze]);
    frect(g, wx, 66, 62, 16, PAL.grass3);
    frect(g, wx, 82, 62, 12, PAL.grass2);
    dither(g, wx, 66, 62, 28, PAL.grass4, 0.2);
    if (w === 0){
      // the aquatic center, receding behind the bus after the meet
      frect(g, wx + 4, 50, 56, 22, '#c8d4dc');               // pool building
      frect(g, wx + 4, 50, 56, 3, '#8aa4b4');
      frect(g, wx + 10, 56, 12, 10, '#5a708a'); frect(g, wx + 40, 56, 12, 10, '#5a708a');
      frect(g, wx + 6, 72, 52, 14, '#3a8ac8');               // outdoor pool
      frect(g, wx + 6, 72, 52, 2, '#8ac8ec');
      for (var ln = 0; ln < 4; ln++) frect(g, wx + 10 + ln * 12, 74, 1, 12, '#e8e8f0');   // lane lines
      frect(g, wx + 26, 62, 12, 10, '#e8e8f0');              // starting block
      frect(g, wx + 6, 88, 52, 8, '#2a5a8a');                // banner
      g.fillStyle = '#f0f4f8'; g.font = 'bold 6px monospace'; g.textBaseline = 'top';
      g.fillText('SWIM MEET', wx + 14, 89);
    } else if (w === 1){
      // passing houses
      house(g, wx + 6, 78, 20, 16, '#c8b49a', '#8a5a4a', '#a89478');
      house(g, wx + 34, 80, 22, 18, '#b4c4c8', '#5a6a8a', '#94a4a8');
    } else if (w === 2){
      // passing trees, blurred
      tree(g, wx + 12, 84, 34, PAL.leaf1, PAL.leaf2, PAL.leaf3, PAL.trunk2);
      tree(g, wx + 40, 86, 40, PAL.leaf2, PAL.leaf3, PAL.leaf4, PAL.trunk3);
      cloud(g, wx + 30, 44, 14, '#f0f6fa');
    } else {
      // open fields + a hint of the forest to come
      treeline(g, 96, 18, PAL.leaf1, PAL.leaf2);
      cloud(g, wx + 20, 42, 12, '#f0f6fa');
      drawCat(g, wx + 48, 92, {fur:'#1a1426', belly:'#1a1426', eye:PAL.gold}, 3, 0.55, true); // ...a watching cat?
    }
    // speed streaks
    g.fillStyle = 'rgba(255,255,255,0.55)';
    for (var st = 0; st < 5; st++) g.fillRect(wx + rndi(2, 50), 40 + rndi(0, 48), rndi(6, 14), 1);
    // glass shine
    g.fillStyle = 'rgba(255,255,255,0.10)';
    poly(g, [[wx + 6, 36], [wx + 22, 36], [wx + 6, 94]], 'rgba(255,255,255,0.12)');
  }
  // wall panel below windows
  bands(g, 0, 98, VW, 16, ['#a8a494', '#98947f']);
  frect(g, 0, 98, VW, 2, '#c8c4b4');
  // interior back wall behind the seats — this band used to be transparent
  // and collected cursor trails; every pixel gets paint now
  bands(g, 0, 112, VW, 58, ['#6a665a', '#5e5a4e', '#565246']);
  dither(g, 0, 112, VW, 58, '#78746a', 0.12);
  // Scarlett, asleep in the second-row seat, head against the window
  frect(g, 100, 78, 22, 16, HAIR);                            // hair against the glass
  frect(g, 98, 82, 6, 14, HAIR2);                             // hair spilling toward window
  frect(g, 104, 84, 13, 11, SKIN);                            // face, tipped right
  frect(g, 104, 80, 14, 4, HAIR);                             // bangs
  frect(g, 106, 89, 4, 1, '#6a4226'); frect(g, 112, 89, 4, 1, '#6a4226'); // closed eyes (lashes)
  px(g, 107, 90, '#6a4226'); px(g, 113, 90, '#6a4226');
  frect(g, 109, 93, 4, 1, '#c4685a');                         // soft sleeping smile
  frect(g, 102, 95, 22, 17, SHIRT);                           // white tee, slumped shoulders
  frect(g, 102, 95, 22, 2, SHIRT2);
  frect(g, 100, 98, 4, 12, SHIRT);                            // arm resting on the sill
  // Scarlett's purple backpack on the bench beside her
  frect(g, 126, 94, 15, 18, '#7a3a8a');
  frect(g, 128, 90, 11, 6, '#5a2a66');
  frect(g, 131, 99, 6, 8, '#9a5aac');
  px(g, 133, 96, '#c8a24a');                                  // zipper pull
  // seat rows (green vinyl school-bus seats)
  var seats = [12, 96, 180, 264];
  for (var s = 0; s < 4; s++){
    var sx = seats[s];
    frect(g, sx, 112, 44, 58, '#2a6a3a');
    frect(g, sx, 112, 44, 5, '#3d8a4e');
    frect(g, sx + 2, 117, 40, 2, '#1e4c2a');
    frect(g, sx, 112, 3, 58, '#1e4c2a');
    frect(g, sx + 6, 124, 32, 20, '#245c32');                 // stitched panel
  }
  // aisle floor
  bands(g, 0, 170, VW, 30, ['#5a564a', '#4c483e', '#3e3a32']);
  dither(g, 0, 170, VW, 30, '#6a6656', 0.15);
  frect(g, 0, 170, VW, 2, '#2e2a24');
};

// ---- FOURTREES (oaks + Great Rock are occluders — see OCC below) ------------
ART.painters.fourtrees = function(g){
  daySky(g, 108);
  treeline(g, 108, 30, PAL.leaf1, PAL.leaf2);
  grassGround(g, 108, PAL.grass2, PAL.grass3, PAL.grass4);
  // mossy patch at the oak roots
  blob(g, 60, 182, 14, 6, PAL.leaf3, 6); blob(g, 56, 180, 8, 4, PAL.leaf5, 4);
  path(g, 160, 200, 160, 138, 54, 12, PAL.dirt3, PAL.dirt4);
  for (var f = 0; f < 10; f++) flower(g, rndi(10, 310), rndi(150, 195), f % 2 ? '#e8e2f0' : PAL.gold2);
};

// ---- THUNDERCLAN CAMP (oak, Highrock & dens are occluders) ------------------
// like the books: a sandy hollow at the foot of a ravine, deep in the forest
ART.painters.thundercamp = function(g){
  daySky(g, 96);
  treeline(g, 96, 36, PAL.leaf1, PAL.leaf2);
  treeline(g, 100, 24, PAL.dark2, PAL.leaf1);
  // the ravine wall the camp shelters beneath
  bands(g, 0, 98, VW, 16, [PAL.dirt1, PAL.dirt2, PAL.dirt3]);
  dither(g, 0, 98, VW, 16, PAL.sand1, 0.25);
  frect(g, 0, 98, VW, 2, PAL.dark1);                         // shadowed lip
  g.strokeStyle = PAL.trunk2; g.lineWidth = 1;
  for (var rt = 0; rt < 7; rt++){                            // roots dangling over the edge
    var rx0 = 18 + rt * 46;
    g.beginPath(); g.moveTo(rx0, 99); g.quadraticCurveTo(rx0 + rndi(-4, 4), 104, rx0 + rndi(-6, 6), 108 + rndi(0, 4)); g.stroke();
  }
  // gorse camp wall
  blob(g, 300, 122, 30, 18, PAL.dark3, 8);
  blob(g, 250, 116, 26, 14, PAL.leaf2, 6);
  // sandy clearing
  bands(g, 0, 114, VW, 86, [PAL.sand1, PAL.sand2, PAL.sand3, PAL.sand2]);
  dither(g, 0, 114, VW, 86, PAL.dirt3, 0.12);
  // fresh-kill pile: an actual heap of prey
  ell(g, 191, 173, 16, 7, PAL.dirt2);
  ell(g, 185, 169, 6, 3.5, '#8a6a4a');                       // mouse body
  ell(g, 181, 167, 2, 1.5, '#8a6a4a');                       // mouse head
  g.strokeStyle = '#6a4a30'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(191, 170); g.quadraticCurveTo(196, 172, 197, 168); g.stroke();  // mouse tail
  ell(g, 196, 170, 6, 3.5, '#5a5a66');                       // starling body
  poly(g, [[193, 168], [200, 167], [197, 171]], '#3e3e48');  // folded wing
  px(g, 201, 168, '#e8b83a');                                // beak
  ell(g, 189, 164, 4.5, 2.5, '#9a8a6a');                     // vole on top
  ell(g, 236, 178, 5, 4, '#241a10');                         // the thieving mouse's hole
  dither(g, 231, 174, 11, 8, PAL.dirt2, 0.3);
  // storm-fallen branch below Highrock: a real bough with twigs
  g.strokeStyle = PAL.trunk1; g.lineWidth = 4;
  g.beginPath(); g.moveTo(253, 187); g.lineTo(293, 179); g.stroke();
  g.strokeStyle = PAL.trunk3; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(253, 187); g.lineTo(293, 179); g.stroke();
  g.strokeStyle = PAL.trunk3; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(268, 184); g.lineTo(276, 190); g.moveTo(281, 182); g.lineTo(287, 176); g.stroke();  // twigs
  px(g, 262, 185, PAL.trunk4); px(g, 274, 182, PAL.trunk4);  // bark highlights
  // mossy bank by the warriors' den: layered green mound
  blob(g, 26, 188, 17, 6, PAL.leaf2, 6);
  blob(g, 24, 185, 12, 4, PAL.leaf3, 5);
  blob(g, 22, 183, 7, 3, PAL.leaf5, 4);
  px(g, 18, 186, PAL.leaf5); px(g, 32, 184, PAL.leaf5);
  // marigold patch by the nursery: flowers on real stems
  blob(g, 132, 192, 20, 5, PAL.grass3, 6);
  for (var i = 0; i < 7; i++){
    var mx = 116 + i * 5 + rndi(0, 2), my = 190 + rndi(0, 5);
    frect(g, mx, my - 4, 1, 5, PAL.grass2);
    ell(g, mx + 0.5, my - 5, 2, 2, '#e8912a');
    px(g, mx, my - 5, PAL.gold2);
  }
  path(g, 160, 200, 160, 120, 60, 14, PAL.sand2, PAL.sand3);
  for (var t = 0; t < 6; t++) tuft(g, rndi(10, 310), rndi(120, 195), PAL.grass2);
};

// ---- RIVERCLAN CAMP --------------------------------------------------------
ART.painters.rivercamp = function(g){
  daySky(g, 100);
  treeline(g, 100, 24, PAL.leaf2, PAL.leaf3);
  grassGround(g, 100, PAL.grass2, PAL.grass3, PAL.grass4);
  // the river along the right
  poly(g, [[214,100],[320,100],[320,200],[248,200]], PAL.water2);
  poly(g, [[224,100],[320,100],[320,196],[258,200]], PAL.water3);
  for (var i = 0; i < 40; i++){
    var wy = 104 + rnd() * 92;
    frect(g, 224 + rnd() * (VW - 228) * ((wy - 100) / 100 * 0.4 + 0.6), wy, rndi(3, 8), 1, i % 3 ? PAL.water4 : PAL.water5);
  }
  // reed banks — some with brown cattail heads
  for (var r = 0; r < 22; r++){
    var rx = 216 + rnd() * 30, ry = 108 + rnd() * 84;
    var rtx = rx - 2 + rnd() * 4, rty = ry - rndi(9, 17);
    g.strokeStyle = PAL.leaf3; g.lineWidth = 1;
    g.beginPath(); g.moveTo(rx, ry); g.lineTo(rtx, rty); g.stroke();
    if (r % 4 === 0){ frect(g, rtx - 1, rty - 4, 2.5, 5, '#6a4a2a'); px(g, rtx, rty - 5, '#8a6a42'); }
  }
  // swan feathers on the upstream bank: big soft plumes with quills
  var fpos = [[176, 126], [187, 131], [170, 132]];
  for (var fe = 0; fe < 3; fe++){
    var fx = fpos[fe][0], fy = fpos[fe][1];
    ell(g, fx + 1, fy + 3, 2.5, 1, 'rgba(30,50,30,0.3)');    // ground shadow
    ell(g, fx, fy, 2.5, 5, fe === 1 ? '#f4f4f8' : PAL.cream);
    ell(g, fx - 0.5, fy - 1, 1.2, 3, '#ffffff');
    g.strokeStyle = '#b8b8a8'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(fx, fy - 5); g.lineTo(fx, fy + 5); g.stroke();   // quill
  }
  dither(g, 40, 128, 44, 14, PAL.sand2, 0.2); dither(g, 112, 120, 38, 12, PAL.sand2, 0.2);
  // smooth stepping stones — with a dark sparkling gap between two of them
  ell(g, 96, 178, 11, 4.5, PAL.rock3); ell(g, 96, 177, 9, 3.5, PAL.rock4);
  ell(g, 114, 184, 9, 4, PAL.rock4); ell(g, 114, 183, 7, 3, PAL.rock5);
  ell(g, 83, 187, 8, 3.5, PAL.rock3); ell(g, 83, 186, 6, 2.5, PAL.rock4);
  frect(g, 103, 179, 6, 5, '#141a28');                       // the dark gap
  px(g, 105, 181, PAL.water5); px(g, 107, 180, '#fff');      // ...something sparkles
  // driftwood branch washed up on the bank: pale, smooth, hooked
  g.strokeStyle = '#8a7a5a'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(148, 190); g.lineTo(178, 185); g.quadraticCurveTo(188, 183, 187, 175); g.stroke();
  g.strokeStyle = '#dcccA4'.toLowerCase(); g.lineWidth = 2;
  g.beginPath(); g.moveTo(148, 190); g.lineTo(178, 185); g.quadraticCurveTo(187, 183, 186, 176); g.stroke();
  px(g, 158, 188, '#b4a47c'); px(g, 168, 186, '#b4a47c');    // wood grain
  px(g, 152, 189, '#f0e4c0');
  path(g, 150, 200, 150, 112, 44, 10, PAL.dirt3, PAL.sand2);
  // a side-stream curls around the camp's foot — RiverClan's island home
  poly(g, [[0,191],[70,193],[132,197],[132,200],[0,200]], PAL.water2);
  poly(g, [[0,193],[68,195],[128,198],[128,200],[0,200]], PAL.water3);
  for (var st2 = 0; st2 < 8; st2++) frect(g, rndi(4, 120), 194 + rndi(0, 4), rndi(3, 6), 1, PAL.water4);
  ell(g, 40, 195, 5, 2, PAL.rock4);                          // crossing stone
};

// ---- WINDCLAN CAMP (moor) --------------------------------------------------
ART.painters.windcamp = function(g){
  daySky(g, 96);
  cloud(g, 120, 50, 40, '#f4f8fc'); cloud(g, 260, 62, 30, '#eaf2f8');
  // rolling moor hills (base fill first so the poly seams can't leave holes)
  frect(g, 0, 94, VW, 16, PAL.moor3);
  poly(g, [[0,96],[0,84],[90,72],[200,88],[320,74],[320,96]], PAL.moor3);
  poly(g, [[0,110],[0,94],[120,84],[240,98],[320,88],[320,110]], PAL.moor2);
  grassGround(g, 108, PAL.moor1, PAL.moor2, PAL.moor3);
  // heather drifts
  for (var i = 0; i < 60; i++){
    var hx = rndi(0, 90) + (i > 30 ? 200 : 0), hy = rndi(118, 150);
    px(g, hx, hy, i % 2 ? '#b47ae0' : '#9a5ad0');
  }
  blob(g, 40, 136, 26, 8, '#7a5a9a', 7); blob(g, 262, 140, 30, 9, '#7a5a9a', 8);
  // camp dip
  ell(g, 160, 158, 66, 22, PAL.moor1);
  ell(g, 160, 158, 54, 17, PAL.moor2);
  // rabbit warren: a dug mound with twin burrows and kicked-out earth
  ell(g, 293, 182, 24, 11, PAL.dirt3);
  ell(g, 291, 179, 18, 7, PAL.dirt4);
  ell(g, 287, 178, 7, 5.5, '#2a2014'); ell(g, 287, 176.5, 6, 3.5, '#150f08');
  ell(g, 303, 187, 6, 4.5, '#2a2014');
  dither(g, 272, 176, 44, 18, PAL.dirt2, 0.3);
  px(g, 276, 188, PAL.dirt4); px(g, 271, 191, PAL.dirt4); px(g, 280, 193, PAL.dirt4);  // kicked dirt
  g.strokeStyle = PAL.dirt2; g.lineWidth = 1;
  g.beginPath(); g.moveTo(281, 183); g.lineTo(274, 189); g.moveTo(285, 185); g.lineTo(280, 192); g.stroke();  // claw scrapes
  // sweet clover patch: white puffball blossoms on leafy stems
  blob(g, 120, 190, 22, 5, PAL.moor2, 6);
  for (var c = 0; c < 7; c++){
    var cx2 = 102 + c * 6 + rndi(0, 2), cy2 = 187 + rndi(0, 6);
    frect(g, cx2, cy2 - 3, 1, 4, PAL.grass3);
    ell(g, cx2 + 0.5, cy2 - 4, 1.8, 1.8, '#f0f0e2');
    px(g, cx2, cy2 - 5, '#ffffff');
    px(g, cx2 - 2, cy2, PAL.grass4); px(g, cx2 + 2, cy2 - 1, PAL.grass4);   // trefoil leaves
  }
  // mossy boulder: a proper rock wearing a moss cap
  ell(g, 43, 191, 14, 7, PAL.rock2);
  ell(g, 42, 189, 12, 5.5, PAL.rock3);
  px(g, 37, 187, PAL.rock4); px(g, 47, 188, PAL.rock4);
  blob(g, 41, 184, 10, 4, PAL.leaf3, 5); blob(g, 44, 183, 6, 3, PAL.leaf5, 4);
  px(g, 34, 186, PAL.leaf4); px(g, 50, 185, PAL.leaf4);      // moss creeping down
  path(g, 160, 200, 160, 118, 44, 10, PAL.dirt4, PAL.moor3);
};

// ---- SHADOWCLAN CAMP -------------------------------------------------------
ART.painters.shadowcamp = function(g){
  bands(g, 0, 0, VW, 102, ['#171226', '#221a36', PAL.shadow2, PAL.shadow3]);
  for (var i = 0; i < 20; i++) star(g, rndi(0, VW), rndi(0, 40), '#8a92b8');
  // black pines
  for (var p = 0; p < 6; p++) pine(g, 12 + p * 22, 104, 66, '#0e1418', '#182228');
  for (var q = 0; q < 4; q++) pine(g, 240 + q * 20, 102, 58, '#0e1418', '#182228');
  pine(g, 210, 98, 52, '#101a1e', '#1c2a30');
  // marshy dark ground
  bands(g, 0, 100, VW, 100, [PAL.marsh1, PAL.marsh2, PAL.marsh2, PAL.marsh1]);
  dither(g, 0, 100, VW, 100, PAL.shadow2, 0.18);
  // long pine shadows lie across everything — ShadowClan lives in the shade
  g.globalAlpha = 0.22;
  for (var shd = 0; shd < 6; shd++){
    var sx0 = 8 + shd * 52;
    poly(g, [[sx0, 100], [sx0 + 18, 100], [sx0 + 48, 200], [sx0 + 22, 200]], '#0a0e18');
  }
  g.globalAlpha = 1;
  // frog pond at the camp's edge: lily pads and a fat frog sunning itself
  ell(g, 66, 176, 36, 11, '#1c2c22');
  ell(g, 66, 176, 30, 9, '#24382c'); ell(g, 64, 175, 24, 6.5, '#2c4838');
  for (var l = 0; l < 5; l++){
    var lpx = 46 + l * 10, lpy = 172 + (l % 2) * 6;
    ell(g, lpx, lpy, 5, 2, PAL.marsh4);
    poly(g, [[lpx, lpy], [lpx + 5, lpy - 1.5], [lpx + 5, lpy + 1.5]], '#24382c');   // pad notch
  }
  ell(g, 56, 169, 4, 2.5, '#4a6a3a');                        // the frog
  ell(g, 53, 167.5, 1.6, 1.6, '#4a6a3a');
  px(g, 52, 166, PAL.gold); px(g, 54, 166, PAL.gold);        // bulgy eyes
  px(g, 58, 168, '#6a8a52');                                 // back sheen
  // glowing mushrooms + eyes in the dark
  px(g, 30, 150, PAL.glow); px(g, 32, 152, PAL.glow); frect(g, 29, 152, 4, 2, '#5a7a4a');
  px(g, 216, 108, PAL.gold); px(g, 220, 108, PAL.gold);     // watching eyes
  path(g, 160, 200, 160, 118, 44, 12, PAL.marsh2, PAL.marsh3);
};

// ---- SKYCLAN CAMP (the gorge) ----------------------------------------------
// warm sandstone cliffs, painted INSIDE their polygons (clipped) so no
// texture ever bleeds into the sky — pure background, Scarlett stays in front
var SKY_WALL_L = [[0,200],[0,70],[92,70],[112,100],[96,140],[60,170],[30,200]];
var SKY_WALL_R = [[320,200],[320,64],[230,64],[212,96],[226,138],[262,170],[292,200]];
function skyGorgeWalls(g){
  var walls = [SKY_WALL_L, SKY_WALL_R];
  for (var w = 0; w < 2; w++){
    var pts = walls[w];
    g.save();
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (var p = 1; p < pts.length; p++) g.lineTo(pts[p][0], pts[p][1]);
    g.closePath();
    g.clip();
    // sandstone strata, lighter at the sunlit top
    bands(g, 0, 60, VW, 140, ['#e0b078', '#d8a468', '#cf9a5e', '#c28a52', '#b47c48', '#a87042']);
    // thin darker strata seams with a gentle wobble
    g.fillStyle = 'rgba(110,64,32,0.35)';
    for (var sy = 76; sy < 198; sy += 13){
      for (var sx2 = 0; sx2 < VW; sx2 += 8){
        g.fillRect(sx2, sy + ((sx2 / 24) | 0) % 2, 8, 1);
      }
    }
    dither(g, 0, 60, VW, 140, '#e8c088', 0.07);              // faint sun-warmed grain
    g.restore();
    // sunlit inner edge of the cliff
    g.strokeStyle = '#ecc286'; g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(pts[1][0], pts[1][1]);
    for (var q = 2; q < pts.length; q++) g.lineTo(pts[q][0], pts[q][1]);
    g.stroke();
  }
  // cave dens in the walls
  ell(g, 46, 112, 10, 7, '#4a2e1a'); ell(g, 74, 134, 8, 6, '#4a2e1a');
  ell(g, 270, 98, 10, 7, '#4a2e1a'); ell(g, 246, 128, 8, 6, '#4a2e1a');
  // the wild beehive: banded, dripping honey, patrolled by bees
  frect(g, 30, 82, 13, 3, '#6a4a1e');                        // crack ledge it hangs from
  ell(g, 36, 92, 9, 11, '#a87a1e');
  ell(g, 36, 90, 8.5, 9, '#c8952a');
  frect(g, 28, 87, 16, 2, '#a87a1e'); frect(g, 29, 92, 15, 2, '#a87a1e'); frect(g, 31, 97, 11, 2, '#a87a1e');  // bands
  ell(g, 36, 95, 2.5, 2, '#3a2a10');                         // entrance
  px(g, 36, 103, PAL.gold2); px(g, 36, 106, PAL.gold2); px(g, 37, 109, PAL.gold);   // honey dripping
  px(g, 26, 96, '#2a2a10'); px(g, 46, 87, '#2a2a10'); px(g, 40, 103, '#2a2a10'); px(g, 30, 78, '#2a2a10'); // bees
  px(g, 27, 96, PAL.gold2); px(g, 47, 87, PAL.gold2);        // bee stripes
  // trailing ivy + rope vine
  g.strokeStyle = PAL.leaf3; g.lineWidth = 1;
  for (var v = 0; v < 8; v++){
    var vx = v < 4 ? 20 + v * 18 : 240 + (v - 4) * 18;
    g.beginPath(); g.moveTo(vx, 70); g.lineTo(vx + rndi(-3, 3), 70 + rndi(16, 34)); g.stroke();
  }
}

ART.painters.skycamp = function(g){
  daySky(g, 70);
  // the valley seen through the gorge mouth (this used to be a transparent
  // hole that smeared old frames — every pixel gets paint now)
  bands(g, 0, 70, VW, 52, [PAL.skyLow, PAL.skyHaze, '#d8e6d8']);
  treeline(g, 122, 22, PAL.leaf2, PAL.leaf3);
  frect(g, 0, 122, VW, 18, PAL.leaf3);
  dither(g, 0, 122, VW, 18, PAL.leaf2, 0.3);
  frect(g, 0, 136, VW, 64, PAL.sand3);                       // solid floor base, no gaps
  skyGorgeWalls(g);
  // gorge floor, sunlit
  bands(g, 96, 140, 130, 60, [PAL.sand2, PAL.sand3, PAL.sand4]);
  bands(g, 30, 170, 262, 30, [PAL.sand2, PAL.sand3]);
  frect(g, 60, 140, 200, 60, PAL.sand3);
  dither(g, 60, 140, 200, 60, PAL.sand1, 0.15);
  // half-built den: loose sticks (the Rockpile & finished den are occluders)
  g.strokeStyle = PAL.trunk3;
  g.beginPath(); g.moveTo(200, 174); g.lineTo(216, 162); g.moveTo(206, 176); g.lineTo(220, 168); g.moveTo(198, 170); g.lineTo(212, 158); g.stroke();
  ell(g, 160, 151, 26, 4, 'rgba(90,52,26,0.3)');             // Rockpile ground shadow
  // the cold spring: clear blue pool bubbling from the rock, moss soaked beside it
  ell(g, 263, 189, 18, 7, '#1a3a5e');
  ell(g, 262, 188, 15, 5.5, PAL.water3); ell(g, 261, 187, 10, 3.5, PAL.water4);
  px(g, 258, 186, '#fff'); px(g, 266, 188, PAL.water5); px(g, 262, 185, '#fff');  // sparkling water
  ell(g, 237, 185, 9, 4.5, PAL.rock3);
  blob(g, 235, 181, 8, 3.5, PAL.leaf2, 5); blob(g, 233, 180, 4, 2, PAL.leaf4, 3);
  px(g, 229, 186, PAL.water4); px(g, 241, 187, PAL.water4); px(g, 236, 189, PAL.water5);  // drips
  // the patch of turned earth, below the cliff caves: a scratched-up mound
  ell(g, 154, 190, 13, 4.5, '#9a6238');
  ell(g, 152, 188.5, 9, 3, '#a87042');
  dither(g, 142, 185, 26, 9, '#8a5a34', 0.35);
  g.strokeStyle = '#6a4226'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(148, 187); g.lineTo(154, 191); g.moveTo(152, 186); g.lineTo(158, 190); g.moveTo(156, 186); g.lineTo(162, 189); g.stroke();  // claw scratches
  px(g, 146, 192, '#c28a52'); px(g, 163, 191, '#c28a52');    // scattered sand
  // sunbeam
  g.globalAlpha = 0.10;
  poly(g, [[150,0],[210,0],[260,200],[120,200]], '#fff6d8');
  g.globalAlpha = 1;
  for (var f = 0; f < 6; f++) flower(g, rndi(80, 240), rndi(160, 195), PAL.gold2);
};

// ============================================================
// OCCLUDERS — mid-ground objects (trees, rocks, dens) painted
// into their own transparent layers so actors y-sort against
// them: stand below one and you're in front, above and you're
// behind. Cached like ART backgrounds.
// ============================================================
var OCC = {
  cache: {},
  get: function(scene){
    var defs = this.defs[scene];
    if (!defs) return [];
    if (!this.cache[scene]){
      var out = [];
      for (var i = 0; i < defs.length; i++){
        var o = offscreen();
        rseed(scene.length * 131 + i * 17 + 5);
        defs[i].paint(o.g);
        out.push({ canvas: o.canvas, y: defs[i].baseY });
      }
      this.cache[scene] = out;
    }
    return this.cache[scene];
  },
  defs: {
    fourtrees: [
      { baseY: 148, paint: function(g){ tree(g, 34, 148, 110, PAL.leaf1, PAL.leaf2, PAL.leaf3, PAL.trunk2); } },
      { baseY: 146, paint: function(g){ tree(g, 292, 146, 116, PAL.leaf1, PAL.leaf2, PAL.leaf3, PAL.trunk2); } },
      { baseY: 122, paint: function(g){ tree(g, 92, 122, 72, PAL.leaf2, PAL.leaf3, PAL.leaf4, PAL.trunk3); } },
      { baseY: 120, paint: function(g){ tree(g, 238, 120, 70, PAL.leaf2, PAL.leaf3, PAL.leaf4, PAL.trunk3); } },
      { baseY: 132, paint: function(g){ rock(g, 160, 132, 64, 30, PAL.rock2, PAL.rock3, PAL.rock4); } }
    ],
    thundercamp: [
      { baseY: 150, paint: function(g){
          tree(g, 56, 150, 124, PAL.leaf1, PAL.leaf2, PAL.leaf3, PAL.trunk2);
          px(g, 60, 46, PAL.gold2); px(g, 62, 44, '#fff'); px(g, 58, 48, PAL.gold2);  // the treasure glitters
        } },
      { baseY: 139, paint: function(g){
          rock(g, 282, 138, 70, 42, PAL.rock2, PAL.rock3, PAL.rock4);
          ell(g, 296, 128, 10, 8, '#20202a');
        } },
      { baseY: 157, paint: function(g){
          blob(g, 46, 150, 26, 14, PAL.trunk2, 8); blob(g, 44, 144, 18, 9, PAL.trunk3, 6);
          ell(g, 46, 152, 8, 6, '#241a10');
        } },
      { baseY: 138, paint: function(g){
          blob(g, 120, 132, 20, 11, PAL.leaf2, 7); ell(g, 120, 136, 6, 5, '#1c2a14');
        } }
    ],
    rivercamp: [
      { baseY: 146, paint: function(g){ blob(g, 60, 138, 24, 13, '#8a9a4e', 7); ell(g, 60, 142, 7, 5, '#3a4220'); } },
      { baseY: 135, paint: function(g){ blob(g, 130, 128, 20, 11, '#9aa85e', 6); ell(g, 130, 132, 6, 4, '#3a4220'); } }
    ],
    windcamp: [
      { baseY: 147, paint: function(g){ blob(g, 110, 142, 18, 9, PAL.dark3, 6); } },
      { baseY: 153, paint: function(g){
          // Barkface's herb store: gorse nook, drying bundles, the folded bile leaf out front
          blob(g, 202, 144, 20, 10, PAL.dark3, 7);
          ell(g, 202, 148, 7, 5, '#2a2014');
          g.strokeStyle = '#5a4a2e'; g.lineWidth = 1;
          g.beginPath(); g.moveTo(193, 141); g.lineTo(193, 146); g.moveTo(211, 140); g.lineTo(211, 145); g.stroke();  // hanging stems
          frect(g, 191, 146, 5, 4, PAL.leaf4); frect(g, 209, 145, 5, 4, PAL.leaf3);   // drying bundles
          frect(g, 199, 151, 6, 4, '#c8d84a'); px(g, 201, 152, '#e8e8b0');            // the bile leaf, folded
        } }
    ],
    shadowcamp: [
      { baseY: 143, paint: function(g){ blob(g, 60, 136, 26, 13, '#241c14', 8); ell(g, 60, 140, 7, 5, '#0c0a08'); } },
      { baseY: 134, paint: function(g){ blob(g, 116, 128, 22, 11, '#241c14', 7); ell(g, 116, 132, 6, 4, '#0c0a08'); } },
      { baseY: 138, paint: function(g){
          // the old fox den: gnarled root arch over a pitch-black tunnel
          blob(g, 170, 126, 24, 10, '#2a2218', 6);
          ell(g, 170, 132, 10, 6.5, '#060504');
          g.strokeStyle = '#3a2c1c'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(157, 130); g.quadraticCurveTo(162, 118, 172, 120); g.stroke();
          g.beginPath(); g.moveTo(184, 131); g.quadraticCurveTo(182, 120, 172, 120); g.stroke();
          g.lineWidth = 1;
          g.beginPath(); g.moveTo(160, 126); g.lineTo(155, 133); g.moveTo(181, 124); g.lineTo(187, 129); g.stroke();
          px(g, 162, 136, '#d8d0c0'); px(g, 165, 137, '#c8c0b0');   // old bones by the entrance
        } },
      { baseY: 181, paint: function(g){
          rock(g, 278, 162, 66, 42, '#5a4a3a', '#7a6a52', '#9a8a6a');
          rock(g, 244, 170, 30, 18, '#4a3e30', '#6a5a46');
          ell(g, 272, 154, 6, 4, '#181410');                        // snake crevice
          px(g, 284, 148, PAL.glow); px(g, 287, 150, '#d2ffc2');    // glow-moss shimmer
        } }
    ],
    skycamp: [
      { baseY: 150, paint: function(g){
          // the Rockpile: stacked warm boulders sitting ON the gorge floor
          rock(g, 160, 150, 50, 20, '#b47a48', '#cf9a5e', '#e8bc7e');
          rock(g, 148, 138, 24, 12, '#a87042', '#c28a52', '#e0b078');
          rock(g, 172, 136, 20, 10, '#b47a48', '#cf9a5e');
        } },
      { baseY: 172, paint: function(g){ blob(g, 110, 168, 18, 8, '#8a9a4e', 5); } }
    ]
  }
};

// solid footprints — you can't stand ON a trunk, rock, or den; walk targets
// inside these get nudged just below them (game.js walkTo)
var SOLIDS = {
  fourtrees:  [ {x:28,y:130,w:13,h:20}, {x:285,y:128,w:14,h:20}, {x:86,y:110,w:12,h:14},
                {x:232,y:108,w:12,h:14}, {x:128,y:110,w:64,h:24} ],
  thundercamp:[ {x:49,y:130,w:14,h:22}, {x:247,y:106,w:70,h:34}, {x:22,y:138,w:46,h:20}, {x:102,y:124,w:36,h:15} ],
  rivercamp:  [ {x:38,y:126,w:44,h:21}, {x:112,y:118,w:36,h:18} ],
  windcamp:   [ {x:94,y:134,w:32,h:14}, {x:184,y:136,w:36,h:18} ],
  shadowcamp: [ {x:36,y:124,w:48,h:20}, {x:96,y:118,w:40,h:17}, {x:150,y:116,w:40,h:23}, {x:236,y:142,w:84,h:40} ],
  skycamp:    [ {x:134,y:128,w:52,h:24}, {x:92,y:160,w:36,h:13} ]
};

// ---- TRAVEL MAP -------------------------------------------------------------
ART.painters.map = function(g){
  // parchment base
  bands(g, 0, 0, VW, VH, ['#d8c494', '#e2d0a2', '#d8c494', '#ccb684']);
  dither(g, 0, 0, VW, VH, '#b49a62', 0.18);
  // territories (soft tints, echoing warriorcatsmap.png layout)
  blob(g, 70, 80, 60, 34, 'rgba(150,180,90,0.5)', 9);       // WindClan moor NW
  blob(g, 160, 120, 66, 40, 'rgba(90,140,70,0.55)', 10);    // ThunderClan forest center
  blob(g, 258, 120, 50, 36, 'rgba(90,80,110,0.5)', 9);      // ShadowClan SE-E
  blob(g, 70, 150, 55, 30, 'rgba(80,120,150,0.35)', 8);     // RiverClan SW
  blob(g, 250, 52, 48, 26, 'rgba(120,160,120,0.5)', 8);     // SkyClan NE
  // mountains N
  for (var m = 0; m < 7; m++){
    var mx = 60 + m * 22;
    poly(g, [[mx - 9, 30], [mx, 12 + (m % 2) * 4], [mx + 9, 30]], PAL.rock3);
    poly(g, [[mx - 2, 18 + (m % 2) * 3], [mx, 12 + (m % 2) * 4], [mx + 4, 20]], '#e8e8f0');
  }
  // the river: falls SW corner through center to E
  g.strokeStyle = PAL.water3; g.lineWidth = 5;
  g.beginPath(); g.moveTo(30, 190); g.quadraticCurveTo(70, 150, 120, 150);
  g.quadraticCurveTo(190, 150, 210, 100); g.quadraticCurveTo(226, 60, 300, 40); g.stroke();
  g.strokeStyle = PAL.water4; g.lineWidth = 2;
  g.beginPath(); g.moveTo(30, 190); g.quadraticCurveTo(70, 150, 120, 150);
  g.quadraticCurveTo(190, 150, 210, 100); g.quadraticCurveTo(226, 60, 300, 40); g.stroke();
  // thunderpath
  g.strokeStyle = '#6a6a72'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(0, 60); g.quadraticCurveTo(120, 78, 200, 130); g.quadraticCurveTo(240, 156, 320, 160); g.stroke();
  g.strokeStyle = '#d8d8c8'; g.lineWidth = 1;
  g.setLineDash([3, 3]);
  g.beginPath(); g.moveTo(0, 60); g.quadraticCurveTo(120, 78, 200, 130); g.quadraticCurveTo(240, 156, 320, 160); g.stroke();
  g.setLineDash([]);
  // little trees for flavor
  for (var t = 0; t < 26; t++){
    var tx = rndi(110, 215), ty = rndi(95, 150);
    poly(g, [[tx - 3, ty], [tx, ty - 6], [tx + 3, ty]], PAL.leaf2);
  }
  for (var p2 = 0; p2 < 12; p2++){
    var px2 = rndi(235, 300), py2 = rndi(100, 145);
    poly(g, [[px2 - 3, py2], [px2, py2 - 7], [px2 + 3, py2]], PAL.pine2);
  }
  // border + title box
  g.strokeStyle = '#5a4226'; g.lineWidth = 3; g.strokeRect(3, 3, VW - 6, VH - 6);
  g.strokeStyle = PAL.gold; g.lineWidth = 1; g.strokeRect(6, 6, VW - 12, VH - 12);
  frect(g, 8, 8, 128, 22, '#efe6cc');
  g.strokeStyle = '#5a4226'; g.strokeRect(8, 8, 128, 22);
  g.fillStyle = '#3a2a18'; g.font = 'bold 8px monospace'; g.textBaseline = 'top';
  g.fillText('THE CLANS\' TERRITORIES', 12, 11);
  g.font = '7px monospace';
  g.fillText('~ click a place to travel ~', 11, 20);
};

// ---- CEREMONY (Fourtrees at night) -----------------------------------------
ART.painters.ending = function(g){
  nightSky(g, 130);
  treeline(g, 130, 30, '#101c2a', '#182636');
  bands(g, 0, 130, VW, 70, [PAL.dark2, PAL.dark3, PAL.dark2]);
  // the four oaks silhouetted
  tree(g, 30, 150, 90, '#0e1a12', '#14241a', '#1a2e20', '#1a120c');
  tree(g, 290, 150, 90, '#0e1a12', '#14241a', '#1a2e20', '#1a120c');
  rock(g, 160, 128, 56, 26, '#242432', '#32323e', '#42424e');
  // StarClan shimmer above
  for (var i = 0; i < 24; i++) star(g, 100 + rndi(0, 120), rndi(10, 70), i % 3 ? '#cdd8f0' : '#fff');
};

// ---- HOME (the dark blue house — birthday afternoon) -------------------------
ART.painters.home = function(g){
  // late-afternoon sky
  bands(g, 0, 0, VW, 118, ['#4a6ecb', '#7aa3e3', '#aecdec', '#e2d8b8', '#f0dfa8']);
  cloud(g, 50, 20, 24, '#f4f8fc'); cloud(g, 250, 30, 30, '#eef4f8');
  // ground base first (no transparent gaps between sky and lawn)
  bands(g, 0, 116, VW, 60, [PAL.grass3, PAL.grass3, PAL.grass2, PAL.grass3]);
  // neighborhood behind
  treeline(g, 118, 22, PAL.leaf2, PAL.leaf3);
  house(g, 12, 118, 34, 26, '#c8b49a', '#8a5a4a', '#a89478');
  house(g, 276, 118, 36, 28, '#b4c4c8', '#5a6a8a', '#94a4a8');
  // THE dark blue house
  frect(g, 96, 52, 128, 78, '#24365e');                       // main body
  frect(g, 96, 52, 128, 3, '#1a2848');
  frect(g, 96, 52, 3, 78, '#1a2848');
  poly(g, [[88, 54], [232, 54], [160, 22]], '#141d33');       // roof
  frect(g, 190, 28, 10, 18, '#3a3a44');                       // chimney
  // windows (white trim, warm glass)
  var winxs = [106, 140, 186];
  for (var w = 0; w < 3; w++){
    frect(g, winxs[w], 62, 20, 16, '#f0f0f0');
    frect(g, winxs[w] + 2, 64, 16, 12, '#f2dfa0');
    frect(g, winxs[w] + 9, 64, 2, 12, '#f0f0f0');
    frect(g, winxs[w] + 2, 69, 16, 2, '#f0f0f0');
  }
  frect(g, 106, 92, 20, 16, '#f0f0f0'); frect(g, 108, 94, 16, 12, '#8ab4d8');
  frect(g, 186, 92, 20, 16, '#f0f0f0'); frect(g, 188, 94, 16, 12, '#8ab4d8');
  frect(g, 114, 92, 2, 16, '#f0f0f0'); frect(g, 194, 92, 2, 16, '#f0f0f0');
  // porch + front door
  frect(g, 148, 88, 26, 42, '#1c2a4a');
  frect(g, 152, 94, 18, 36, '#f0ead8');                       // white door
  frect(g, 154, 96, 14, 14, '#d8d0ba');
  px(g, 166, 114, '#c8a24a');                                 // doorknob
  // birthday "15" on the door + balloons on the porch rail
  g.fillStyle = '#b43a2e'; g.font = 'bold 8px monospace'; g.textBaseline = 'top';
  g.fillText('15', 156, 100);
  ell(g, 142, 82, 4, 5, '#dd4a3a'); ell(g, 148, 76, 4, 5, PAL.gold2); ell(g, 136, 76, 4, 5, '#4a8ade');
  g.strokeStyle = '#8a8a92'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(142, 87); g.lineTo(145, 96); g.moveTo(148, 81); g.lineTo(146, 96); g.moveTo(136, 81); g.lineTo(144, 96); g.stroke();
  // front lawn
  bands(g, 0, 130, VW, 46, [PAL.grass3, PAL.grass2, PAL.grass3]);
  for (var t2 = 0; t2 < 40; t2++) tuft(g, rndi(0, VW), rndi(134, 172), PAL.grass4);
  // walk from the door to the sidewalk
  poly(g, [[154, 130], [170, 130], [182, 176], [146, 176]], '#c8bca0');
  dither(g, 148, 130, 32, 46, '#a89a7a', 0.25);
  // flower bed along the house
  for (var f = 0; f < 9; f++) flower(g, 100 + rndi(0, 120), 131 + rndi(0, 4), ['#e88aa8', '#e8e2f0', PAL.gold2][f % 3]);
  // sidewalk + street
  bands(g, 0, 176, VW, 8, ['#b0aca0', '#a09c90']);
  frect(g, 0, 176, VW, 1, '#c8c4b8');
  bands(g, 0, 184, VW, 16, ['#5a564e', '#4c4842']);
  frect(g, 0, 191, 12, 2, '#e8dfa0'); frect(g, 30, 191, 14, 2, '#e8dfa0'); // road paint
  // Bus 15, pulling away at the right edge
  frect(g, 282, 152, 38, 34, '#e8b83a');
  frect(g, 282, 152, 38, 4, '#c89422');
  frect(g, 284, 158, 14, 10, '#3a4a5e');                     // rear window
  frect(g, 284, 172, 5, 4, '#dd3a2a'); frect(g, 293, 172, 5, 4, '#dd3a2a'); // tail lights
  g.fillStyle = '#2a2218'; g.font = 'bold 6px monospace';
  g.fillText('15', 302, 160);
  ell(g, 290, 187, 5, 4, '#22201c'); ell(g, 312, 187, 5, 4, '#22201c');
  frect(g, 270, 184, 12, 2, '#8a8680');                      // exhaust puff line
  // the family, waiting on the lawn by the walk
  homePerson(g, 112, 174, { h:46, skin:'#e8b48e', hair:'#4a3220', legC:'#3a4a6e',
    top:'plaid', topC:'#a83a2e', topC2:'#4a1e18', cap:'#16233f', capB:'#c8102e' });          // Dad — tall, Sox cap, plaid
  homePerson(g, 132, 174, { h:40, skin:'#eabc96', hair:'#b08b5e', hairLong:true,
    top:'dress', topC:'#2e7a3e', topC2:'#245c30' });                                          // Mom — green dress
  homePerson(g, 196, 175, { h:34, skin:'#eec09a', hair:'#c05a2a', legC:'#4a4a52', freckles:true,
    top:'jersey', topC:'#1c2f52', topC2:'#c8102e' });                                         // Hank — Patriots #10
  homePerson(g, 212, 176, { h:26, skin:'#f0c8a4', hair:'#b08b5e', hairLong:true, legC:'#7a5a8e',
    top:'tee', topC:'#e88aa8', topC2:'#d0708e' });                                            // Ramona
  // the family dog? no — a small golden cat watching from the flower bed...
  drawCat(g, 84, 140, {fur:'#d8a44e', belly:'#f0d8a0', eye:'#c8a24a'}, 2, 0.55, true);
};
