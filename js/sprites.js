// ============================================================
// sprites.js — Scarlett, cats, portraits, items, cursors.
// Everything drawn procedurally in 320x200 space.
// ============================================================

var SKIN = '#e8b48e', SKIN2 = '#d09a72', HAIR = '#6a4226', HAIR2 = '#8a5c36',
    JEANS = '#3a5a9e', JEANS2 = '#2c4478', SHIRT = '#f4f0e2', SHIRT2 = '#d0ccc0',
    SHOE = '#4a3222', EYEBLUE = '#3a6ade';

// ---- Scarlett (tall! feet anchored at x,y) ----------------------------
// frame 0 = standing still; frames 1..4 = walk cycle
// (1 contact, 2 passing, 3 contact mirrored, 4 passing)
function drawScarlett(g, x, y, dir, frame, s){
  g.save();
  g.translate(x | 0, y | 0);
  g.scale(s, s);
  if (dir === 'left'){ g.scale(-1, 1); dir = 'right'; }
  var f = frame > 0 ? ((frame - 1) % 4) + 1 : 0;
  function r(px_, py_, w, h, c){ g.fillStyle = c; g.fillRect(px_, py_, w, h); }
  function limb(x1, y1, x2, y2, w, c){
    g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }

  if (dir === 'down' || dir === 'up'){
    // the whole body bobs up a pixel when a foot is lifted
    var bob = (f === 1 || f === 3) ? -1 : 0;
    g.translate(0, bob);
    var liftL = (f === 1) ? 6 : 0;                 // left foot raised
    var liftR = (f === 3) ? 6 : 0;                 // right foot raised
    // legs (jeans): planted leg full length, stepping leg bent with foot up
    r(-4, -20, 4, 17 - liftL, JEANS);
    r(0, -20, 4, 17 - liftR, JEANS);
    r(-4, -20, 1, 17 - liftL, JEANS2); r(3, -20, 1, 17 - liftR, JEANS2);
    r(-4, -4 - liftL, 4, 3, SHOE);                 // shoes follow the feet
    r(0, -4 - liftR, 4, 3, SHOE);
    // torso (white tee)
    r(-6, -34, 12, 15, SHIRT);
    r(5, -34, 1, 15, SHIRT2); r(-6, -21, 12, 2, SHIRT2);
    // arms swing opposite the legs
    var swing = (f === 1) ? 3 : (f === 3) ? -3 : 0;
    r(-8, -33 + swing, 2, 8, SHIRT);  r(6, -33 - swing, 2, 8, SHIRT);
    r(-8, -25 + swing, 2, 6, SKIN);   r(6, -25 - swing, 2, 6, SKIN);
    // long brown hair behind shoulders
    r(-6, -42, 12, 10, HAIR);
    r(-7, -38, 3, 12, HAIR); r(4, -38, 3, 12, HAIR);
    if (dir === 'down'){
      // face
      r(-4, -42, 8, 8, SKIN);
      r(-5, -46, 10, 5, HAIR); r(-5, -43, 2, 3, HAIR2); r(3, -43, 2, 3, HAIR2);
      px(g, -2, -39, EYEBLUE); px(g, 1, -39, EYEBLUE);
      r(-1, -36, 2, 1, '#c4685a');                 // smile
    } else {
      r(-5, -46, 10, 12, HAIR);                    // back of head
      r(-3, -44, 6, 3, HAIR2);
    }
  } else { // right profile — legs scissor in a real stride
    var strideA = [1.5, 5, 0, -5, 0][f];           // front leg foot x
    var strideB = [-1.5, -5, 0, 5, 0][f];          // back leg foot x
    var liftA = (f === 2) ? 4 : 0;                 // foot swings through, lifted
    var liftB = (f === 4) ? 4 : 0;
    var bob2 = (f === 2 || f === 4) ? -1 : 0;      // rise on passing frames
    g.translate(0, bob2);
    // back leg first (darker), then front leg
    limb(0, -19, strideB, -3 - liftB, 3.4, JEANS2);
    r(strideB - 1, -4 - liftB, 5, 3, SHOE);
    limb(0, -19, strideA, -3 - liftA, 3.4, JEANS);
    r(strideA - 1, -4 - liftA, 5, 3, SHOE);
    // torso
    r(-5, -34, 9, 15, SHIRT); r(-5, -21, 9, 2, SHIRT2);
    // arm swings opposite the front leg
    var hand = -strideA * 0.8;
    limb(-1, -30, -1 + hand, -21, 2.8, SKIN);      // forearm
    r(-3, -34, 5, 6, SHIRT2);                      // sleeve
    // head + flowing hair
    r(-5, -42, 8, 9, SKIN);
    r(-6, -46, 10, 6, HAIR);
    r(-6, -42, 4, 12, HAIR);
    r(-6, -34, 3, 6, HAIR2);
    if (f === 1 || f === 3) px(g, -7, -40 + (f === 1 ? 1 : -1), HAIR2); // hair sways
    px(g, 1, -39, EYEBLUE);
    px(g, 2, -36, '#c4685a');
  }
  g.restore();
}

// ---- Cats ---------------------------------------------------------------
// spec: {fur, belly, patch, eye, stripes, starry}
function drawCat(g, x, y, spec, frame, s, flip){
  g.save();
  g.translate(x | 0, y | 0);
  g.scale(s || 1, s || 1);
  if (flip) g.scale(-1, 1);
  var tailWag = Math.sin(frame * 0.7) * 2;
  // tail
  g.strokeStyle = spec.fur; g.lineWidth = 2;
  g.beginPath(); g.moveTo(7, -4); g.quadraticCurveTo(13, -6, 12 + tailWag, -13); g.stroke();
  // body (sitting)
  ell(g, 0, -6, 8, 6.5, spec.fur);
  if (spec.patch) { ell(g, -3, -7, 4, 3.5, spec.patch); ell(g, 4, -4, 3, 3, spec.patch); }
  if (spec.stripes){ g.fillStyle = spec.stripes; g.fillRect(-5, -10, 2, 3); g.fillRect(-1, -11, 2, 3); g.fillRect(3, -9, 2, 3); }
  ell(g, -3, -3, 4, 3.5, spec.belly || spec.fur);
  // front legs
  frect(g, -6, -5, 2.5, 6, spec.fur); frect(g, -2, -5, 2.5, 6, spec.fur);
  // head
  ell(g, -4, -14, 5, 4.5, spec.fur);
  if (spec.patch) ell(g, -6, -15, 2.5, 2, spec.patch);
  poly(g, [[-8, -16], [-6, -21], [-4.5, -16]], spec.fur);   // ears
  poly(g, [[-3, -16], [-1.5, -21], [0.5, -16]], spec.fur);
  poly(g, [[-6.7, -17], [-6, -19.5], [-5.3, -17]], '#d8909a');
  // eyes + nose
  px(g, -6, -15, spec.eye); px(g, -2, -15, spec.eye);
  px(g, -4, -13, '#d87a8a');
  if (spec.starry){ for (var i = 0; i < 8; i++) px(g, -8 + rndi(0, 14), -20 + rndi(0, 16), '#eef4ff'); }
  g.restore();
}

// small sleeping/curled kit
function drawKit(g, x, y, spec, s){
  g.save(); g.translate(x, y); g.scale(s || 0.6, s || 0.6);
  ell(g, 0, -4, 7, 5, spec.fur);
  ell(g, -4, -6, 4, 3.5, spec.fur);
  poly(g, [[-7, -8], [-5.5, -12], [-4, -8]], spec.fur);
  poly(g, [[-4, -8], [-2.5, -12], [-1, -8]], spec.fur);
  px(g, -5, -7, spec.eye); px(g, -2, -7, spec.eye);
  g.restore();
}

// ---- Portraits (drawn into ~56x56 box, KQ6 dialogue frame) -------------
function drawPortraitScarlett(g, x, y){
  frect(g, x, y, 56, 56, '#4a5a9e');                      // blue backdrop
  dither(g, x, y, 56, 56, '#3a4a86', 0.3);
  frect(g, x + 12, y + 30, 32, 26, SHIRT);                // shoulders/tee
  frect(g, x + 12, y + 30, 32, 2, SHIRT2);
  frect(g, x + 8, y + 14, 10, 42, HAIR);                  // long hair L
  frect(g, x + 38, y + 14, 10, 42, HAIR);                 // long hair R
  frect(g, x + 16, y + 12, 24, 26, SKIN);                 // face
  frect(g, x + 14, y + 6, 28, 10, HAIR);                  // top hair
  frect(g, x + 16, y + 14, 6, 4, HAIR2);                  // bangs
  frect(g, x + 34, y + 14, 6, 4, HAIR2);
  frect(g, x + 20, y + 22, 5, 4, '#fff');                 // eyes
  frect(g, x + 31, y + 22, 5, 4, '#fff');
  frect(g, x + 22, y + 23, 3, 3, EYEBLUE);
  frect(g, x + 33, y + 23, 3, 3, EYEBLUE);
  px(g, x + 23, y + 23, '#0a0a1e'); px(g, x + 34, y + 23, '#0a0a1e');
  frect(g, x + 20, y + 20, 5, 1, HAIR); frect(g, x + 31, y + 20, 5, 1, HAIR); // brows
  frect(g, x + 27, y + 27, 2, 3, SKIN2);                  // nose
  frect(g, x + 24, y + 32, 8, 2, '#c4685a');              // smile
  px(g, x + 23, y + 31, '#c4685a'); px(g, x + 32, y + 31, '#c4685a');
}

function drawPortraitCat(g, x, y, spec){
  frect(g, x, y, 56, 56, spec.bg || '#3a5a3a');
  dither(g, x, y, 56, 56, '#2a422a', 0.3);
  // ears
  poly(g, [[x + 10, y + 22], [x + 16, y + 4], [x + 24, y + 18]], spec.fur);
  poly(g, [[x + 32, y + 18], [x + 40, y + 4], [x + 46, y + 22]], spec.fur);
  poly(g, [[x + 13, y + 19], [x + 16, y + 9], [x + 21, y + 17]], '#d8909a');
  poly(g, [[x + 35, y + 17], [x + 40, y + 9], [x + 43, y + 19]], '#d8909a');
  // head
  ell(g, x + 28, y + 34, 19, 17, spec.fur);
  if (spec.patch){ ell(g, x + 18, y + 28, 8, 7, spec.patch); ell(g, x + 38, y + 42, 7, 6, spec.patch); }
  if (spec.stripes){
    g.fillStyle = spec.stripes;
    g.fillRect(x + 14, y + 22, 4, 7); g.fillRect(x + 24, y + 19, 4, 6); g.fillRect(x + 36, y + 22, 4, 7);
  }
  ell(g, x + 28, y + 42, 10, 8, spec.belly || spec.fur);   // muzzle
  // eyes
  ell(g, x + 20, y + 31, 4.5, 5, spec.eye);
  ell(g, x + 36, y + 31, 4.5, 5, spec.eye);
  frect(g, x + 19, y + 29, 2, 5, '#0a0a0f'); frect(g, x + 35, y + 29, 2, 5, '#0a0a0f');
  px(g, x + 18, y + 28, '#fff'); px(g, x + 34, y + 28, '#fff');
  // nose + mouth + whiskers
  poly(g, [[x + 25, y + 38], [x + 31, y + 38], [x + 28, y + 42]], '#d87a8a');
  g.strokeStyle = spec.belly || '#ddd'; g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x + 18, y + 40); g.lineTo(x + 6, y + 38);
  g.moveTo(x + 18, y + 43); g.lineTo(x + 7, y + 44);
  g.moveTo(x + 38, y + 40); g.lineTo(x + 50, y + 38);
  g.moveTo(x + 38, y + 43); g.lineTo(x + 49, y + 44);
  g.stroke();
  if (spec.starry){ rseed(9); for (var i = 0; i < 14; i++) star(g, x + 4 + rndi(0, 48), y + 4 + rndi(0, 48), '#eef4ff'); }
}

// ---- Family portraits (Dad, Mom, Hank, Ramona — for the ending) ----------
// spec: {skin, hair, hairLong, eye, bg, freckles, cap:{c,b},
//        top:'plaid'|'jersey'|'dress'|'tee', topC, topC2, number}
function drawPortraitHuman(g, x, y, spec){
  frect(g, x, y, 56, 56, spec.bg || '#4a5a9e');
  dither(g, x, y, 56, 56, '#2a3448', 0.3);
  // shoulders / top
  frect(g, x + 10, y + 32, 36, 24, spec.topC);
  if (spec.top === 'plaid'){
    g.fillStyle = spec.topC2;
    for (var vx = 12; vx < 46; vx += 6) g.fillRect(x + vx, y + 32, 2, 24);
    for (var vy = 34; vy < 56; vy += 6) g.fillRect(x + 10, y + vy, 36, 2);
  } else if (spec.top === 'jersey'){
    frect(g, x + 10, y + 32, 36, 3, spec.topC2);
    frect(g, x + 10, y + 32, 4, 24, spec.topC2); frect(g, x + 42, y + 32, 4, 24, spec.topC2);
    g.fillStyle = '#f0f0f4'; g.font = 'bold 9px monospace'; g.textBaseline = 'top';
    g.fillText(spec.number || '10', x + 22, y + 42);
  } else if (spec.top === 'dress'){
    frect(g, x + 10, y + 32, 36, 24, spec.topC);
    poly(g, [[x + 20, y + 32], [x + 36, y + 32], [x + 28, y + 40]], spec.skin); // neckline
    frect(g, x + 26, y + 44, 4, 4, spec.topC2);
  } else {
    frect(g, x + 12, y + 34, 32, 2, spec.topC2);
  }
  // hair behind
  if (spec.hairLong){
    frect(g, x + 8, y + 14, 10, 40, spec.hair);
    frect(g, x + 38, y + 14, 10, 40, spec.hair);
  }
  // face
  frect(g, x + 16, y + 12, 24, 26, spec.skin);
  // top hair or cap
  if (spec.cap){
    frect(g, x + 14, y + 4, 28, 12, spec.cap.c);
    frect(g, x + 10, y + 14, 22, 3, spec.cap.c);            // brim
    g.fillStyle = spec.cap.b; g.font = 'bold 7px monospace'; g.textBaseline = 'top';
    g.fillText('B', x + 25, y + 6);
    frect(g, x + 16, y + 17, 4, 4, spec.hair);              // hair peeking out
    frect(g, x + 36, y + 17, 4, 4, spec.hair);
  } else {
    frect(g, x + 14, y + 6, 28, 10, spec.hair);
    frect(g, x + 16, y + 14, 6, 4, spec.hair);              // bangs
    frect(g, x + 34, y + 14, 6, 4, spec.hair);
  }
  // eyes
  frect(g, x + 20, y + 22, 5, 4, '#fff');
  frect(g, x + 31, y + 22, 5, 4, '#fff');
  frect(g, x + 22, y + 23, 3, 3, spec.eye);
  frect(g, x + 33, y + 23, 3, 3, spec.eye);
  px(g, x + 23, y + 23, '#0a0a1e'); px(g, x + 34, y + 23, '#0a0a1e');
  frect(g, x + 20, y + 20, 5, 1, spec.hair); frect(g, x + 31, y + 20, 5, 1, spec.hair); // brows
  frect(g, x + 27, y + 27, 2, 3, '#d09a72');               // nose
  if (spec.freckles){
    px(g, x + 19, y + 28, '#c08a5a'); px(g, x + 22, y + 30, '#c08a5a');
    px(g, x + 34, y + 30, '#c08a5a'); px(g, x + 37, y + 28, '#c08a5a');
  }
  frect(g, x + 24, y + 32, 8, 2, '#c4685a');               // big smile
  px(g, x + 23, y + 31, '#c4685a'); px(g, x + 32, y + 31, '#c4685a');
}

// ---- Item icons (16x16 cell) -------------------------------------------
function drawItem(g, x, y, id){
  rseed(42);
  switch(id){
    case 'marigold':
      frect(g, x + 7, y + 8, 2, 7, PAL.grass3);
      ell(g, x + 8, y + 6, 4, 4, '#e8912a'); ell(g, x + 8, y + 6, 2, 2, PAL.gold2);
      break;
    case 'stick':
      g.strokeStyle = PAL.trunk3; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x + 2, y + 14); g.lineTo(x + 13, y + 3); g.stroke();
      px(g, x + 10, y + 8, PAL.trunk1);
      break;
    case 'moss':
      blob(g, x + 8, y + 9, 5, 4, PAL.leaf3, 5); blob(g, x + 7, y + 8, 3, 2, PAL.leaf5, 4);
      break;
    case 'wetmoss':
      blob(g, x + 8, y + 9, 5, 4, PAL.leaf2, 5); blob(g, x + 7, y + 8, 3, 2, PAL.leaf4, 4);
      px(g, x + 5, y + 13, PAL.water4); px(g, x + 10, y + 14, PAL.water4);
      break;
    case 'driftwood':
      g.strokeStyle = PAL.sand2; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x + 2, y + 14); g.lineTo(x + 10, y + 5); g.quadraticCurveTo(x + 13, y + 2, x + 13, y + 6); g.stroke();
      px(g, x + 7, y + 10, PAL.sand1);
      break;
    case 'clover':
      g.strokeStyle = PAL.grass3; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x + 8, y + 14); g.lineTo(x + 8, y + 7); g.stroke();
      ell(g, x + 6, y + 6, 2, 2, PAL.grass4); ell(g, x + 10, y + 6, 2, 2, PAL.grass4); ell(g, x + 8, y + 4, 2, 2, PAL.grass4);
      ell(g, x + 12, y + 10, 2, 1.5, '#f0f0e2'); px(g, x + 12, y + 9, '#fff');
      break;
    case 'mossball':
      ell(g, x + 8, y + 8, 5, 5, PAL.leaf3);
      ell(g, x + 6.5, y + 6.5, 2.5, 2.5, PAL.leaf5);
      px(g, x + 11, y + 10, PAL.leaf2); px(g, x + 8, y + 12, PAL.leaf2);
      break;
    case 'shinystone':
      poly(g, [[x+8,y+3],[x+13,y+8],[x+8,y+13],[x+3,y+8]], PAL.water4);
      poly(g, [[x+8,y+5],[x+11,y+8],[x+8,y+11],[x+5,y+8]], PAL.water5);
      px(g, x + 6, y + 6, '#fff');
      break;
    case 'reeds':
      g.strokeStyle = PAL.leaf3; g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x+5,y+14); g.lineTo(x+4,y+3); g.moveTo(x+8,y+14); g.lineTo(x+8,y+2);
      g.moveTo(x+11,y+14); g.lineTo(x+12,y+4); g.stroke();
      frect(g, x + 7, y + 2, 2, 4, PAL.trunk3);
      break;
    case 'feather':
      ell(g, x + 8, y + 7, 3, 6, PAL.cream);
      g.strokeStyle = PAL.rock3; g.beginPath(); g.moveTo(x + 8, y + 2); g.lineTo(x + 8, y + 14); g.stroke();
      break;
    case 'bileleaf':
      poly(g, [[x+3,y+9],[x+8,y+3],[x+13,y+9],[x+8,y+14]], PAL.leaf3);
      px(g, x + 8, y + 9, '#c8d84a');
      break;
    case 'frog':
      ell(g, x + 8, y + 10, 5, 4, PAL.marsh4);
      ell(g, x + 5, y + 6, 2, 2, PAL.marsh4); ell(g, x + 11, y + 6, 2, 2, PAL.marsh4);
      px(g, x + 5, y + 5, PAL.gold); px(g, x + 11, y + 5, PAL.gold);
      break;
    case 'snakeherb':
      g.strokeStyle = PAL.leaf4; g.beginPath(); g.moveTo(x+8,y+14); g.lineTo(x+8,y+5); g.stroke();
      ell(g, x + 8, y + 4, 3, 2, PAL.gold2); ell(g, x + 5, y + 8, 2, 1.5, PAL.gold2); ell(g, x + 11, y + 8, 2, 1.5, PAL.gold2);
      break;
    case 'glowmoss':
      blob(g, x + 8, y + 9, 5, 4, PAL.glow, 5);
      px(g, x + 4, y + 5, '#e2ffd8'); px(g, x + 12, y + 6, '#e2ffd8'); px(g, x + 8, y + 3, '#e2ffd8');
      break;
    case 'honey':
      frect(g, x + 4, y + 6, 8, 8, '#e8a82a');
      px(g,x+6,y+8,PAL.gold2); px(g,x+9,y+8,PAL.gold2); px(g,x+7,y+11,PAL.gold2);
      frect(g, x + 5, y + 4, 6, 2, PAL.trunk3);
      break;
    case 'ancestorcollar':
    case 'collar':
      g.strokeStyle = PAL.gold; g.lineWidth = 2;
      g.beginPath(); g.arc(x + 8, y + 8, 5, 0, Math.PI * 2); g.stroke();
      poly(g, [[x+6,y+12],[x+10,y+12],[x+8,y+16]], PAL.gold2);
      px(g, x + 8, y + 13, PAL.red);
      break;
  }
}

// ---- Cursors (KQ6 style: dark outline, warm skin/tan fill) ----------------
var CUR_OUT = '#4a1e16', CUR_SK = '#e8b48e', CUR_SK2 = '#c88a62', CUR_HI = '#f6d8b8';

function drawCursor(g, x, y, mode, itemId){
  switch(mode){
    case 'look': // a real eye: lid, white, blue iris, glint
      ell(g, x + 7, y + 6, 7.5, 5, CUR_OUT);
      ell(g, x + 7, y + 6, 6.2, 3.8, '#f6f2e8');
      ell(g, x + 7, y + 6, 3, 3, EYEBLUE);
      ell(g, x + 7, y + 6, 2, 2, '#26449a');
      ell(g, x + 7, y + 6, 1.1, 1.1, '#0c0c14');
      px(g, x + 5, y + 4, '#fff'); px(g, x + 6, y + 4, '#fff');
      g.strokeStyle = CUR_OUT; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(x, y + 4); g.quadraticCurveTo(x + 7, y - 2, x + 14, y + 4); g.stroke();
      break;
    case 'use': // pointing hand: index finger up, three curled knuckles, thumb, cuff
      var HAND = [
        '....OO..........',
        '...OSSO.........',
        '...OHSO.........',
        '...OHSO.........',
        '...OSSO.........',
        '...OSSOO........',
        '...OSSOSSOO.....',
        '...OSSOSSOSSOO..',
        '..OOSSDSSDSSSSO.',
        '.OSSOSSSSSSSSDO.',
        '.OSSSSSSSSSSSDO.',
        '.OSSSSSSSSSSDO..',
        '..OSSSSSSSSSDO..',
        '..OSSSSSSSSDO...',
        '...OSSSSSSSDO...',
        '...OOOOOOOOO....'
      ];
      var HC = { O: CUR_OUT, S: CUR_SK, H: CUR_HI, D: CUR_SK2 };
      for (var hy = 0; hy < HAND.length; hy++){
        for (var hx = 0; hx < HAND[hy].length; hx++){
          var hch = HAND[hy][hx];
          if (hch !== '.') px(g, x + hx - 4, y + hy, HC[hch]);   // fingertip lands at the click point
        }
      }
      break;
    case 'talk': // round speech bubble with curled tail
      ell(g, x + 7, y + 5.5, 7.5, 5.5, CUR_OUT);
      ell(g, x + 7, y + 5.5, 6.2, 4.2, CUR_SK);
      ell(g, x + 5, y + 3.8, 2.8, 1.6, CUR_HI);
      ell(g, x + 9.5, y + 8, 2.2, 1.4, CUR_SK2);
      g.strokeStyle = CUR_OUT; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(x + 10.5, y + 9.5); g.quadraticCurveTo(x + 13, y + 13, x + 9, y + 12.6); g.stroke();
      g.strokeStyle = CUR_SK; g.lineWidth = 0.9;
      g.beginPath(); g.moveTo(x + 10.3, y + 9.8); g.quadraticCurveTo(x + 11.8, y + 12, x + 9.8, y + 11.8); g.stroke();
      break;
    case 'item':
      drawItem(g, x - 2, y - 2, itemId);
      px(g, x + 12, y, '#fff'); px(g, x + 14, y + 2, '#fff');
      break;
    case 'walk': // tan arrow pointer (also the general UI arrow)
    default:
      poly(g, [[x, y], [x, y + 13.5], [x + 3.6, y + 10.4], [x + 6.2, y + 15.2], [x + 8.8, y + 14], [x + 6.4, y + 9.4], [x + 11, y + 9.4]], CUR_OUT);
      poly(g, [[x + 1, y + 2.2], [x + 1, y + 11.2], [x + 3.8, y + 8.8], [x + 6.6, y + 13.4], [x + 7.5, y + 13], [x + 5, y + 8.2], [x + 8.7, y + 8.2]], CUR_SK);
      frect(g, x + 1, y + 2, 1, 8, CUR_HI);               // left-edge highlight
      break;
  }
}
