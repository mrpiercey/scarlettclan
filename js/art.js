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

// ---- TITLE ---------------------------------------------------------------
ART.painters.title = function(g){
  bands(g, 0, 0, VW, 120, [PAL.duskTop, '#5a3a72', PAL.duskMid, '#b46a6a', PAL.duskLow, PAL.duskHaze]);
  ell(g, 160, 118, 34, 34, '#f6d88a'); ell(g, 160, 118, 26, 26, '#fce8b4');   // setting sun
  for (var i = 0; i < 26; i++) star(g, rndi(0, VW), rndi(0, 55), '#f0e2c8');
  // silhouetted forest + hills
  poly(g, [[0,130],[0,108],[60,96],[130,110],[200,98],[270,108],[320,100],[320,130]], '#2c1e3e');
  treeline(g, 116, 26, '#221636', '#301f4a');
  bands(g, 0, 126, VW, 74, ['#3a2a52', '#33244a', '#2a1c3e', '#221632']);
  path(g, 160, 200, 160, 132, 60, 8, '#4a3860', '#5a4670');
  // two cat silhouettes watching the sunset
  drawCat(g, 130, 178, {fur:'#191026', belly:'#191026', eye:PAL.gold}, 2, 1.15, false);
  drawCat(g, 196, 176, {fur:'#191026', belly:'#191026', eye:PAL.glow}, 5, 1.0, true);
  for (var f = 0; f < 12; f++) px(g, rndi(20, 300), rndi(120, 190), PAL.gold2); // fireflies
};

// ---- BUS 15 (intro & the wake-up: riding home from Henry Clay) --------------
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
      // Henry Clay High School, receding behind the bus
      frect(g, wx + 4, 46, 54, 28, '#b8a488');
      frect(g, wx + 4, 46, 54, 3, '#8a7a5e');
      for (var sw = 0; sw < 5; sw++) frect(g, wx + 8 + sw * 10, 52, 6, 8, '#5a708a');
      frect(g, wx + 26, 64, 10, 10, '#6a5a44');              // doors
      frect(g, wx + 2, 38, 1, 36, '#888');                   // flagpole
      frect(g, wx + 3, 38, 8, 5, '#b43a2e');
      frect(g, wx + 6, 76, 52, 10, '#2a5a34');               // marquee sign
      g.fillStyle = '#f0e8c8'; g.font = 'bold 7px monospace'; g.textBaseline = 'top';
      g.fillText('HENRY CLAY', wx + 9, 77);
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
  // Scarlett, dozing against the second window (drawn before seat backs)
  frect(g, 130, 88, 14, 13, HAIR);                            // hair
  frect(g, 131, 92, 8, 7, SKIN);                              // cheek (leaning right, eyes closed)
  frect(g, 132, 95, 3, 1, '#6a4226'); frect(g, 136, 95, 2, 1, '#6a4226'); // closed eyes
  frect(g, 128, 101, 18, 14, SHIRT);                          // shoulder above seat
  frect(g, 145, 86, 6, 10, HAIR2);                            // hair against glass
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
  // Scarlett's backpack peeking beside her seat
  frect(g, 152, 120, 16, 20, '#7a3a8a');
  frect(g, 154, 116, 12, 6, '#5a2a66');
  frect(g, 157, 124, 6, 9, '#9a5aac');
  // aisle floor
  bands(g, 0, 170, VW, 30, ['#5a564a', '#4c483e', '#3e3a32']);
  dither(g, 0, 170, VW, 30, '#6a6656', 0.15);
  frect(g, 0, 170, VW, 2, '#2e2a24');
};

// ---- FOURTREES -------------------------------------------------------------
ART.painters.fourtrees = function(g){
  daySky(g, 108);
  treeline(g, 108, 30, PAL.leaf1, PAL.leaf2);
  grassGround(g, 108, PAL.grass2, PAL.grass3, PAL.grass4);
  // the four great oaks
  tree(g, 34, 148, 110, PAL.leaf1, PAL.leaf2, PAL.leaf3, PAL.trunk2);
  tree(g, 292, 146, 116, PAL.leaf1, PAL.leaf2, PAL.leaf3, PAL.trunk2);
  tree(g, 92, 122, 72, PAL.leaf2, PAL.leaf3, PAL.leaf4, PAL.trunk3);
  tree(g, 238, 120, 70, PAL.leaf2, PAL.leaf3, PAL.leaf4, PAL.trunk3);
  // the Great Rock
  rock(g, 160, 132, 64, 30, PAL.rock2, PAL.rock3, PAL.rock4);
  // mossy patch at the oak roots
  blob(g, 60, 182, 14, 6, PAL.leaf3, 6); blob(g, 56, 180, 8, 4, PAL.leaf5, 4);
  path(g, 160, 200, 160, 138, 54, 12, PAL.dirt3, PAL.dirt4);
  for (var f = 0; f < 10; f++) flower(g, rndi(10, 310), rndi(150, 195), f % 2 ? '#e8e2f0' : PAL.gold2);
};

// ---- THUNDERCLAN CAMP ------------------------------------------------------
ART.painters.thundercamp = function(g){
  daySky(g, 100);
  treeline(g, 100, 34, PAL.leaf1, PAL.leaf2);
  // the old oak, towering over the camp's left side
  tree(g, 56, 150, 124, PAL.leaf1, PAL.leaf2, PAL.leaf3, PAL.trunk2);
  px(g, 60, 46, PAL.gold2); px(g, 62, 44, '#fff'); px(g, 58, 48, PAL.gold2);   // the glittering treasure, far too high
  // gorse camp wall
  blob(g, 300, 118, 30, 18, PAL.dark3, 8);
  blob(g, 250, 110, 26, 14, PAL.leaf2, 6);
  // sandy clearing
  bands(g, 0, 112, VW, 88, [PAL.sand1, PAL.sand2, PAL.sand3, PAL.sand2]);
  dither(g, 0, 112, VW, 88, PAL.dirt3, 0.12);
  // Highledge rock + leader's den
  rock(g, 282, 138, 70, 42, PAL.rock2, PAL.rock3, PAL.rock4);
  ell(g, 296, 128, 10, 8, '#20202a');
  // warriors' den (bramble dome) + nursery
  blob(g, 46, 150, 26, 14, PAL.trunk2, 8); blob(g, 44, 144, 18, 9, PAL.trunk3, 6);
  ell(g, 46, 152, 8, 6, '#241a10');
  blob(g, 120, 132, 20, 11, PAL.leaf2, 7); ell(g, 120, 136, 6, 5, '#1c2a14');
  // fresh-kill pile + the thieving mouse hole
  ell(g, 190, 172, 14, 6, PAL.dirt2);
  ell(g, 185, 168, 5, 3, '#8a6a4a'); ell(g, 194, 169, 5, 3, '#9a8a6a'); ell(g, 190, 165, 4, 3, '#7a5a3a');
  ell(g, 236, 178, 5, 4, '#241a10');                        // mouse hole
  // storm-fallen branch below Highrock
  g.strokeStyle = PAL.trunk3; g.lineWidth = 2;
  g.beginPath(); g.moveTo(254, 186); g.lineTo(292, 179); g.stroke();
  px(g, 270, 182, PAL.trunk1);
  // mossy bank by the warriors' den
  blob(g, 24, 186, 14, 5, PAL.leaf3, 6); blob(g, 20, 184, 8, 3, PAL.leaf5, 4);
  // marigold patch by the nursery
  for (var i = 0; i < 9; i++) flower(g, 116 + rndi(0, 34), 186 + rndi(0, 8), '#e8912a', PAL.gold2);
  blob(g, 132, 190, 16, 5, PAL.grass3, 5);
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
  // reed banks
  g.strokeStyle = PAL.leaf3; g.lineWidth = 1;
  for (var r = 0; r < 22; r++){
    var rx = 216 + rnd() * 30, ry = 108 + rnd() * 84;
    g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 2 + rnd() * 4, ry - rndi(8, 16)); g.stroke();
  }
  // swan feathers on the upstream bank
  ell(g, 178, 128, 2, 4, PAL.cream); ell(g, 188, 132, 2, 4, '#f4f4f8'); ell(g, 172, 133, 2, 4, PAL.cream);
  // woven reed dens
  blob(g, 60, 138, 24, 13, '#8a9a4e', 7); ell(g, 60, 142, 7, 5, '#3a4220');
  blob(g, 130, 128, 20, 11, '#9aa85e', 6); ell(g, 130, 132, 6, 4, '#3a4220');
  dither(g, 40, 128, 44, 14, PAL.sand2, 0.2); dither(g, 112, 120, 38, 12, PAL.sand2, 0.2);
  // smooth stepping stones — with a dark sparkling gap between two of them
  ell(g, 96, 178, 10, 4, PAL.rock3); ell(g, 112, 184, 8, 3.5, PAL.rock4); ell(g, 84, 186, 7, 3, PAL.rock3);
  frect(g, 102, 179, 5, 4, '#1a2030');
  px(g, 104, 180, PAL.water5);
  // driftwood branch washed up on the bank
  g.strokeStyle = PAL.sand3; g.lineWidth = 2;
  g.beginPath(); g.moveTo(148, 190); g.lineTo(184, 184); g.quadraticCurveTo(190, 182, 188, 178); g.stroke();
  px(g, 166, 187, PAL.sand1);
  path(g, 150, 200, 150, 112, 44, 10, PAL.dirt3, PAL.sand2);
};

// ---- WINDCLAN CAMP (moor) --------------------------------------------------
ART.painters.windcamp = function(g){
  daySky(g, 96);
  cloud(g, 120, 50, 40, '#f4f8fc'); cloud(g, 260, 62, 30, '#eaf2f8');
  // rolling moor hills
  poly(g, [[0,96],[0,84],[90,72],[200,88],[320,74],[320,96]], PAL.moor3);
  poly(g, [[0,110],[0,94],[120,84],[240,98],[320,88],[320,110]], PAL.moor2);
  grassGround(g, 108, PAL.moor1, PAL.moor2, PAL.moor3);
  // heather drifts
  for (var i = 0; i < 60; i++){
    var hx = rndi(0, 90) + (i > 30 ? 200 : 0), hy = rndi(118, 150);
    px(g, hx, hy, i % 2 ? '#b47ae0' : '#9a5ad0');
  }
  blob(g, 40, 136, 26, 8, '#7a5a9a', 7); blob(g, 262, 140, 30, 9, '#7a5a9a', 8);
  // camp dip with gorse
  ell(g, 160, 158, 66, 22, PAL.moor1);
  ell(g, 160, 158, 54, 17, PAL.moor2);
  blob(g, 110, 142, 18, 9, PAL.dark3, 6);
  // Barkface's herb store: a gorse nook stacked with herb bundles
  blob(g, 202, 144, 20, 10, PAL.dark3, 7);
  ell(g, 202, 148, 7, 5, '#2a2014');
  frect(g, 194, 150, 5, 3, PAL.leaf4); frect(g, 202, 151, 5, 3, '#c8d84a'); frect(g, 209, 150, 4, 3, PAL.leaf3);
  // rabbit warren holes
  ell(g, 288, 178, 7, 5, '#2a2014'); ell(g, 302, 186, 6, 4, '#2a2014');
  dither(g, 278, 172, 36, 20, PAL.dirt3, 0.25);
  // sweet clover patch
  for (var c = 0; c < 12; c++){
    var cx2 = 102 + rndi(0, 38), cy2 = 184 + rndi(0, 8);
    px(g, cx2, cy2, '#f0f0e2'); px(g, cx2 - 1, cy2 + 1, PAL.grass4); px(g, cx2 + 1, cy2 + 1, PAL.grass4);
  }
  // mossy boulder
  ell(g, 42, 190, 12, 6, PAL.rock3);
  blob(g, 40, 186, 9, 4, PAL.leaf3, 5); blob(g, 44, 185, 5, 3, PAL.leaf5, 4);
  path(g, 160, 200, 160, 118, 44, 10, PAL.dirt4, PAL.moor3);
};

// ---- SHADOWCLAN CAMP -------------------------------------------------------
ART.painters.shadowcamp = function(g){
  bands(g, 0, 0, VW, 92, ['#171226', '#221a36', PAL.shadow2, PAL.shadow3]);
  for (var i = 0; i < 20; i++) star(g, rndi(0, VW), rndi(0, 40), '#8a92b8');
  // black pines
  for (var p = 0; p < 6; p++) pine(g, 12 + p * 22, 104, 66, '#0e1418', '#182228');
  for (var q = 0; q < 4; q++) pine(g, 240 + q * 20, 102, 58, '#0e1418', '#182228');
  pine(g, 210, 98, 52, '#101a1e', '#1c2a30');
  // marshy dark ground
  bands(g, 0, 100, VW, 100, [PAL.marsh1, PAL.marsh2, PAL.marsh2, PAL.marsh1]);
  dither(g, 0, 100, VW, 100, PAL.shadow2, 0.18);
  // frog pond at the camp's edge, with lily pads
  ell(g, 66, 176, 34, 10, '#24382c'); ell(g, 66, 176, 26, 7, '#2c4838');
  for (var l = 0; l < 5; l++) ell(g, 46 + l * 10, 172 + (l % 2) * 6, 4, 1.5, PAL.marsh4);
  // bramble dens
  blob(g, 60, 136, 26, 13, '#241c14', 8); ell(g, 60, 140, 7, 5, '#0c0a08');
  blob(g, 116, 128, 22, 11, '#241c14', 7); ell(g, 116, 132, 6, 4, '#0c0a08');
  // the old fox den: black tunnel under twisted roots
  blob(g, 170, 126, 22, 10, '#2a2218', 6);
  ell(g, 170, 132, 9, 6, '#060504');
  g.strokeStyle = '#3a2c1c'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(158, 122); g.quadraticCurveTo(170, 116, 184, 123); g.stroke();
  // Snakerocks looming on the right
  rock(g, 278, 162, 66, 42, '#5a4a3a', '#7a6a52', '#9a8a6a');
  rock(g, 244, 170, 30, 18, '#4a3e30', '#6a5a46');
  ell(g, 272, 154, 6, 4, '#181410');                        // snake crevice
  px(g, 284, 148, PAL.glow); px(g, 287, 150, '#d2ffc2');    // glow-moss shimmer deep inside
  // glowing mushrooms + eyes in the dark
  px(g, 30, 150, PAL.glow); px(g, 32, 152, PAL.glow); frect(g, 29, 152, 4, 2, '#5a7a4a');
  px(g, 216, 108, PAL.gold); px(g, 220, 108, PAL.gold);     // watching eyes
  path(g, 160, 200, 160, 118, 44, 12, PAL.marsh2, PAL.marsh3);
};

// ---- SKYCLAN CAMP (the gorge) ----------------------------------------------
ART.painters.skycamp = function(g){
  daySky(g, 70);
  // warm sandstone gorge walls
  poly(g, [[0,200],[0,70],[92,70],[112,100],[96,140],[60,170],[30,200]], '#c28a52');
  poly(g, [[0,140],[0,70],[80,70],[96,96],[76,120],[36,134]], '#d8a468');
  dither(g, 0, 70, 110, 110, '#a87042', 0.25);
  poly(g, [[320,200],[320,64],[230,64],[212,96],[226,138],[262,170],[292,200]], '#c28a52');
  poly(g, [[320,130],[320,64],[240,64],[226,92],[248,118],[286,128]], '#d8a468');
  dither(g, 214, 64, 106, 110, '#a87042', 0.25);
  // cave dens in the walls
  ell(g, 46, 112, 10, 7, '#4a2e1a'); ell(g, 74, 134, 8, 6, '#4a2e1a');
  ell(g, 270, 98, 10, 7, '#4a2e1a'); ell(g, 246, 128, 8, 6, '#4a2e1a');
  // the wild beehive in a crack of the left wall
  ell(g, 36, 90, 8, 10, '#c8952a'); frect(g, 32, 84, 8, 2, '#8a6a2a');
  frect(g, 34, 88, 4, 1, '#8a6a2a'); frect(g, 34, 93, 4, 1, '#8a6a2a');
  px(g, 28, 96, '#2a2a10'); px(g, 44, 88, '#2a2a10'); px(g, 38, 102, '#2a2a10'); // bees
  // trailing ivy + rope vine
  g.strokeStyle = PAL.leaf3; g.lineWidth = 1;
  for (var v = 0; v < 8; v++){
    var vx = v < 4 ? 20 + v * 18 : 240 + (v - 4) * 18;
    g.beginPath(); g.moveTo(vx, 70); g.lineTo(vx + rndi(-3, 3), 70 + rndi(16, 34)); g.stroke();
  }
  // gorge floor, sunlit
  bands(g, 96, 140, 130, 60, [PAL.sand2, PAL.sand3, PAL.sand4]);
  bands(g, 30, 170, 262, 30, [PAL.sand2, PAL.sand3]);
  frect(g, 60, 140, 200, 60, PAL.sand3);
  dither(g, 60, 140, 200, 60, PAL.sand1, 0.15);
  // the rockpile ledge + half-built dens
  rock(g, 160, 132, 44, 26, '#b47a48', '#cf9a5e', '#e8bc7e');
  blob(g, 110, 168, 18, 8, '#8a9a4e', 5);                  // finished den
  // half-built den: loose sticks
  g.strokeStyle = PAL.trunk3;
  g.beginPath(); g.moveTo(200, 174); g.lineTo(216, 162); g.moveTo(206, 176); g.lineTo(220, 168); g.moveTo(198, 170); g.lineTo(212, 158); g.stroke();
  // the cold spring + soaked moss (bottom right)
  ell(g, 262, 188, 16, 6, PAL.water3); ell(g, 262, 188, 11, 4, PAL.water4);
  ell(g, 236, 184, 8, 4, PAL.rock3);
  blob(g, 234, 181, 7, 3, PAL.leaf2, 4); px(g, 230, 186, PAL.water4); px(g, 240, 187, PAL.water4);
  // the patch of turned earth, below the cliff caves
  dither(g, 142, 186, 26, 8, '#a87042', 0.5);
  dither(g, 146, 188, 18, 5, '#8a5a34', 0.4);
  // sunbeam
  g.globalAlpha = 0.16;
  poly(g, [[150,0],[210,0],[260,200],[120,200]], '#fff6d8');
  g.globalAlpha = 1;
  for (var f = 0; f < 6; f++) flower(g, rndi(80, 240), rndi(160, 195), PAL.gold2);
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
