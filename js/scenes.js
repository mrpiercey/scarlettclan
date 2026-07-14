// ============================================================
// scenes.js — the cat cast, every scene's hotspots/NPCs/exits,
// and the travel-map locations.
// 6 places: Fourtrees (Lionheart, the guide) + 4 clan camps
// (3 collars each) + SkyClan's gorge (the final 3).
// Every camp holds ALL the items its own quests need.
// ============================================================

// ---- The cats ----------------------------------------------------------
var CATS = {
  lionheart:    { name:'Lionheart',    fur:'#d8a44e', belly:'#f0d8a0', stripes:'#b4802e', eye:'#c8a24a', starry:true,  bg:'#1c2440' },
  firestar:     { name:'Firestar',     fur:'#e07a2a', belly:'#f0b47a', stripes:'#c05a1a', eye:'#3aa04a', bg:'#4a3a1e' },
  cinderpelt:   { name:'Cinderpelt',   fur:'#8a8a96', belly:'#b0b0bc', eye:'#4a7ade', bg:'#3a3a4a' },
  mousefur:     { name:'Mousefur',     fur:'#8a6a4a', belly:'#a8895e', eye:'#c8a24a', bg:'#4a3a2a' },
  snowkit:      { name:'Snowkit',      fur:'#f0f0f4', belly:'#ffffff', eye:'#4a7ade', bg:'#5a7a9a' },
  sandstorm:    { name:'Sandstorm',    fur:'#e8c88a', belly:'#f4e2b4', stripes:'#d0a860', eye:'#3aa04a', bg:'#4a3a1e' },
  leopardstar:  { name:'Leopardstar',  fur:'#d8a83a', patch:'#a87a1e', eye:'#c8a24a', bg:'#4a4a2a' },
  mosspelt:     { name:'Mosspelt',     fur:'#b4713a', patch:'#4a3a3a', belly:'#e8dcc8', eye:'#4a7ade', bg:'#3a4a3a' },
  graypool:     { name:'Graypool',     fur:'#6e6e7c', belly:'#8e8e9c', eye:'#c8a24a', bg:'#3a4252' },
  tallstar:     { name:'Tallstar',     fur:'#2a2a30', patch:'#f0f0f0', belly:'#f0f0f0', eye:'#c8a24a', bg:'#4a5a3a' },
  morningflower:{ name:'Morningflower',fur:'#b4713a', patch:'#5a4a3a', eye:'#c8a24a', bg:'#5a5a2a' },
  barkface:     { name:'Barkface',     fur:'#7a5a38', belly:'#a08258', stripes:'#5c422a', eye:'#c8a24a', bg:'#4a4a2a' },
  gorsepaw:     { name:'Gorsepaw',     fur:'#8a8a94', belly:'#aaaab4', eye:'#3aa04a', bg:'#4a4a3a' },
  blackstar:    { name:'Blackstar',    fur:'#f0f0f0', patch:'#1e1e24', eye:'#c8a24a', bg:'#2a2436' },
  russetfur:    { name:'Russetfur',    fur:'#a8482a', belly:'#c8684a', eye:'#3aa04a', bg:'#2a2436' },
  littlecloud:  { name:'Littlecloud',  fur:'#8a6a42', stripes:'#6a4e2e', belly:'#b49a6e', eye:'#4a7ade', bg:'#2a3626' },
  smokekit:     { name:'Smokekit',     fur:'#5a5a66', belly:'#8a8a96', eye:'#c8a24a', bg:'#2a2436' },
  leafstar:     { name:'Leafstar',     fur:'#b4894e', patch:'#e8dcc0', stripes:'#8a6a36', eye:'#c8a24a', bg:'#8a5c2e' },
  echosong:     { name:'Echosong',     fur:'#c4ccd8', stripes:'#9aa4b4', belly:'#e8ecf0', eye:'#3aa04a', bg:'#4a6a5a' },
  sharpclaw:    { name:'Sharpclaw',    fur:'#b4502a', stripes:'#8a3a1e', belly:'#d0764a', eye:'#3aa04a', bg:'#8a5c2e' }
};

// ---- Scarlett's family (portraits for the ending) ------------------------
var FAMILY = {
  dad:    { name:'Dad',    skin:'#e8b48e', hair:'#4a3220', eye:'#3a6ade', bg:'#3a4a5e',
            cap:{ c:'#16233f', b:'#c8102e' }, top:'plaid',  topC:'#a83a2e', topC2:'#4a1e18' },
  mom:    { name:'Mom',    skin:'#eabc96', hair:'#b08b5e', eye:'#3aa04a', bg:'#4a5e3a',
            hairLong:true, top:'dress',  topC:'#2e7a3e', topC2:'#245c30' },
  hank:   { name:'Hank',   skin:'#eec09a', hair:'#c05a2a', eye:'#7a5230', bg:'#3a4a6e',
            freckles:true, top:'jersey', topC:'#1c2f52', topC2:'#c8102e', number:'10' },
  ramona: { name:'Ramona', skin:'#f0c8a4', hair:'#b08b5e', eye:'#3a6ade', bg:'#6e3a5e',
            hairLong:true, top:'tee',    topC:'#e88aa8', topC2:'#d0708e' }
};

// ---- Scenes ---------------------------------------------------------------
// hotspots: {id, x, y, w, h, name, look}  (pickups & uses handled in quests.js)
// npcs:     {id, x, y, s, flip}           (visibility rules in quests.js)
var SCENES = {

  fourtrees: {
    name:'Fourtrees', art:'fourtrees', music:'forest', horizon:120,
    spawn:{x:160, y:170},
    npcs:[ {id:'lionheart', x:200, y:150, s:1.15} ],
    hotspots:[
      {id:'greatrock', x:126, y:100, w:70, h:36, name:'the Great Rock',
        look:'A mighty boulder where clan leaders address the Gatherings under the full moon.'},
      {id:'mosspatch', x:44, y:170, w:34, h:18, name:'patch of moss',
        look:'Springy green moss carpets the oak roots. Every clan gathers here in peace.'},
      {id:'oaks', x:0, y:30, w:80, h:110, name:'great oaks',
        look:'Four enormous oaks, older than any clan. They seem to whisper overhead.'}
    ],
    edges:{ left:'rivercamp', top:'thundercamp', right:'shadowcamp' },
    exits:[]
  },

  thundercamp: {
    name:'ThunderClan Camp', art:'thundercamp', music:'forest', horizon:118,
    spawn:{x:160, y:180},
    npcs:[
      {id:'firestar', x:250, y:170, s:1.2},
      {id:'cinderpelt', x:96, y:164, s:1.1, flip:true},
      {id:'mousefur', x:150, y:184, s:1.05},
      {id:'snowkit', x:120, y:148, kit:true, s:0.7},
      {id:'sandstorm', x:204, y:156, s:1.1, flip:true}
    ],
    hotspots:[
      {id:'oldoak', x:28, y:26, w:58, h:112, name:'the old oak',
        look:'A towering oak shading the camp. Wait — something GLITTERS in the highest branches, far out of reach.'},
      {id:'freshkill', x:174, y:162, w:34, h:16, name:'fresh-kill pile',
        look:'The clan\'s food supply. It looks smaller than it should... something has been nibbling it.'},
      {id:'mousehole', x:228, y:170, w:18, h:12, name:'small hole',
        look:'A tiny burrow right next to the fresh-kill pile. Crumbs lead inside. Suspicious!'},
      {id:'highledge', x:250, y:98, w:66, h:44, name:'Highrock',
        look:'The great rock where Firestar calls clan meetings.'},
      {id:'branch', x:250, y:176, w:46, h:14, name:'fallen branch',
        look:'A long branch knocked down by the last storm. A warrior would drag this off for the dens — or for reaching things.'},
      {id:'mossbank', x:10, y:178, w:34, h:14, name:'mossy bank',
        look:'Thick, springy green moss. Cats gather it for bedding... and for plugging things.'},
      {id:'marigolds', x:112, y:184, w:42, h:14, name:'marigold patch',
        look:'Bright orange marigolds by the nursery. Their petals keep wounds from turning sour.'},
      {id:'nursery', x:98, y:118, w:44, h:22, name:'nursery',
        look:'The softest, safest den in camp, woven tight against wind and claw.'},
      {id:'warriorsden', x:24, y:136, w:44, h:24, name:"warriors' den",
        look:'A dome of brambles. Loud snoring comes from inside.'}
    ],
    edges:{ left:'windcamp', bottom:'fourtrees', right:'shadowcamp' },
    exits:[]
  },

  rivercamp: {
    name:'RiverClan Camp', art:'rivercamp', music:'river', horizon:114,
    spawn:{x:112, y:186},
    npcs:[
      {id:'leopardstar', x:86, y:152, s:1.2},
      {id:'mosspelt', x:140, y:170, s:1.1, flip:true},
      {id:'graypool', x:66, y:186, s:1.05}
    ],
    deco:[ {kit:true, x:152, y:172, spec:'smokekit'}, {kit:true, x:130, y:174, spec:'leopardstar'} ],
    hotspots:[
      {id:'river', x:232, y:104, w:88, h:92, name:'the river',
        look:'THE river — the great water that gives RiverClan its name, wrapped right around their island camp. Deep in the shallows something glints gold...'},
      {id:'reeds', x:210, y:140, w:34, h:52, name:'reeds',
        look:'Tall, tough river reeds — RiverClan weaves their dens and nests from these.'},
      {id:'feathers', x:170, y:120, w:28, h:16, name:'swan feathers',
        look:'A swan preened on this bank at dawn. The softest white feathers cling to the grass.'},
      {id:'driftwood', x:144, y:182, w:48, h:12, name:'driftwood branch',
        look:'A long, river-smoothed branch washed up on the bank. RiverClan cats hook all sorts of things out of the water with these.'},
      {id:'stones', x:78, y:172, w:42, h:18, name:'smooth stones',
        look:'Sun-warmed stepping stones. Between two of them is a dark little gap... does something sparkle under there?'},
      {id:'dens', x:38, y:118, w:112, h:30, name:'woven dens',
        look:'Dens woven from reeds and willow, cozy as baskets.'},
      {id:'nest', x:50, y:176, w:34, h:16, name:"elders' nest",
        look:'Graypool\'s nest has fallen apart. Loose reeds everywhere, and no soft lining at all.'}
    ],
    edges:{ top:'windcamp', right:'fourtrees' },
    exits:[]
  },

  windcamp: {
    name:'WindClan Camp', art:'windcamp', music:'wind', horizon:118,
    spawn:{x:160, y:180},
    npcs:[
      {id:'tallstar', x:140, y:152, s:1.2},
      {id:'morningflower', x:66, y:172, s:1.1},
      {id:'barkface', x:200, y:168, s:1.05, flip:true},
      {id:'gorsepaw', x:252, y:186, s:1.0}
    ],
    hotspots:[
      {id:'heather', x:26, y:126, w:52, h:22, name:'heather in bloom',
        look:'Purple heather nodding in the endless moor wind. It smells like honey and summer.'},
      {id:'clover', x:98, y:182, w:46, h:14, name:'sweet clover',
        look:'A patch of sweet white clover. Rabbits would hop over their own ears for this.'},
      {id:'herbstore', x:188, y:138, w:30, h:18, name:"Barkface's herb store",
        look:'A gorse nook packed with dried herbs, seeds, and folded leaves. The medicine cat\'s whole pharmacy.'},
      {id:'mossrock', x:28, y:184, w:28, h:14, name:'mossy boulder',
        look:'A lone boulder wearing a coat of springy moss — exactly the stuff kits roll into practice moss-balls.'},
      {id:'warren', x:270, y:164, w:48, h:30, name:'rabbit warren',
        look:'Fresh diggings! Deep in the dark of the burrow, gold glints around a rabbit-shaped shadow.'},
      {id:'campdip', x:110, y:140, w:104, h:34, name:'camp hollow',
        look:'WindClan sleeps under the open sky, in a dip sheltered from the wind.'}
    ],
    edges:{ bottom:'rivercamp', right:'thundercamp', top:'skycamp' },
    exits:[]
  },

  shadowcamp: {
    name:'ShadowClan Camp', art:'shadowcamp', music:'shadow', horizon:116,
    spawn:{x:160, y:182},
    npcs:[
      {id:'blackstar', x:160, y:156, s:1.2},
      {id:'russetfur', x:96, y:170, s:1.1, flip:true},
      {id:'littlecloud', x:200, y:188, s:1.05},
      {id:'smokekit', x:186, y:184, kit:true, s:0.7}
    ],
    hotspots:[
      {id:'pond', x:36, y:164, w:62, h:20, name:'frog pond',
        look:'Lily pads bob on the peaty water at the camp\'s edge. Fat frogs croak smugly, just out of reach... or are they?'},
      {id:'snakerocks', x:236, y:120, w:84, h:52, name:'Snakerocks',
        look:'Sun-warmed boulders riddled with cracks. Deep inside, glow-moss shimmers — and something HISSES.'},
      {id:'foxden', x:152, y:114, w:40, h:24, name:'old fox den',
        look:'A pitch-black tunnel under twisted roots. Foxes left it seasons ago... but was that a tiny sneeze from inside?'},
      {id:'shadowdens', x:44, y:126, w:44, h:24, name:'bramble dens',
        look:'Dens woven into thorn bushes. Yellow eyes watch you from the shadows inside.'},
      {id:'mushrooms', x:22, y:142, w:20, h:16, name:'glowing mushrooms',
        look:'Pale green mushrooms that glow faintly. Pretty... and probably poisonous.'}
    ],
    edges:{ left:'fourtrees', top:'skycamp' },
    exits:[]
  },

  skycamp: {
    name:'SkyClan Camp', art:'skycamp', music:'sky', horizon:142,
    spawn:{x:160, y:184},
    npcs:[
      {id:'leafstar', x:160, y:158, s:1.2},
      {id:'echosong', x:106, y:180, s:1.1},
      {id:'sharpclaw', x:202, y:182, s:1.1, flip:true}
    ],
    hotspots:[
      {id:'rockpile', x:138, y:110, w:46, h:28, name:'the Rockpile',
        look:'A tumble of warm sandstone where Leafstar speaks to her young clan.'},
      {id:'beehive', x:24, y:78, w:26, h:22, name:'wild beehive',
        look:'Wild bees nest in a crack of the gorge wall, dripping golden honey. The hum sounds... unfriendly.'},
      {id:'springmoss', x:224, y:174, w:26, h:14, name:'spring-soaked moss',
        look:'A cold spring bubbles from the rock here, and the moss around it is drenched with icy water.'},
      {id:'digspot', x:140, y:184, w:28, h:12, name:'patch of turned earth',
        look:'The sandy earth here looks different from the rest of the gorge floor — older, softer, like something was buried long ago.'},
      {id:'halfden', x:192, y:154, w:36, h:24, name:'half-built den',
        look:'Sticks lean together hopefully. SkyClan is still rebuilding, whisker by whisker.'},
      {id:'gorgecaves', x:250, y:88, w:60, h:50, name:'cliff caves',
        look:'Dens dug into the gorge walls, reached by leaps no other clan could make.'}
    ],
    edges:{ bottom:'shadowcamp', left:'windcamp' },
    exits:[]
  }
};

// ---- Travel map locations ---------------------------------------------------
var MAP_SPOTS = [
  { scene:'fourtrees',  x:150, y:134, label:'Fourtrees' },
  { scene:'thundercamp',x:180, y:112, label:'ThunderClan Camp' },
  { scene:'rivercamp',  x:62,  y:158, label:'RiverClan Camp' },
  { scene:'windcamp',   x:74,  y:84,  label:'WindClan Camp' },
  { scene:'shadowcamp', x:260, y:112, label:'ShadowClan Camp' },
  { scene:'skycamp',    x:250, y:52,  label:'SkyClan Camp' }
];
