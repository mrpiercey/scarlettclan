// ============================================================
// game.js — main loop, input, walking, verbs, inventory,
// travel map, HUD, finale ceremony, save/load.
// ============================================================

var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// fit the 640x400 canvas to the window (integer-ish scale, pixelated)
function fitCanvas(){
  var scale = Math.min((window.innerWidth - 20) / 640, (window.innerHeight - 60) / 400);
  scale = Math.max(1, Math.floor(scale * 2) / 2);
  canvas.style.width = (640 * scale) + 'px';
  canvas.style.height = (400 * scale) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

var SAVE_KEY = 'scarlettquest15v2';

// ---- global game state ------------------------------------------------------
var G = {
  mode: 'title',          // title | play | map | inv | ceremony | ending
  scene: 'fourtrees',
  x: 160, y: 170, dir: 'down', step: 0,
  walking: false, tx: 0, ty: 0, onArrive: null,
  verb: 'walk',           // walk | look | talk | use | item
  activeItem: null,
  invSelect: null,
  inventory: [],
  collars: 0,
  flags: {},
  endPhase: 0,
  pendingReveal: false, pendingReturn: false,
  hasSave: false,
  walkTo: function(x, y, cb){
    var sc = SCENES[this.scene];
    this.tx = Math.max(8, Math.min(312, x));
    this.ty = Math.max(sc.horizon + 2, Math.min(196, y));
    this.walking = true;
    this.onArrive = cb || null;
  }
};

var mouse = { x: 160, y: 100 };
var tick = 0;
var fireflies = [];
var titlePulse = 0;

// ---- inventory & progress helpers -------------------------------------------
function hasItem(id){ return G.inventory.indexOf(id) >= 0; }
function addItem(id){
  if (!hasItem(id)) G.inventory.push(id);
  SND.ding();
  DLG.toast('You got: ' + ITEMS[id].name + '!', id);
  save();
}
function removeItem(id){
  var i = G.inventory.indexOf(id);
  if (i >= 0) G.inventory.splice(i, 1);
  if (G.activeItem === id){ G.activeItem = null; if (G.verb === 'item') G.verb = 'walk'; }
}
function gainCollar(clan){
  G.collars++;
  SND.fanfare();
  DLG.toast('★ ' + clan + ' collar earned!  (' + G.collars + ' of 15) ★', 'collar');
  if (G.collars === 12) G.pendingReveal = true;
  if (G.collars === 15) G.pendingReturn = true;
  save();
}
function travelTo(scene){
  G.scene = scene;
  var s = SCENES[scene];
  G.x = s.spawn.x; G.y = s.spawn.y;
  G.walking = false; G.onArrive = null; G.dir = 'down';
  G.mode = 'play';
  SND.playSong(s.music);
  save();
}

// ---- save / load --------------------------------------------------------------
function save(){
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      scene: G.scene, x: G.x, y: G.y,
      inventory: G.inventory, collars: G.collars, flags: G.flags
    }));
  } catch(e){}
}
function load(){
  try {
    var d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!d) return false;
    G.scene = d.scene; G.x = d.x; G.y = d.y;
    G.inventory = d.inventory || []; G.collars = d.collars || 0; G.flags = d.flags || {};
    return true;
  } catch(e){ return false; }
}
G.hasSave = !!localStorage.getItem(SAVE_KEY);

// ---- scene queries --------------------------------------------------------------
function visibleNpcs(){
  var s = SCENES[G.scene], out = [];
  for (var i = 0; i < s.npcs.length; i++){
    if (QUESTS.npcVisible(G.scene, s.npcs[i].id)) out.push(s.npcs[i]);
  }
  return out;
}
function npcAt(mx, my){
  var ns = visibleNpcs();
  for (var i = ns.length - 1; i >= 0; i--){
    var n = ns[i], w = 16 * (n.s || 1), h = (n.kit ? 14 : 24) * (n.s || 1);
    if (mx >= n.x - w && mx <= n.x + w && my >= n.y - h && my <= n.y + 4) return n;
  }
  return null;
}
function hotspotAt(mx, my){
  var hs = SCENES[G.scene].hotspots;
  for (var i = hs.length - 1; i >= 0; i--){
    var h = hs[i];
    if (mx >= h.x && mx <= h.x + h.w && my >= h.y && my <= h.y + h.h) return h;
  }
  return null;
}
function playerScale(y){
  var s = SCENES[G.scene];
  var t = (y - s.horizon) / (200 - s.horizon);
  return 0.55 + 0.6 * Math.max(0, Math.min(1, t));
}

// ---- icon bar ---------------------------------------------------------------------
var BAR = [
  { id:'walk', x:8 },  { id:'look', x:36 }, { id:'talk', x:64 }, { id:'use', x:92 },
  { id:'item', x:120 }, { id:'inv', x:158 }, { id:'map', x:186 }, { id:'snd', x:214 }
];
function barVisible(){ return G.mode === 'play' && mouse.y < 24 && !DLG.active; }
function barButtonAt(mx, my){
  if (my > 22) return null;
  for (var i = 0; i < BAR.length; i++){
    if (mx >= BAR[i].x && mx <= BAR[i].x + 24) return BAR[i].id;
  }
  return null;
}

// ---- input ---------------------------------------------------------------------------
function canvasPos(e){
  var r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * 320, y: (e.clientY - r.top) / r.height * 200 };
}

canvas.addEventListener('mousemove', function(e){
  var p = canvasPos(e);
  mouse.x = p.x; mouse.y = p.y;
  DLG.hover(p.x, p.y);
});

canvas.addEventListener('contextmenu', function(e){
  e.preventDefault();
  if (G.mode === 'map'){ G.mode = 'play'; return; }
  if (G.mode === 'inv'){ closeInv(); return; }
  if (G.mode !== 'play' || DLG.active) return;
  var order = ['walk', 'look', 'talk', 'use'];
  G.verb = order[(order.indexOf(G.verb === 'item' ? 'use' : G.verb) + 1) % 4];
});

document.addEventListener('keydown', function(e){
  if (e.key === 'Tab') e.preventDefault();   // never let TAB steal focus
  if (G.mode === 'ending' && (e.key === 'r' || e.key === 'R')){
    localStorage.removeItem(SAVE_KEY); location.reload(); return;
  }
  if (G.mode === 'title') return;
  // number keys switch actions
  if (!DLG.active && (G.mode === 'play' || G.mode === 'inv' || G.mode === 'map')){
    if (e.key === '1'){ G.verb = 'walk'; G.mode = 'play'; }
    if (e.key === '2'){ G.verb = 'look'; G.mode = 'play'; }
    if (e.key === '3'){ G.verb = 'talk'; G.mode = 'play'; }
    if (e.key === '4'){ G.verb = 'use';  G.mode = 'play'; }
    if (e.key === '5'){
      if (G.activeItem){ G.verb = 'item'; G.mode = 'play'; }
      else DLG.toast('Pick an item from your backpack first! (TAB)');
    }
  }
  if (e.key === 'Tab') toggleInv();          // TAB opens the backpack
  if (e.key === 'm' || e.key === 'M') toggleMap();
  if (e.key === 'i' || e.key === 'I') toggleInv();
  if (e.key === 's' || e.key === 'S') SND.toggleMute();
  if (e.key === 'Escape'){ if (G.mode === 'map' || G.mode === 'inv') G.mode = 'play'; }
  if (e.key === ' ' || e.key === 'Enter'){ if (DLG.active) DLG.click(-1, -1); }
});

function toggleMap(){
  if (DLG.active) return;
  if (G.mode === 'map'){ G.mode = 'play'; return; }
  if (!G.flags.map){ DLG.toast('You don\'t know the territories yet...'); return; }
  if (G.mode === 'play') G.mode = 'map';
}
function toggleInv(){
  if (DLG.active) return;
  if (G.mode === 'inv'){ closeInv(); return; }
  if (G.mode === 'play'){ G.mode = 'inv'; G.invSelect = null; }
}
function closeInv(){ G.mode = 'play'; G.invSelect = null; }

canvas.addEventListener('mousedown', function(e){
  if (e.button !== 0) return;
  var p = canvasPos(e), mx = p.x, my = p.y;

  if (G.mode === 'title'){ titleClick(mx, my); return; }
  if (!SND.ready){ SND.init(); SND.playSong(SCENES[G.scene].music); }

  if (DLG.active){ DLG.click(mx, my); return; }
  if (G.mode === 'map'){ mapClick(mx, my); return; }
  if (G.mode === 'inv'){ invClick(mx, my); return; }
  if (G.mode === 'ending') return;
  if (G.mode !== 'play') return;

  // icon bar
  if (barVisible() && my < 24){
    var b = barButtonAt(mx, my);
    if (b === 'walk' || b === 'look' || b === 'talk' || b === 'use') G.verb = b;
    else if (b === 'item'){ if (G.activeItem) G.verb = 'item'; else DLG.toast('Pick an item from your backpack first! (TAB)'); }
    else if (b === 'inv') toggleInv();
    else if (b === 'map') toggleMap();
    else if (b === 'snd'){ SND.toggleMute(); DLG.toast(SND.muted ? 'Music off' : 'Music on'); }
    return;
  }

  var npc = npcAt(mx, my);
  var hot = npc ? null : hotspotAt(mx, my);

  // the pointer picks things up too — clicking a gatherable spot walks over and grabs it
  if (G.verb === 'walk' && hot && QUESTS.isPickup(hot.id)){
    var px2 = hot.x + hot.w / 2, py2 = Math.min(196, hot.y + hot.h + 6);
    var grab = function(){ QUESTS.useHand(hot.id); };
    var gdx = G.x - px2, gdy = G.y - py2;
    if (Math.sqrt(gdx * gdx + gdy * gdy) < 45){ G.walking = false; grab(); }
    else G.walkTo(px2 + (G.x < px2 ? -20 : 20), py2, grab);
    return;
  }

  if (G.verb === 'walk' || (!npc && !hot)){
    G.walkTo(mx, my, function(){
      // walked to a screen edge? open the map
      if (G.flags.map && (G.ty >= 193 || G.tx <= 10 || G.tx >= 310)) G.mode = 'map';
    });
    return;
  }

  // walk near the target, then act
  var targetX = npc ? npc.x : hot.x + hot.w / 2;
  var targetY = npc ? npc.y : Math.min(196, hot.y + hot.h + 6);
  var act = makeAction(G.verb, npc, hot);
  var dx = G.x - targetX, dy = G.y - targetY;
  if (Math.sqrt(dx * dx + dy * dy) < 45) { G.walking = false; act(); }
  else G.walkTo(targetX + (G.x < targetX ? -20 : 20), targetY, act);
});

function makeAction(verb, npc, hot){
  var id = npc ? npc.id : hot.id;
  return function(){
    if (verb === 'look') QUESTS.look(id, !!npc);
    else if (verb === 'talk'){
      if (npc){ G.dir = npc.x > G.x ? 'right' : 'left'; QUESTS.talk(id); }
      else DLG.say([N('It has nothing to say. It\'s a ' + hot.name + '.')]);
    }
    else if (verb === 'use'){
      if (npc){
        SND.meow();
        DLG.say([N('You give ' + CATS[id].name + ' a gentle scratch behind the ears. Maximum purring achieved.')]);
      } else if (!QUESTS.useHand(id)){
        DLG.say([N('You can\'t really do anything with that bare-handed.')]);
      }
    }
    else if (verb === 'item' && G.activeItem){
      QUESTS.useItem(G.activeItem, id);
    }
  };
}

// ---- title ------------------------------------------------------------------------
function titleClick(mx, my){
  SND.init();
  if (G.hasSave && my > 150 && my < 170 && mx > 170 && mx < 290){
    load();
    G.mode = 'play';
    SND.playSong(SCENES[G.scene].music);
    return;
  }
  if (my > 150 && my < 170 && mx > 30 && mx < 150){
    startIntro();
    return;
  }
  if (!G.hasSave){
    // click anywhere starts new game if no save
    titleClick(90, 160);
  }
}

// ---- intro cutscene: Bus 15, home from Henry Clay High School --------------------------
function startIntro(){
  localStorage.removeItem(SAVE_KEY);
  G.inventory = []; G.collars = 0; G.flags = {};
  G.mode = 'intro';
  G.introPhase = 0;
  SND.playSong('title');
  DLG.say([
    N('3:47 PM. The last bell at Henry Clay High School rang twenty minutes ago, and Bus 15 rumbles down the long road home.'),
    ME('Fifteen tomorrow... Mom is probably taping up streamers right now. I just wish this bus ride didn\'t take a hundred years.'),
    N('The bus is warm. The seat hums. The trees smear past the window like green water...'),
    { who: null, text: 'Her eyes drift closed. Just for a second. Just... for... a... second...',
      effect: function(){ G.introPhase = 1; SND.stopSong(); } },
    { who: null, text: 'Z z z z z z . . .' }
  ], function(){
    G.flags.intro = true;
    travelTo('fourtrees');
    SND.playSong('night');
    DLG.say([
      N('Scarlett wakes on soft grass, under four oak trees taller than her whole school. The air smells of moss and starlight. This is definitely NOT Bus 15.'),
      ME('Okay. Deep breaths. I fell asleep on the bus, and now there are four giant trees, a rock the size of a garage... and a cat. A golden cat that is GLOWING.'),
      N('The starlit golden tom sits by the Great Rock, watching you with patient amber eyes. Maybe you should TALK to him.'),
      N('(Press 3 for Talk, then click on the cat! Numbers switch actions: 1 Walk, 2 Look, 3 Talk, 4 Use — or move your mouse to the TOP of the screen. TAB opens your backpack.)')
    ]);
  });
}

// ---- map -----------------------------------------------------------------------------
function unlockedSpots(){
  var out = [];
  for (var i = 0; i < MAP_SPOTS.length; i++){
    var m = MAP_SPOTS[i];
    if (m.scene === 'skycamp' && G.collars < 12) continue;
    out.push(m);
  }
  return out;
}
function mapSpotAt(mx, my){
  var spots = unlockedSpots();
  for (var i = 0; i < spots.length; i++){
    var m = spots[i], dx = mx - m.x, dy = my - m.y;
    if (dx * dx + dy * dy < 90) return m;
  }
  return null;
}
function mapClick(mx, my){
  if (mx > 288 && my > 182){ G.mode = 'play'; return; }   // close button
  var m = mapSpotAt(mx, my);
  if (m){
    if (m.scene === G.scene){ G.mode = 'play'; return; }
    travelTo(m.scene);
    DLG.toast(m.label);
  }
}

// ---- inventory -----------------------------------------------------------------------
function invSlots(){
  var out = [];
  for (var i = 0; i < G.inventory.length; i++){
    out.push({ id: G.inventory[i], x: 56 + (i % 8) * 26, y: 66 + Math.floor(i / 8) * 26 });
  }
  return out;
}
function invClick(mx, my){
  if (mx > 238 && mx < 274 && my > 110 && my < 126){ closeInv(); return; }
  var slots = invSlots();
  for (var i = 0; i < slots.length; i++){
    var s = slots[i];
    if (mx >= s.x - 2 && mx <= s.x + 20 && my >= s.y - 2 && my <= s.y + 20){
      if (G.invSelect && G.invSelect !== s.id){
        var first = G.invSelect;
        closeInv();
        QUESTS.combine(first, s.id);
        return;
      }
      if (G.invSelect === s.id){
        // second click on same item: wield it
        G.activeItem = s.id; G.verb = 'item';
        closeInv();
        DLG.toast('Using: ' + ITEMS[s.id].name + ' — click it on something!', s.id);
        return;
      }
      G.invSelect = s.id;
      return;
    }
  }
  G.invSelect = null;
}

// ---- finale ceremony --------------------------------------------------------------------
var ceremonyCats = [
  { id:'firestar',   x:66,  y:158 }, { id:'leopardstar', x:112, y:166 },
  { id:'tallstar',   x:210, y:166 }, { id:'blackstar',   x:256, y:158 },
  { id:'leafstar',   x:132, y:176 }, { id:'lionheart',   x:160, y:118, s:1.2 }
];
function startFinale(){
  G.mode = 'ceremony';
  G.flags.ceremonyDone = true;
  save();
  G.x = 160; G.y = 190; G.dir = 'up'; G.walking = false;
  SND.playSong('birthday');
  fireflies = [];
  for (var i = 0; i < 15; i++){
    fireflies.push({ x: 40 + i * 16, y: 200 + i * 6, tx: 60 + (i % 5) * 50, ty: 40 + Math.floor(i / 5) * 22, on: false });
  }
  DLG.say([
    N('Starlight pours into the hollow at Fourtrees. Every clan has gathered — ThunderClan, RiverClan, WindClan, ShadowClan, and SkyClan, side by side, at peace.'),
    CAT('lionheart', 'Cats of all clans! The storm scattered fifteen collars — and a twoleg with a warrior\'s heart has carried every one of them home.'),
    CAT('firestar', 'She gathered herbs for our medicine cat, reached a kit\'s treasure from the old oak, and outwitted the boldest mouse in the forest.'),
    CAT('leopardstar', 'She hooked gold from our river, found a star for our kits, and made an elder warm again.'),
    CAT('tallstar', 'She fed our smuggest rabbit, cured our itchiest elder, and turned my clumsiest apprentice into a hunter.'),
    CAT('blackstar', 'She caught a frog with pink paws, walked into the snakes\' parlor, and carried light into the fox den. ShadowClan owes her thrice.'),
    CAT('leafstar', 'And she dug SkyClan\'s lost history out of our own gorge, and answered the Trial with her heart.'),
    CAT('lionheart', 'Scarlett of the Twolegplace: by the light of StarClan, we name you FRIEND OF ALL CLANS, now and for every season to come.'),
    N('Fifteen fireflies rise from the grass, one for each collar — one for each year of you.'),
    N('The clans yowl your name to the stars: SCAR-LETT! SCAR-LETT! SCAR-LETT!'),
    CAT('lionheart', 'The collars are home, and so my promise is kept. Close your eyes one more time, dear one. When you open them, Bus 15 will be pulling up to your street. The forest will always know your name.'),
    N('The starlight swells until it fills everything...')
  ], function(){ beginWakeUp(); });
}

// ---- the wake-up: Bus 15, the dark blue house, the family ---------------------------------
function beginWakeUp(){
  G.mode = 'ending';
  G.endPhase = 0;              // 0 = on the bus | 1 = home with the family | 2 = birthday card
  SND.stopSong();
  DLG.say([
    N('...beep. Beep. The hiss of brakes. Warm afternoon sun through a smudged window.'),
    N('"End of the line, hon!" calls the bus driver. Scarlett blinks awake in her old seat on Bus 15 — same backpack, same afternoon, the last school day before her birthday.'),
    ME('I\'m back! The SAME ride home... but I remember all of it. Every camp. Every collar. Every whisker.'),
    { who:null, text:'She grabs her backpack and hops down the bus steps — and there, on the lawn in front of the dark blue house, her whole family is waiting.',
      effect: function(){ G.endPhase = 1; SND.playSong('birthday'); } },
    { who:'dad', text:'There she is! Happy 15th birthday, kiddo! We heard the bus from the porch and everybody RAN.' },
    { who:'mom', text:'Happy birthday, sweetheart! Cake\'s on the table, candles are ready — all fifteen of them.' },
    { who:'hank', text:'Happy birthday, Scarlett! Also I called dibs on the corner piece. Drake Maye rules. Number 10 always gets the corner piece.' },
    { who:'ramona', text:'HAPPY BIRTHDAY SCARLETT!! I drew you FIFTEEN cats on your card! And one of them is GOLD!' },
    ME('...Fifteen cats. And one of them is gold. *smiles* Best. Birthday. Ever.'),
    N('And somewhere behind her — or maybe somewhere much, much farther away — a golden warrior purrs.')
  ], function(){ G.endPhase = 2; });
}

// ============================================================
// UPDATE
// ============================================================
function update(){
  tick++;
  DLG.update();
  titlePulse += 0.05;

  if (G.pendingReveal && !DLG.active){
    G.pendingReveal = false;
    DLG.say([
      CAT('lionheart', 'Scarlett... do you feel it? Twelve collars shine. Far to the north, the forest\'s last secret has opened in your mind-map — the gorge of SKYCLAN, the fifth clan. The final three collars wait there.'),
      N('SkyClan Camp has appeared on your map!')
    ]);
  }
  if (G.pendingReturn && !DLG.active){
    G.pendingReturn = false;
    DLG.say([
      CAT('lionheart', 'FIFTEEN! Oh, well done, dear one — I feel them all! Bring the collars home to me at Fourtrees... and I will send YOU home.'),
      N('Travel to Fourtrees (M) and TALK to Lionheart to finish your quest!')
    ]);
  }

  // walking
  if ((G.mode === 'play') && G.walking && !DLG.active){
    var dx = G.tx - G.x, dy = G.ty - G.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var speed = 1.5 * playerScale(G.y);
    if (dist <= speed){
      G.x = G.tx; G.y = G.ty; G.walking = false; G.step = 0;
      if (G.onArrive){ var cb = G.onArrive; G.onArrive = null; cb(); }
    } else {
      G.x += dx / dist * speed;
      G.y += dy / dist * speed;
      G.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (tick % 6 === 0){
        G.step = (G.step + 1) % 4;
        if (G.step === 0 || G.step === 2) SND.step();   // footfall on the contact frames
      }
    }
  }

  // fireflies drift towards their spots during ceremony/ending
  if (G.mode === 'ceremony' || G.mode === 'ending'){
    for (var i = 0; i < fireflies.length; i++){
      var f = fireflies[i];
      f.x += (f.tx - f.x) * 0.01 + Math.sin(tick * 0.05 + i) * 0.3;
      f.y += (f.ty - f.y) * 0.008 + Math.cos(tick * 0.04 + i * 2) * 0.2;
      if (Math.abs(f.y - f.ty) < 30) f.on = true;
    }
  }
}

// ============================================================
// DRAW
// ============================================================
function draw(){
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';

  if (G.mode === 'title'){ drawTitle(); drawPointer(); return; }
  if (G.mode === 'intro'){ drawIntro(); drawPointer(); return; }
  if (G.mode === 'map'){ drawMap(); drawPointer(); return; }
  if (G.mode === 'ending'){ drawEnding(); drawPointer(); return; }

  var sc = SCENES[G.scene];
  var artName = (G.mode === 'ceremony') ? 'ending' : sc.art;
  ctx.drawImage(ART.get(artName), 0, 0);

  // sparkles on available pickups
  if (G.mode === 'play'){
    var hs = sc.hotspots;
    for (var i = 0; i < hs.length; i++){
      var h = hs[i];
      var sparkle = QUESTS.isPickup(h.id);
      if (sparkle && (tick / 24 | 0) % 3 !== 2){
        var sx = h.x + h.w / 2 + Math.sin(tick * 0.1 + i) * 3, sy = h.y + h.h / 2;
        px(ctx, sx, sy, '#fff'); px(ctx, sx - 2, sy + 1, PAL.gold2); px(ctx, sx + 2, sy - 1, PAL.gold2);
      }
    }
  }

  // draw actors sorted by y (painter's order)
  var actors = [];
  if (G.mode === 'ceremony'){
    for (var c = 0; c < ceremonyCats.length; c++) actors.push({ npc: ceremonyCats[c], y: ceremonyCats[c].y });
  } else {
    var ns = visibleNpcs();
    for (var n = 0; n < ns.length; n++) actors.push({ npc: ns[n], y: ns[n].y });
    var deco = sc.deco || [];
    for (var d = 0; d < deco.length; d++) actors.push({ deco: deco[d], y: deco[d].y });
  }
  actors.push({ player: true, y: G.y });
  actors.sort(function(a, b){ return a.y - b.y; });

  for (var a = 0; a < actors.length; a++){
    var ac = actors[a];
    if (ac.player){
      drawScarlett(ctx, G.x, G.y, G.dir, G.walking ? 1 + G.step : 0, playerScale(G.y));
    } else if (ac.deco){
      rseed(ac.y);
      drawKit(ctx, ac.deco.x, ac.deco.y, CATS[ac.deco.spec], 0.55);
    } else {
      var np = ac.npc;
      rseed(np.x * 7 + 3);
      if (np.kit) drawKit(ctx, np.x, np.y, CATS[np.id], np.s || 0.65);
      else drawCat(ctx, np.x, np.y, CATS[np.id], tick / 20 + np.x, np.s || 1, np.flip);
    }
  }

  // ceremony fireflies
  if (G.mode === 'ceremony'){
    for (var ff = 0; ff < fireflies.length; ff++){
      var f = fireflies[ff];
      if (f.on || (tick / 10 | 0) % 2) px(ctx, f.x, f.y, f.on ? PAL.gold2 : '#8a9a5a');
    }
  }

  // HUD: collar count
  if (G.mode === 'play'){
    frect(ctx, 262, 2, 54, 14, 'rgba(20,14,8,0.75)');
    drawItem(ctx, 263, 1, 'collar');
    ctx.fillStyle = PAL.gold2;
    ctx.fillText(G.collars + ' / 15', 282, 5);
    frect(ctx, 2, 2, 12 + SCENES[G.scene].name.length * 4.9, 12, 'rgba(20,14,8,0.65)');
    ctx.fillStyle = '#e8dfc0';
    ctx.fillText(SCENES[G.scene].name, 7, 4);
  }

  // icon bar
  if (barVisible()) drawBar();

  // hover label
  if (G.mode === 'play' && !DLG.active && !barVisible()){
    var hn = npcAt(mouse.x, mouse.y), hh = hn ? null : hotspotAt(mouse.x, mouse.y);
    var label = hn ? CATS[hn.id].name : (hh ? hh.name : null);
    if (label){
      var lw = label.length * 4.9 + 6;
      var lx = Math.min(314 - lw, mouse.x + 8), ly = Math.min(190, mouse.y + 14);
      frect(ctx, lx, ly, lw, 11, 'rgba(20,14,8,0.8)');
      ctx.fillStyle = '#f4e8c0';
      ctx.fillText(label, lx + 3, ly + 2);
    }
  }

  if (G.mode === 'inv') drawInv();

  DLG.draw(ctx, tick);
  drawPointer();
}

function drawBar(){
  frect(ctx, 0, 0, 320, 24, '#c8bca0');
  frect(ctx, 0, 22, 320, 2, '#5a4a34');
  frect(ctx, 0, 0, 320, 1, '#efe6cc');
  var hov = barButtonAt(mouse.x, mouse.y);
  var KEYHINT = { walk:'1', look:'2', talk:'3', use:'4', item:'5', inv:'TAB', map:'M', snd:'S' };
  for (var i = 0; i < BAR.length; i++){
    var b = BAR[i];
    var active = (G.verb === b.id) || (b.id === 'item' && G.verb === 'item');
    frect(ctx, b.x, 2, 24, 18, active ? '#8a7a5a' : (hov === b.id ? '#e2d6b4' : '#b4a888'));
    frect(ctx, b.x, 2, 24, 1, '#f4ecd4'); frect(ctx, b.x, 19, 24, 1, '#6a5a44');
    // key hint in the corner
    ctx.font = '6px monospace';
    ctx.fillStyle = active ? '#f4ecd4' : '#6a5a44';
    ctx.fillText(KEYHINT[b.id], b.x + (KEYHINT[b.id].length > 1 ? 12 : 19), 3);
    ctx.font = '8px monospace';
    var cx = b.x + 6, cy = 5;
    if (b.id === 'walk') drawCursor(ctx, cx, cy, 'walk');
    else if (b.id === 'look') drawCursor(ctx, cx, cy + 2, 'look');
    else if (b.id === 'talk') drawCursor(ctx, cx, cy, 'talk');
    else if (b.id === 'use') drawCursor(ctx, cx + 2, cy - 3, 'use');
    else if (b.id === 'item'){
      if (G.activeItem) drawItem(ctx, b.x + 4, 3, G.activeItem);
      else { ctx.fillStyle = '#7a6a54'; ctx.fillText('?', b.x + 10, 6); }
    }
    else if (b.id === 'inv'){ // satchel
      frect(ctx, cx, cy + 3, 12, 9, '#8a5c2e'); frect(ctx, cx, cy + 3, 12, 3, '#6a4422');
      frect(ctx, cx + 4, cy + 1, 4, 3, '#6a4422');
    }
    else if (b.id === 'map'){ // little map
      frect(ctx, cx, cy + 2, 12, 10, '#e2d0a2');
      px(ctx, cx + 3, cy + 5, PAL.leaf2); px(ctx, cx + 8, cy + 7, PAL.water3); px(ctx, cx + 6, cy + 4, PAL.rock3);
    }
    else if (b.id === 'snd'){ // note
      frect(ctx, cx + 6, cy + 2, 2, 9, SND.muted ? '#8a7a64' : '#3a2a18');
      ell(ctx, cx + 5, cy + 11, 2.5, 2, SND.muted ? '#8a7a64' : '#3a2a18');
      frect(ctx, cx + 6, cy + 2, 5, 2, SND.muted ? '#8a7a64' : '#3a2a18');
      if (SND.muted){ ctx.strokeStyle = '#a83a2a'; ctx.beginPath(); ctx.moveTo(cx, cy + 12); ctx.lineTo(cx + 13, cy + 1); ctx.stroke(); }
    }
  }
}

function drawInv(){
  DLG.ornateFrame(ctx, 40, 40, 240, 106);
  ctx.fillStyle = '#3a2a18';
  ctx.font = 'bold 8px monospace';
  ctx.fillText("SCARLETT'S BACKPACK", 114, 46);
  ctx.font = '8px monospace';
  if (G.inventory.length === 0){
    ctx.fillStyle = '#7a6a54';
    ctx.fillText('(empty — go explore!)', 116, 90);
  }
  var slots = invSlots();
  for (var i = 0; i < slots.length; i++){
    var s = slots[i];
    frect(ctx, s.x - 2, s.y - 2, 21, 21, G.invSelect === s.id ? '#e8d089' : '#d8ccae');
    frect(ctx, s.x - 2, s.y - 2, 21, 1, '#8a7a5a'); frect(ctx, s.x - 2, s.y + 18, 21, 1, '#fff');
    drawItem(ctx, s.x, s.y, s.id);
  }
  ctx.fillStyle = '#5a4632';
  if (G.invSelect){
    ctx.font = 'bold 8px monospace';
    ctx.fillText(ITEMS[G.invSelect].name, 50, 114);
    ctx.font = '8px monospace';
    var desc = ITEMS[G.invSelect].desc;
    if (desc.length > 44){
      var cut = desc.lastIndexOf(' ', 44);
      ctx.fillText(desc.substring(0, cut), 50, 123);
      ctx.fillText(desc.substring(cut + 1), 50, 131);
    } else ctx.fillText(desc, 50, 123);
    ctx.fillStyle = '#8a6a3a';
    ctx.fillText('again = USE  •  other item = COMBINE', 50, 139);
  } else {
    ctx.fillText('Click an item to select it.', 50, 122);
  }
  frect(ctx, 240, 112, 32, 12, '#8a5c3a');
  ctx.fillStyle = '#f4e8c0'; ctx.fillText('CLOSE', 244, 114);
}

function drawMap(){
  ctx.drawImage(ART.get('map'), 0, 0);
  var spots = unlockedSpots();
  var hov = mapSpotAt(mouse.x, mouse.y);
  for (var i = 0; i < spots.length; i++){
    var m = spots[i];
    var here = m.scene === G.scene;
    // paw-print marker
    ell(ctx, m.x, m.y, 4.5, 4, here ? PAL.red : (hov === m ? PAL.gold : '#5a3a1e'));
    ell(ctx, m.x - 3, m.y - 4, 1.5, 1.5, here ? PAL.red : (hov === m ? PAL.gold : '#5a3a1e'));
    ell(ctx, m.x, m.y - 5, 1.5, 1.5, here ? PAL.red : (hov === m ? PAL.gold : '#5a3a1e'));
    ell(ctx, m.x + 3, m.y - 4, 1.5, 1.5, here ? PAL.red : (hov === m ? PAL.gold : '#5a3a1e'));
    if (m.scene === 'skycamp' && G.collars >= 12 && (tick / 15 | 0) % 2){
      px(ctx, m.x + 7, m.y - 6, '#fff'); px(ctx, m.x - 8, m.y + 2, PAL.gold2);
    }
  }
  if (hov){
    var lw = hov.label.length * 4.9 + 8;
    var lx = Math.max(4, Math.min(316 - lw, hov.x - lw / 2));
    frect(ctx, lx, hov.y + 8, lw, 12, 'rgba(30,20,10,0.85)');
    ctx.fillStyle = PAL.gold2;
    ctx.fillText(hov.label, lx + 4, hov.y + 10);
  }
  if (G.scene){
    frect(ctx, 8, 184, 116, 10, 'rgba(30,20,10,0.7)');
    ctx.fillStyle = '#e8dfc0';
    ctx.fillText('● red paw = you are here', 11, 185);
  }
  frect(ctx, 288, 182, 28, 12, '#8a5c3a');
  ctx.fillStyle = '#f4e8c0'; ctx.fillText('BACK', 291, 184);
}

function drawIntro(){
  if (G.introPhase === 0){
    ctx.drawImage(ART.get('bus'), 0, 0);
    // gentle bus sway
    var sway = Math.sin(tick * 0.08);
    if (sway > 0.6){ frect(ctx, 0, 0, 320, 1, 'rgba(0,0,0,0.15)'); }
  } else {
    // asleep — dark screen with drifting Z's
    frect(ctx, 0, 0, 320, 200, '#050508');
    ctx.fillStyle = '#4a5578';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('Z', 176 + Math.sin(tick * 0.05) * 4, 52 - (tick / 10 % 20));
    ctx.font = 'bold 10px monospace';
    ctx.fillText('z', 160 + Math.cos(tick * 0.06) * 3, 74 - (tick / 12 % 16));
    ctx.font = '8px monospace';
    ctx.fillText('z', 150 + Math.sin(tick * 0.07) * 3, 90 - (tick / 14 % 12));
    // faint stars gathering... something is coming
    if (tick % 3 === 0){ rseed(tick); px(ctx, rndi(20, 300), rndi(10, 110), '#2a3358'); }
  }
  DLG.draw(ctx, tick);
}

function drawTitle(){
  ctx.drawImage(ART.get('title'), 0, 0);
  var bob = Math.sin(titlePulse) * 2;
  ctx.textBaseline = 'top';
  ctx.font = 'bold 17px monospace';
  ctx.fillStyle = '#1a1026';
  ctx.fillText("SCARLETT'S QUEST", 57, 26 + bob);
  ctx.fillStyle = PAL.gold2;
  ctx.fillText("SCARLETT'S QUEST", 55, 24 + bob);
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#1a1026'; ctx.fillText('The Fifteen Collars', 105, 50 + bob);
  ctx.fillStyle = '#f4e8c0'; ctx.fillText('The Fifteen Collars', 104, 49 + bob);
  ctx.font = '8px monospace';
  ctx.fillStyle = '#d8c8e8';
  ctx.fillText('A point-and-click adventure in the world of the warrior cats', 12, 72);

  // buttons
  frect(ctx, 30, 150, 120, 20, '#3a2a52'); frect(ctx, 31, 151, 118, 18, '#6a4a86');
  ctx.fillStyle = PAL.gold2; ctx.font = 'bold 9px monospace';
  ctx.fillText('NEW GAME', 66, 156);
  if (G.hasSave){
    frect(ctx, 170, 150, 120, 20, '#3a2a52'); frect(ctx, 171, 151, 118, 18, '#6a4a86');
    ctx.fillText('CONTINUE', 206, 156);
  }
  ctx.font = '8px monospace';
  ctx.fillStyle = '#b4a4cc';
  if ((tick / 30 | 0) % 2) ctx.fillText(G.hasSave ? '' : '~ click to begin ~', 122, 178);
  ctx.fillText('for Scarlett, on her 15th birthday ♥', 88, 190);
}

function drawEnding(){
  if (G.endPhase === 0){
    ctx.drawImage(ART.get('bus'), 0, 0);
  } else {
    ctx.drawImage(ART.get('home'), 0, 0);
    drawScarlett(ctx, 246, 184, 'left', 0, 1.05);
  }
  if (G.endPhase === 2){
    var glow = (tick / 20 | 0) % 2;
    ctx.fillStyle = 'rgba(10,12,32,0.62)';
    ctx.fillRect(0, 0, 320, 70);
    ctx.textBaseline = 'top';
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#2a1a0e';
    ctx.fillText('HAPPY 15TH BIRTHDAY', 76, 8);
    ctx.fillStyle = glow ? PAL.gold2 : '#ffe89a';
    ctx.fillText('HAPPY 15TH BIRTHDAY', 74, 6);
    ctx.font = 'bold 17px monospace';
    ctx.fillStyle = '#2a1a0e'; ctx.fillText('SCARLETT!', 118, 26);
    ctx.fillStyle = glow ? '#fff' : PAL.gold2; ctx.fillText('SCARLETT!', 116, 24);
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#cdd8f0';
    ctx.fillText('★ FRIEND OF ALL CLANS ★', 96, 46);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#a8b4d4';
    ctx.fillText('15 collars • 5 clans • 1 legendary twoleg', 66, 58);
    // arc of 15 collars over the sky
    for (var c = 0; c < 15; c++){
      drawItem(ctx, 22 + c * 19, 72 + Math.sin((c / 14) * Math.PI) * -4, 'collar');
    }
    ctx.fillStyle = 'rgba(10,12,32,0.62)';
    ctx.fillRect(0, 187, 320, 13);
    ctx.fillStyle = '#cdd8f0';
    ctx.fillText('love, Dad ♥', 30, 189);
    ctx.fillStyle = '#8a96b8';
    ctx.fillText('(press R to play it all again)', 150, 189);
  }
  DLG.draw(ctx, tick);
}

function drawPointer(){
  if (G.mode === 'title' || G.mode === 'map' || G.mode === 'inv' || DLG.active || barVisible()){
    drawCursor(ctx, mouse.x, mouse.y, 'arrow');
    return;
  }
  if (G.mode === 'ending') return;
  drawCursor(ctx, mouse.x, mouse.y, G.verb, G.activeItem);
}

// ---- main loop --------------------------------------------------------------------------
function frame(){
  update();
  draw();
  requestAnimationFrame(frame);
}
frame();
