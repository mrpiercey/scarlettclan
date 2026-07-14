// ============================================================
// quests.js — items, the 15 collar quests, all dialogue.
// Uses game.js globals: G, addItem, removeItem, hasItem,
// gainCollar, travelTo, startFinale.
// Every camp holds all the items its own collars need —
// nothing has to be carried between worlds.
// ============================================================

var ITEMS = {
  // ThunderClan
  marigold:      { name:'Marigold Petals',  desc:'Bright orange petals that keep wounds clean.' },
  stick:         { name:'Fallen Branch',    desc:'A long, storm-fallen oak branch. Good for reaching things.' },
  moss:          { name:'Moss',             desc:'Springy green moss. Could plug a small hole nicely.' },
  // RiverClan
  driftwood:     { name:'Driftwood Branch', desc:'River-smoothed and hooked at one end. Perfect for fishing things out.' },
  shinystone:    { name:'Shiny Stone',      desc:'A blue stone that glitters like a trapped star.' },
  reeds:         { name:'River Reeds',      desc:'Tough, bendy reeds for weaving nests.' },
  feather:       { name:'Swan Feathers',    desc:'The softest white feathers a nest ever dreamed of.' },
  // WindClan
  clover:        { name:'Sweet Clover',     desc:'Sweet white clover. Rabbits find it completely irresistible.' },
  bileleaf:      { name:'Mouse-Bile Leaf',  desc:'A folded leaf of mouse bile. Do NOT sniff it. Seriously.' },
  mossball:      { name:'Moss-Ball',        desc:'A tightly rolled ball of moss — the classic hunting-practice toy.' },
  // ShadowClan
  frog:          { name:'Fat Frog',         desc:'A very fat, very unimpressed frog.' },
  snakeherb:     { name:'Snake-Charm Herb', desc:'Littlecloud\'s pungent herb. Snakes hate the smell.' },
  glowmoss:      { name:'Glow-Moss',        desc:'Moss that glows soft green, like bottled moonlight.' },
  // SkyClan
  wetmoss:       { name:'Soaked Moss',      desc:'Moss dripping with icy spring water.' },
  honey:         { name:'Honeycomb',        desc:'A golden chunk of honeycomb. Try not to eat it all.' },
  ancestorcollar:{ name:"Ancestors' Collar",desc:'An ancient collar, warm to the touch. It hums faintly.' }
};

// dialogue step shorthands
function ME(t){ return { who:'scarlett', text:t }; }
function N(t){ return { who:null, text:t }; }
function CAT(id, t){ return { who:id, text:t }; }

var QUESTS = {

  // ---- who is visible where --------------------------------------------
  npcVisible: function(sceneId, npcId){
    var f = G.flags;
    if (npcId === 'smokekit') return !!f.q12;   // hiding in the fox den until rescued
    return true;
  },

  // ---- LOOK ---------------------------------------------------------------
  look: function(target, isNpc){
    if (isNpc){
      var looks = {
        lionheart:'A great golden tabby tom with fur full of starlight. His amber eyes are warm as sunrise.',
        firestar:'A flame-colored tom with bright green eyes. Every hair says LEADER.',
        cinderpelt:'ThunderClan\'s medicine cat. Kind eyes, gray fur dusted with herb pollen.',
        mousefur:'A small, wiry elder with strong opinions about mice and everything else.',
        snowkit:'A snow-white kit, sniffling. His blue eyes are glued to the top of the old oak.',
        sandstorm:'A pale ginger she-cat doing battle-training stretches. Very cool. Very intimidating.',
        leopardstar:'RiverClan\'s leader, golden and spotted like sun through leaves.',
        mosspelt:'A tortoiseshell queen with two roly-poly kits climbing all over her.',
        graypool:'A gray elder curled in a sadly flattened nest, pretending not to shiver.',
        tallstar:'The black-and-white leader of WindClan, long-legged and long-sighted.',
        morningflower:'A tortoiseshell elder scratching at her shoulder with great dignity.',
        barkface:'WindClan\'s medicine cat, brown as moor earth, smelling of a hundred herbs.',
        gorsepaw:'A young apprentice crouched in a wobbly hunting stance, tail lashing with frustration.',
        blackstar:'ShadowClan\'s leader — huge, white, black-pawed, and unreadable.',
        russetfur:'The dark ginger deputy. She is watching you like you are a very large mouse.',
        littlecloud:'ShadowClan\'s small medicine cat, half-buried in herb bundles.',
        smokekit:'A small gray kit, freshly rescued and extremely proud of himself.',
        leafstar:'SkyClan\'s leader, brown-and-cream, with kind, tired amber eyes.',
        echosong:'A silver tabby medicine cat. Stars seem to swim in her green gaze.',
        sharpclaw:'A big ginger tom hauling sticks twice his size. The clan\'s master builder.'
      };
      DLG.say([N(looks[target] || 'A cat of the clans.')]);
      return;
    }
    // hotspots — check quest-state overrides first
    var f = G.flags, t = null;
    if (target === 'oldoak' && f.q2) t = 'The old oak. The highest branches are bare now — Snowkit\'s treasure is safely down.';
    if (target === 'mousehole' && f.q3) t = 'The hole is plugged tight with moss. Mousefur ate like a queen tonight.';
    if (target === 'snakerocks' && !f.snakecharmed) t = SCENES.shadowcamp.hotspots[1].look;
    if (target === 'herbstore' && f.tickAsked && !f.took_bileleaf)
      t = 'Barkface\'s herb store. Right at the front sits the folded mouse-bile leaf he set out for Morningflower.';
    if (target === 'digspot' && f.skyAsked && !f.took_ancestorcollar)
      t = 'Freshly softened earth below the cliff caves... exactly where Leafstar said the ancestors buried something!';
    if (target === 'foxden' && f.q12) t = 'The old fox den, empty now. Smokekit\'s tiny pawprints lead straight back to the nursery.';
    if (t){ DLG.say([N(t)]); return; }
    for (var s in SCENES){
      var hs = SCENES[s].hotspots;
      for (var i = 0; i < hs.length; i++) if (hs[i].id === target){ DLG.say([N(hs[i].look)]); return; }
    }
    DLG.say([N('Nothing special about that.')]);
  },

  // ---- HAND / pickups -------------------------------------------------------
  pickups: {
    marigolds:'marigold', mossbank:'moss', branch:'stick',
    reeds:'reeds', feathers:'feather', driftwood:'driftwood',
    clover:'clover', mossrock:'mossball',
    springmoss:'wetmoss'
  },

  // is this spot currently gatherable? (drives sparkles + pointer pickups)
  isPickup: function(id){
    var f = G.flags;
    var itm = this.pickups[id];
    if (itm) return !f['took_' + itm];
    if (id === 'stones') return !f.took_shinystone;
    if (id === 'pond') return !f.took_frog;
    if (id === 'herbstore') return !!f.tickAsked && !f.took_bileleaf;
    if (id === 'digspot') return !!f.skyAsked && !f.took_ancestorcollar;
    if (id === 'snakerocks') return !!f.snakecharmed && !f.took_glowmoss;
    return false;
  },

  useHand: function(target){
    var f = G.flags;
    var itm = this.pickups[target];
    if (itm){
      if (f['took_' + itm]){ DLG.say([N('You already gathered what you need from there.')]); return true; }
      f['took_' + itm] = true;
      addItem(itm);
      var lines = {
        marigold:'You gather a pawful — er, handful — of marigold petals.',
        moss:'You peel up a generous armful of springy moss.',
        stick:'You heft the storm-fallen branch. Excellent reach. Wizard-staff potential.',
        reeds:'You cut an armful of tough green reeds.',
        feather:'You collect the softest swan feathers from the bank.',
        driftwood:'You pick up the driftwood branch. Smooth as a river stone, with a handy hook at one end.',
        clover:'You pick a sweet-smelling bundle of clover. Your fingers smell like rabbit heaven.',
        mossball:'You peel moss off the boulder and roll it tight, the way the queens do. One regulation moss-ball!',
        wetmoss:'You scoop up moss drenched in icy spring water. Brr.'
      };
      DLG.say([N(lines[itm] || 'Got it!')]);
      return true;
    }
    if (target === 'stones'){
      if (f.took_shinystone){ DLG.say([N('Nothing under the stones now but a very startled minnow.')]); return true; }
      f.took_shinystone = true;
      addItem('shinystone');
      DLG.say([N('You reach into the cold gap between the stepping stones... got it! A stone that glitters like a star.')]);
      return true;
    }
    if (target === 'pond'){
      if (f.took_frog){ DLG.say([N('The remaining frogs have unionized. No further frogs will be caught today.')]); return true; }
      f.took_frog = true;
      addItem('frog');
      DLG.say([
        N('You crouch... wait... and POUNCE like a warrior!'),
        ME('Gotcha! Ribbit all you want, you\'re coming with me.'),
        N('You caught a fat frog! It looks deeply offended.'),
        ME('All this hunting is making me hungry. What I would GIVE for a bag of Takis right now. The frog does not count. Sorry, frog.')
      ]);
      return true;
    }
    if (target === 'herbstore'){
      if (!f.tickAsked){
        DLG.say([N('Barkface\'s herb store. Best not to paw through a medicine cat\'s supplies without a reason — ask around camp first.')]);
      } else if (!f.took_bileleaf){
        f.took_bileleaf = true;
        addItem('bileleaf');
        DLG.say([
          N('You take the folded mouse-bile leaf Barkface set out. You hold it VERY far from your nose.'),
          ME('This store has EVERYTHING. It\'s like Wilson\'s Grocery in here... if Wilson\'s had a bile aisle, Mom might finally stop spending half her paycheck there.')
        ]);
      } else DLG.say([N('One bile leaf is plenty. More than plenty.')]);
      return true;
    }
    if (target === 'digspot'){
      if (f.skyAsked && !f.took_ancestorcollar){
        f.took_ancestorcollar = true;
        addItem('ancestorcollar');
        DLG.say([N('You dig into the soft sandy earth... and there it is: an ancient collar, humming with warmth. Buried by SkyClan\'s ancestors, right here in their own gorge.')]);
      } else DLG.say([N('You scrape at the sand. Sand happens.')]);
      return true;
    }
    if (target === 'snakerocks'){
      if (!f.snakecharmed){
        SND.err();
        DLG.say([N('A long HISSSS slides out of the crevice. Every hair on your neck stands up. You back away — you need something to keep the snakes off first.')]);
      } else if (!f.took_glowmoss){
        f.took_glowmoss = true;
        addItem('glowmoss');
        DLG.say([N('With the herb\'s sharp smell keeping the snakes deep in their cracks, you reach in and gather the glow-moss. It shines like bottled moonlight!')]);
      } else DLG.say([N('You have plenty of glow-moss already.')]);
      return true;
    }
    if (target === 'warren'){
      DLG.say([N('You reach into the burrow. The rabbit thumps mockingly from somewhere deep below. You need to lure it out.')]);
      return true;
    }
    if (target === 'river'){
      DLG.say([N('The gold glint is far out in the deep, cold current. You need something long to hook it with.')]);
      return true;
    }
    if (target === 'beehive'){
      SND.err();
      DLG.say([N('You take one step toward the hive. Five hundred bees turn to look at you at the same time. You take one step back.')]);
      return true;
    }
    if (target === 'foxden'){
      DLG.say([N('You lean into the tunnel. It\'s blacker than a badger\'s dreams in there — anything could be hiding. You need a light.')]);
      return true;
    }
    return false;
  },

  // ---- USE ITEM on target -----------------------------------------------------
  useItem: function(item, target){
    var f = G.flags;

    // giving nest materials to Graypool = using them on her nest
    if ((item === 'reeds' || item === 'feather') && target === 'graypool') target = 'nest';

    // --- ThunderClan ---
    if (item === 'marigold' && target === 'cinderpelt'){
      removeItem('marigold'); f.q1 = true;
      DLG.say([
        CAT('cinderpelt', 'Marigold! Oh, perfectly picked, too. Rosekit\'s pad will heal clean now.'),
        CAT('cinderpelt', 'StarClan said a twoleg would come to help the clans. I didn\'t believe it — I do now. This is one of the fifteen. Take it, Scarlett.'),
        N('Cinderpelt digs into her herb store and drags out a gleaming collar!')
      ], function(){ gainCollar('ThunderClan'); });
      return true;
    }
    if (item === 'stick' && target === 'oldoak'){
      if (f.q2){ DLG.say([N('Nothing else glitters up there. The oak would like you to stop poking it.')]); return true; }
      f.q2 = true;
      DLG.say([
        N('You stretch the long branch up, up, up... tap... tap... GOT IT!'),
        N('The glittering thing tumbles down into the sand. It\'s a collar — one of the fifteen! Snowkit is going to be thrilled.')
      ], function(){ gainCollar('ThunderClan'); });
      return true;
    }
    if (item === 'moss' && target === 'mousehole'){
      removeItem('moss'); f.q3 = true;
      DLG.say([
        N('You stuff the moss deep into the hole and pack it tight.'),
        N('A furious squeak — the mouse pops out the ONLY other exit, straight into Mousefur\'s waiting paws.'),
        CAT('mousefur', 'HA! Forty seasons I\'ve hunted, and that\'s the fattest thief I ever caught. You\'ve got warrior wits, twoleg. Here — the elders kept this one safe. It\'s yours.')
      ], function(){ gainCollar('ThunderClan'); });
      return true;
    }

    // --- RiverClan ---
    if (item === 'driftwood' && target === 'river'){
      if (f.q4){ DLG.say([N('You fish around a while just for fun. The minnows are not impressed.')]); return true; }
      removeItem('driftwood'); f.q4 = true;
      DLG.say([
        N('You reach the hooked driftwood out into the current... it snags! You pull, slow and steady...'),
        N('Up from the green water comes a collar, dripping and gleaming gold!')
      ], function(){ gainCollar('RiverClan'); });
      return true;
    }
    if (item === 'shinystone' && target === 'mosspelt'){
      removeItem('shinystone'); f.q5 = true;
      DLG.say([
        CAT('mosspelt', 'A star-stone! Kits — KITS! Look what the twoleg fished out from under the stepping stones!'),
        N('The kits tumble over each other squealing. Mosspelt purrs so hard she vibrates.'),
        CAT('mosspelt', 'Leopardstar told me to judge your heart. Consider it judged. This collar washed into my nest seasons ago — it was waiting for you.')
      ], function(){ gainCollar('RiverClan'); });
      return true;
    }
    if (item === 'reeds' && target === 'nest'){
      removeItem('reeds'); f.nestReeds = true;
      if (f.nestFeather) return this._finishNest();
      DLG.say([N('You weave the reeds through the old nest frame, the way you\'ve seen the dens woven. Sturdy! Now it just needs something soft for lining.')]);
      return true;
    }
    if (item === 'feather' && target === 'nest'){
      removeItem('feather'); f.nestFeather = true;
      if (f.nestReeds) return this._finishNest();
      DLG.say([N('You tuck the feathers in a pile. Soft — but the nest frame itself is still falling apart. It needs fresh reeds woven in.')]);
      return true;
    }

    // --- WindClan ---
    if (item === 'clover' && target === 'warren'){
      if (f.q7){ DLG.say([N('The rabbit is gone — off telling every burrow about the clover miracle.')]); return true; }
      removeItem('clover'); f.q7 = true;
      DLG.say([
        N('You lay the sweet clover by the burrow and step back...'),
        N('WHOOSH — a rabbit rockets out, snatches the clover, and vanishes over the hill. And there, kicked out of the burrow: a collar, shining in the dug earth!')
      ], function(){ gainCollar('WindClan'); });
      return true;
    }
    if (item === 'bileleaf' && target === 'morningflower'){
      removeItem('bileleaf'); f.q8 = true;
      DLG.say([
        CAT('morningflower', 'Ohhh, that\'s the stuff. That tick has been living rent-free on my shoulder for a MOON.'),
        CAT('morningflower', 'You dabbed mouse bile for an elder\'s itch without a single complaint. That\'s the kind of deed the fifteen were left for. Here, young one.')
      ], function(){ gainCollar('WindClan'); });
      return true;
    }
    if (item === 'mossball' && target === 'gorsepaw'){
      if (f.q9){ DLG.say([CAT('gorsepaw', 'I\'ve caught THREE rabbits since this morning. I\'m basically a legend now.')]); return true; }
      removeItem('mossball'); f.q9 = true;
      DLG.say([
        CAT('gorsepaw', 'A moss-ball? I\'m not a KIT, I\'m an appren— ...okay, one game.'),
        N('You roll the moss-ball across the grass. Gorsepaw stalks... drops low... waits... and POUNCES — a perfect, silent kill-strike!'),
        CAT('gorsepaw', 'THAT\'S what I\'ve been doing wrong — I was rushing the pounce! Watch this!'),
        N('Gorsepaw streaks off across the moor... and comes trotting back with his very first rabbit, tail higher than a flag.'),
        ME('You could say his hunting career really... took off with a POUNCE. ...I\'ll see myself out.'),
        CAT('tallstar', 'His first catch, and the whole clan saw it. You trained an apprentice the way a mentor dreams of, Scarlett. WindClan runs fast and remembers long — this is yours.')
      ], function(){ gainCollar('WindClan'); });
      return true;
    }

    // --- ShadowClan ---
    if (item === 'frog' && target === 'russetfur'){
      removeItem('frog'); f.q10 = true;
      DLG.say([
        CAT('russetfur', '...You caught this yourself? In OUR pond? With those flat pink paws?'),
        ME('Pounced like a warrior. The frog will confirm it.'),
        CAT('russetfur', 'Hmph. Then you hunt for ShadowClan, and ShadowClan pays its debts. Take the collar. Tell no one I smiled.'),
        N('Russetfur absolutely does not smile. Except she does, a little.')
      ], function(){ gainCollar('ShadowClan'); });
      return true;
    }
    if (item === 'snakeherb' && target === 'snakerocks'){
      if (f.snakecharmed){ DLG.say([N('The rocks already reek of the herb. The snakes are sulking somewhere deep.')]); return true; }
      removeItem('snakeherb'); f.snakecharmed = true;
      DLG.say([N('You crush the herb over the rocks. An outraged hiss fades away, deeper and deeper, until it\'s gone. The crevice with the glow-moss is safe to reach into now.')]);
      return true;
    }
    if (item === 'glowmoss' && target === 'blackstar'){
      if (f.q11){ DLG.say([CAT('blackstar', 'The elders\' den glows like a green star. They are insufferably pleased.')]); return true; }
      f.q11 = true; // keeps the glow-moss — there's plenty
      DLG.say([
        CAT('blackstar', 'Glow-moss from Snakerocks itself. Our elders\' den has been dark as a badger hole all winter.'),
        CAT('blackstar', 'You walked into the snakes\' own parlor for cats who hiss at you. ShadowClan sees. ShadowClan remembers. The first of our collars is yours.'),
        N('There\'s plenty of glow-moss left in your arms.')
      ], function(){ gainCollar('ShadowClan'); });
      return true;
    }
    if (item === 'glowmoss' && target === 'foxden'){
      if (f.q12){ DLG.say([N('Nothing in the fox den now but the smell of old fox.')]); return true; }
      f.q12 = true;
      DLG.say([
        N('You hold the glow-moss into the dark of the fox den. Two huge amber eyes blink back at you.'),
        CAT('smokekit', '...Are you a StarClan twoleg? You\'re all GLOWY.'),
        ME('Close enough. Your whole clan is looking for you, buddy. Let\'s get you home.'),
        N('Smokekit rides back across camp on your shoulder like a tiny gray king. His mother weeps into your sleeve, and Blackstar himself brings out the second collar.'),
        CAT('blackstar', 'ShadowClan pays its debts. Both of them.')
      ], function(){ gainCollar('ShadowClan'); });
      return true;
    }

    // --- SkyClan ---
    if (item === 'ancestorcollar' && target === 'leafstar'){
      removeItem('ancestorcollar'); f.q13 = true;
      DLG.say([
        CAT('leafstar', 'The lost collar of Cloudstar\'s own kin... buried below the cliff caves all these seasons, and none of us could smell it out.'),
        ME('It was humming. Like it WANTED to be found.'),
        CAT('leafstar', 'Then it was waiting for you, Scarlett. SkyClan\'s history, home at last. It counts among the fifteen — carry it with our blessing.')
      ], function(){ gainCollar('SkyClan'); });
      return true;
    }
    if (item === 'wetmoss' && target === 'beehive'){
      if (f.gotHoney){ DLG.say([N('The bees have re-armed. One raid per twoleg, please.')]); return true; }
      removeItem('wetmoss'); f.gotHoney = true;
      addItem('honey');
      DLG.say([
        N('You press the icy soaked moss against the hive. The angry hum softens... softens... to a sleepy drone.'),
        N('Working quickly, you break off a golden chunk of honeycomb. The bees will never even know.')
      ]);
      return true;
    }
    if (item === 'honey' && target === 'sharpclaw'){
      removeItem('honey'); f.q14 = true;
      DLG.say([
        CAT('sharpclaw', 'HONEY? From the gorge hive? The one that chased Petalnose into the pool?'),
        ME('The bees and I reached an understanding. The understanding was cold moss. Swarm out today, isn\'t it? ...Sorry. That one\'s my dad\'s. He\'d be so proud right now.'),
        CAT('sharpclaw', 'Ha! With this, the whole clan works till moonhigh — honey for every builder! You just rebuilt half a camp, twoleg. This collar was dug out of our cliff. It\'s yours.')
      ], function(){ gainCollar('SkyClan'); });
      return true;
    }

    // near-miss hints
    if (item === 'stick' && target === 'river'){
      DLG.say([N('The oak branch is sturdy but dead straight — the collar slips right off. Something with a hooked end would work better... the river itself probably carves those.')]);
      return true;
    }
    SND.err();
    DLG.say([N('That doesn\'t seem to help here.')]);
    return true;
  },

  _finishNest: function(){
    G.flags.q6 = true;
    DLG.say([
      N('Reeds woven tight, swan feathers tucked deep — the nest looks better than new.'),
      CAT('graypool', 'Oh... OH. Young one, I haven\'t had a nest this fine since I was a queen in the nursery.'),
      CAT('graypool', 'I\'ve kept something at the bottom of my old nest for many seasons. An elder knows when it\'s time to pass things on. Take it, with RiverClan\'s thanks.')
    ], function(){ gainCollar('RiverClan'); });
    return true;
  },

  // ---- inventory combining ---------------------------------------------------
  combine: function(a, b){
    SND.err();
    DLG.say([N('Those don\'t go together. Everything you need is usually found close to where it\'s needed.')]);
    return true;
  },

  // ---- TALK ---------------------------------------------------------------
  talk: function(id){
    var f = G.flags;

    // ---------- Lionheart: intro + hints + the way home ----------
    if (id === 'lionheart'){
      if (!f.map){
        f.map = true;
        SND.dingFile();
        DLG.say([
          N('The starlit golden cat rises and bows, stars dripping from his fur like dew.'),
          CAT('lionheart', 'Peace, Scarlett of Henry Clay. You are safe. You have slept your way between worlds — this is Fourtrees, heart of the forest of the warrior clans.'),
          ME('The bus! My stop! My mom is going to lose her MIND—'),
          CAT('lionheart', 'Time runs differently here, little one — not one heartbeat of your ride will be missed. I am Lionheart, once of ThunderClan, now of StarClan. It was I who called you off that bus, for the clans are in trouble.'),
          CAT('lionheart', 'Long ago, fifteen kittypets left their twoleg homes and became the first great warriors. Their fifteen collars were kept here at Fourtrees — StarClan\'s promise that hearts can change. But a great storm scattered them among the clans\' camps... and tore the path between your world and ours.'),
          CAT('lionheart', 'I need them back, Scarlett. Every one. Only when all fifteen shine at Fourtrees again will the way home open — and place them in my paws, and you will wake on Bus 15 as if you never left it.'),
          ME('Find fifteen collars, hand them to a glowing cat, wake up on the bus. Sure. I survived finals week at Henry Clay. How hard can this be?'),
          CAT('lionheart', 'That is the spirit. And take heart — why do leopards never escape their troubles? ...Because they are always SPOTTED. Mrrow. StarClan has few entertainments; we take our jokes seriously.'),
          ME('Oh no. You\'re a dad-joke cat. My dad is going to LOVE that you exist.'),
          CAT('lionheart', 'The map of the territories is in your mind now. Four camps hold three collars each — earn them by helping the clans; everything each clan needs can be found in its own camp. When twelve shine, the last secret of the forest will reveal itself.'),
          CAT('lionheart', 'Begin with ThunderClan, my own clan; Firestar expects you. And return to me whenever you are lost — I will light your way.'),
          N('(TIP: The numbers switch actions — 1 Walk, 2 Look, 3 Talk, 4 Use, 5 carried item. Right-click also cycles them. TAB opens your backpack, M the map — or simply walk off the edge of the screen into the next territory.)')
        ]);
        return;
      }
      // all fifteen gathered → hand them over, go home
      if (G.collars >= 15 && f.q15 && !f.ceremonyDone){
        DLG.say([
          CAT('lionheart', 'Scarlett... I feel them. All fifteen, warm as suns, carried by kindness across every territory.'),
          CAT('lionheart', 'Give them to me now, dear one — and let the forest say thank you before you go.'),
          N('One by one, you place the fifteen collars in Lionheart\'s golden paws. Each one blazes to life like a small star. The night fills with the sound of many, many cats arriving...')
        ], function(){ startFinale(); });
        return;
      }
      // hint engine — first unfinished thing in recommended order
      var hint =
        !f.q1  ? 'Cinderpelt of ThunderClan needs marigold. It grows bright orange right by her own camp\'s nursery.' :
        !f.q2  ? 'Something glitters at the top of ThunderClan\'s old oak. A storm dropped a long branch near Highrock — it might just reach.' :
        !f.q3  ? 'A mouse raids ThunderClan\'s fresh-kill pile. Plug its hole with soft moss from the bank by the warriors\' den.' :
        !f.q4  ? 'Gold glints deep in the river at RiverClan\'s camp. The river carves hooks into its own driftwood — look along the bank.' :
        !f.q5  ? 'Mosspelt\'s kits dream of a stone that sparkles. Something glitters in the gap under RiverClan\'s stepping stones.' :
        !f.q6  ? 'Old Graypool shivers in a broken nest. Fresh reeds grow on her own bank, and a swan left its softest feathers there at dawn.' :
        !f.q7  ? 'A rabbit sits on a collar in the WindClan warren. Nothing lures a rabbit like the sweet clover growing in their camp hollow.' :
        !f.q8  ? 'Morningflower of WindClan has a passenger she\'d dearly love removed. Ask her about it — Barkface\'s herb store holds the cure.' :
        !f.q9  ? 'Young Gorsepaw pounces like a falling log, poor thing. Kits learn on moss-balls — WindClan\'s mossy boulder would roll a fine one.' :
        !f.q10 ? 'ShadowClan trusts no one — but Russetfur respects a hunter. There are fat frogs in the pond at the edge of their own camp.' :
        !f.q11 ? 'Blackstar\'s elders sit in the dark. Glow-moss shines within Snakerocks — but ask Littlecloud how to keep the snakes away first!' :
        !f.q12 ? 'A ShadowClan kit is missing. Something sneezed inside the old fox den... bring a light into that darkness.' :
        G.collars < 12 ? 'The clans still whisper of tasks undone. Walk among them, and listen.' :
        !f.q13 ? 'SkyClan\'s gorge has opened in the north! Speak with Leafstar — her clan\'s lost history sleeps beneath their own cliffs.' :
        !f.q14 ? 'Sharpclaw rebuilds SkyClan\'s dens on an empty belly. The gorge bees guard their honey fiercely... unless something cold and wet made them sleepy. A spring rises near their camp.' :
        !f.q15 ? 'One collar remains. Echosong, SkyClan\'s medicine cat, holds the Trial of Trust. Speak with her — and answer with your heart.' :
                 'All fifteen shine, dear one. Speak with me once more, and I will send you home.';
      DLG.say([ CAT('lionheart', 'The stars whisper this: ' + hint) ]);
      return;
    }

    // ---------- ThunderClan ----------
    if (id === 'firestar'){
      var tcDone = (f.q1 && f.q2 && f.q3);
      DLG.say(tcDone ? [
        CAT('firestar', 'Marigold gathered, the oak\'s treasure recovered, and our fresh-kill thief outsmarted. Lionheart chose well — he was my own mentor once, you know.'),
        CAT('firestar', 'I was a kittypet myself, before all this. The best hearts come from unexpected places. Go — the other clans need you.')
      ] : [
        CAT('firestar', 'So you\'re Lionheart\'s twoleg. Welcome to ThunderClan, Scarlett. He was my mentor when I first came to the forest — any friend of his gets no hissing from me.'),
        CAT('firestar', 'Three of the fifteen collars landed in ThunderClan territory when the storm hit. Cinderpelt, little Snowkit, and old Mousefur each have troubles. Help them, and the collars are yours. Everything you\'ll need is right here in camp.')
      ]);
      return;
    }
    if (id === 'cinderpelt'){
      DLG.say(f.q1 ? [ CAT('cinderpelt', 'Rosekit\'s pad is already healing, thanks to your marigold. You have a medicine cat\'s eye, Scarlett.') ]
      : hasItem('marigold') ? [
        CAT('cinderpelt', 'Is that marigold I smell? Oh, quickly — USE it on me and I\'ll prepare the poultice!')
      ] : [
        CAT('cinderpelt', 'A twoleg in camp! And I can\'t even be surprised — StarClan told me you\'d come.'),
        CAT('cinderpelt', 'Little Rosekit cut her pad on a thorn, and I\'m fresh out of marigold. It grows right there by the nursery — bright orange. Would you gather some?')
      ]);
      return;
    }
    if (id === 'snowkit'){
      DLG.say(f.q2 ? [
        CAT('snowkit', 'You got it down! You got it down! When I\'m a warrior I\'m going to tell EVERYONE a giant rescued my treasure!'),
        CAT('snowkit', 'And then I\'m going to explore ALL the cold places! The coldest! The farthest!'),
        ME('Buddy, you\'d love Ellesmere Island. Farthest-north land there is — ice, wind, zero owls. Basically your brand.')
      ]
      : [
        CAT('snowkit', '*sniff* The storm took my treasure! The shiny circle-thing! It\'s stuck at the TOP of the old oak and I\'m not allowed to climb past the first branch!'),
        ME('A shiny circle, huh? I\'ll see what I can do, kiddo.'),
        CAT('snowkit', 'Careful! The old oak is a MILLION fox-lengths tall! The storm knocked a big branch down by Highrock — maybe a giant could poke with it?')
      ]);
      return;
    }
    if (id === 'mousefur'){
      DLG.say(f.q3 ? [ CAT('mousefur', 'Fattest mouse of my whole life, and I owe it to a twoleg. Don\'t tell the other elders. ...Oh, who am I kidding, I\'ve told everyone.') ]
      : [
        CAT('mousefur', 'You! Tall one! SOMETHING is stealing from the fresh-kill pile. A mouse, bold as brambles, living in that hole right there.'),
        CAT('mousefur', 'I\'m too slow to catch it when it has TWO exits. Plug that hole with something — there\'s good thick moss on the bank by the warriors\' den — and I\'ll be waiting at the other end. Oh, I\'ll be waiting.')
      ]);
      return;
    }
    if (id === 'sandstorm'){
      DLG.say([
        CAT('sandstorm', 'Watch the footwork, twoleg. Pounce, twist, land. ...You\'re taking notes? Ha! I like you. The marigolds are by the nursery, if that\'s what you\'re here for.'),
        ME('Pounce, twist, land. Easy. I have cat-like reflexes — my dad says so every time I drop my phone directly onto my face.')
      ]);
      return;
    }

    // ---------- RiverClan ----------
    if (id === 'leopardstar'){
      var rcDone = (f.q4 && f.q5 && f.q6);
      DLG.say(rcDone ? [
        CAT('leopardstar', 'A collar from the river, a star-stone for our kits, and Graypool warm at night. RiverClan\'s three are well earned, land-walker.')
      ] : [
        CAT('leopardstar', 'A twoleg who ASKS before crossing the river. Interesting. Yes, Scarlett — we\'ve heard. Three of the fifteen fell into RiverClan\'s keeping when the storm passed.'),
        CAT('leopardstar', 'One lies lost in the river itself. One belongs to Mosspelt, whose kits want the impossible. And Graypool\'s nest shames us all. Everything you need is on our own banks — RiverClan wants for nothing except paws clever enough to use it.'),
        ME('Got it. Hey — what do you call a fish with no eyes? ...A fsh. My dad tells that one every single time we have fish sticks.'),
        CAT('leopardstar', '...RiverClan will pretend, for the sake of the alliance, that we did not hear that.')
      ]);
      return;
    }
    if (id === 'mosspelt'){
      DLG.say(f.q5 ? [ CAT('mosspelt', 'The kits have renamed the stone six times today. It is currently called Captain Sparkle.') ]
      : [
        CAT('mosspelt', 'Kits, don\'t chew the twoleg. — My little ones dream of a "star-stone." I\'ve seen something wink in the gap under the stepping stones, but no queen can leave her kits to go squeezing a paw down there...'),
        ME('Under the stepping stones? I do have hands. And questionable judgment. I\'ll go look.')
      ]);
      return;
    }
    if (id === 'graypool'){
      DLG.say(f.q6 ? [ CAT('graypool', 'Warm at last! I\'ve slept so well I dreamed in COLOR, young one.') ]
      : [
        CAT('graypool', '*shiver* Don\'t mind me, dear. The nest\'s just gone thin. Old reeds crumble, and my old paws can\'t weave new ones.'),
        CAT('graypool', 'Fresh reeds from our bank, something soft for lining — a swan preened up-bank this dawn, if any feathers are left... ah, listen to me dreaming. USE them on my nest if you ever gather such things.')
      ]);
      return;
    }

    // ---------- WindClan ----------
    if (id === 'tallstar'){
      var wcDone = (f.q7 && f.q8 && f.q9);
      DLG.say(wcDone ? [
        CAT('tallstar', 'Morningflower purrs, the warren collar is found, and Gorsepaw struts about camp like the first cat who ever caught a rabbit. WindClan runs fast and remembers long, Scarlett.')
      ] : [
        CAT('tallstar', 'The twoleg the wind spoke of! Be welcome, Scarlett. Three of the fifteen came down on our moor when the storm broke, and three troubles keep us.'),
        CAT('tallstar', 'A collar lies in the rabbit warren, guarded by the fattest, smuggest rabbit on the moor. Morningflower is being eaten alive by a tick — speak with her, and with Barkface. And my apprentice Gorsepaw... watch him hunt a while. You\'ll see.'),
        CAT('tallstar', 'Everything the moor asks of you, the moor provides. Look around our camp.'),
        ME('A whole territory kept in balance by one pack of hunters... you guys are like the wolves of Yellowstone. When they came back, the whole valley healed — even the rivers changed.'),
        CAT('tallstar', 'I do not know this Yellow-stone... but rivers that obey wolves? Those sound like sensible, well-run lands. WindClan approves.')
      ]);
      return;
    }
    if (id === 'morningflower'){
      if (!f.q8 && !f.tickAsked){
        f.tickAsked = true;
        SND.dingFile();
        DLG.say([
          CAT('morningflower', 'Itch, itch, ITCH. There\'s a tick on my shoulder with its own gravitational pull, young one.'),
          CAT('morningflower', 'Barkface keeps mouse-bile leaves in his herb store for exactly this — the only cure there is. Ugh, but it works. He\'s already set one out; my old legs just haven\'t made the trip.')
        ]);
      } else if (!f.q8){
        DLG.say([ CAT('morningflower', 'The bile leaf sits right at the front of Barkface\'s store. Fetch it and dab this monster off me, I beg you.') ]);
      } else {
        DLG.say([ CAT('morningflower', 'Tick-free and glorious. I\'ve told the story of the bile-bearing twoleg four times today and it improves with each telling.') ]);
      }
      return;
    }
    if (id === 'barkface'){
      DLG.say(f.q8 ? [ CAT('barkface', 'Morningflower hasn\'t itched once since sunhigh. A medicine cat notices these things. Well done, twoleg.') ]
      : f.tickAsked ? [ CAT('barkface', 'The mouse-bile leaf is set out at the front of my store — take it to Morningflower. And whatever you do, do NOT sniff it. I have buried braver cats than you.') ]
      : [ CAT('barkface', 'Mind the herb bundles, long-legs. If you\'re here to help, Morningflower\'s been itching for a quarter-moon — go hear her out, then come back to my store.') ]);
      return;
    }
    if (id === 'gorsepaw'){
      DLG.say(f.q9 ? [ CAT('gorsepaw', 'Three rabbits! THREE! Tallstar says if I keep this up I\'ll be Gorse-SOMETHING-AMAZING by leaf-fall!') ]
      : hasItem('mossball') ? [
        CAT('gorsepaw', '*THUMP* ...Missed again! The rabbits can hear my pounce coming from the next territory. — What\'s that you\'ve rolled up? Is that... a moss-ball?')
      ] : [
        CAT('gorsepaw', '*THUMP* ...Missed! AGAIN! I\'m the only apprentice who hasn\'t caught his first rabbit, and everyone pretends not to count.'),
        ME('Your pounce looks rushed. You know how kits learn it, right? Chasing moss-balls.'),
        CAT('gorsepaw', 'I am NOT playing with a moss-ball where the warriors can see me. ...Unless, um. Unless a twoleg happened to roll one. From that mossy boulder. Hypothetically.')
      ]);
      return;
    }

    // ---------- ShadowClan ----------
    if (id === 'blackstar'){
      var scDone = (f.q10 && f.q11 && f.q12);
      DLG.say(scDone ? [
        CAT('blackstar', 'A frog for our pride, light for our elders, and Smokekit home safe. Three debts, three collars. ShadowClan\'s books are balanced, twoleg. ...You may visit.')
      ] : [
        CAT('blackstar', 'So. The twoleg the other clans coo about. ShadowClan does not coo. Three collars fell in OUR marsh, and we give NOTHING for free.'),
        CAT('blackstar', 'Prove yourself to Russetfur — she respects only hunters. Our elders freeze in a lightless den. And... a kit is missing. Smokekit. Three days now.'),
        CAT('russetfur', 'If it can\'t catch a frog in our own pond, it can\'t be trusted in our camp.'),
        ME('Grudges, secrets, moody stares across a border... ShadowClan is basically The Summer I Turned Pretty with more fur. And I\'ve read it twice, so honestly? I\'m prepared.')
      ]);
      return;
    }
    if (id === 'russetfur'){
      DLG.say(f.q10 ? [ CAT('russetfur', 'The frog escaped the elders\' den twice. Mousefur of ThunderClan would\'ve laughed herself sick. ...The hunt was still well done.') ]
      : [ CAT('russetfur', 'Frogs sun themselves on our pond, twoleg — right there at the camp\'s edge. Catch one with those pink paws and MAYBE I\'ll believe you\'re more than talk.') ]);
      return;
    }
    if (id === 'littlecloud'){
      if (!f.gotSnakeherb){
        f.gotSnakeherb = true;
        addItem('snakeherb');
        DLG.say([
          CAT('littlecloud', 'Sshh — mind the herb bundles! You\'re the collar-twoleg? Then you\'ll be wanting Snakerocks sooner or later. Everyone always does.'),
          CAT('littlecloud', 'Take this snake-charm herb. Crush it over the rocks and the adders will keep to their cracks. WITHOUT it, well... I\'d be treating you for something worse than ticks.')
        ]);
      } else {
        DLG.say([ CAT('littlecloud', 'Crush the herb OVER the rocks first, THEN reach in. Medicine cats bury too many brave idiots, Scarlett.') ]);
      }
      return;
    }
    if (id === 'smokekit'){
      DLG.say([ CAT('smokekit', 'I wasn\'t scared in the fox den. I was AMBUSHING. For three days. ...Thanks for the glowy rescue, giant.') ]);
      return;
    }

    // ---------- SkyClan ----------
    if (id === 'leafstar'){
      if (!f.skyAsked){
        f.skyAsked = true;
        SND.dingFile();
        DLG.say([
          CAT('leafstar', 'So the stars sent us a twoleg. Welcome to the gorge, Scarlett — SkyClan knows better than any clan what it means to need a friend.'),
          CAT('leafstar', 'We were the fifth clan, driven out and forgotten. When we returned, our three collars were only two. The elders\' tales say the lost one belonged to Cloudstar\'s kin, and that the ancestors buried it here in the gorge itself — below the cliff caves, where the morning sun first touches the sand.'),
          ME('Below the cliff caves... wait. That patch of turned-up earth by the path?!'),
          CAT('leafstar', 'Fate has a sense of humor, little friend. Go and dig.')
        ]);
      } else if (f.q13){
        DLG.say([ CAT('leafstar', 'Cloudstar\'s collar, home at last — and carried by a twoleg friend. The circle closes beautifully, Scarlett.') ]);
      } else {
        DLG.say([ CAT('leafstar', 'Below the cliff caves, where the sun first touches the sand. Bring claws. Or those remarkable pink paws of yours.') ]);
      }
      return;
    }
    if (id === 'sharpclaw'){
      DLG.say(f.q14 ? [ CAT('sharpclaw', 'Best build-day in SkyClan history. Two dens up, one to go, and Petalnose forgave the bees. Mostly.') ]
      : [ CAT('sharpclaw', '*grunt* Sticks. Dens. No time to talk, twoleg. The clan builds from dawn to dusk on empty bellies... what I\'d GIVE for honey from the gorge hive. But those bees have won every war they\'ve ever fought. The spring by camp runs ice-cold, for all the good THAT does anyone.') ]);
      return;
    }
    if (id === 'echosong'){
      if (f.q15){
        DLG.say([
          CAT('echosong', 'Friend of All Clans. Now carry the fifteen home to Lionheart at Fourtrees — the stars are holding their breath, Scarlett.'),
          ME('On it. Also — Echosong? Your voice is very Laufey. Dreamy, a little sad, makes everything feel like autumn. That\'s the highest compliment I know how to give.'),
          CAT('echosong', 'I do not know this Laufey... but the stars just purred, so I shall accept.')
        ]);
        return;
      }
      if (!(f.q13 && f.q14)){
        DLG.say([ CAT('echosong', 'I hold the final collar, Scarlett — and the Trial of Trust. But the trial comes LAST. Finish your work for Leafstar and Sharpclaw first, then return to me.') ]);
        return;
      }
      // The Trial of Trust — three riddles
      var r3 = { who:'echosong', text:'Last riddle: when the moon is full and the clans gather at Fourtrees, what holds between them — stronger than claws?',
        choices: [
          { text:'A truce — one night of peace.', say:[
              CAT('echosong', 'A truce. Peace, chosen over and over, every moon. You have listened with your heart, Scarlett.'),
              N('Echosong draws out the fifteenth collar. It shines like all the stars of StarClan at once.'),
              CAT('echosong', 'Now run, Friend of All Clans. Lionheart waits at Fourtrees — and so does your way home.')
            ], effect:function(){ G.flags.q15 = true; gainCollar('SkyClan'); } },
          { text:'A big fish feast.', say:[] },
          { text:'Absolutely nothing.', say:[] }
        ] };
      var r2 = { who:'echosong', text:'Second riddle: Firestar of ThunderClan was not forest-born. What was he, before he was a warrior?',
        choices: [
          { text:'A kittypet, like the first fifteen.', say:[ CAT('echosong', 'Yes — the greatest of leaders began behind a twoleg fence. Hearts can change. Now...'), r3 ] },
          { text:'An owl.', say:[] },
          { text:'A RiverClan fish-judge.', say:[] }
        ] };
      var r1 = { who:'echosong', text:'Then the Trial begins. First riddle: which clan swims the river and counts fish as fresh-kill?',
        choices: [
          { text:'RiverClan.', say:[ CAT('echosong', 'Swift as the current. Again...'), r2 ] },
          { text:'WindClan.', say:[] },
          { text:'ShadowClan.', say:[] }
        ] };
      // wrong answers loop their riddle
      var wrong = function(r){ return [ CAT('echosong', 'Mrrow... think again, young twoleg. Trust what you have SEEN.'), r ]; };
      r1.choices[1].say = wrong(r1); r1.choices[2].say = wrong(r1);
      r2.choices[1].say = wrong(r2); r2.choices[2].say = wrong(r2);
      r3.choices[1].say = wrong(r3); r3.choices[2].say = wrong(r3);
      DLG.say([
        CAT('echosong', 'Fourteen collars. One remains — and it is not earned with paws or clever hands, but with the heart. Are you ready for the Trial of Trust?'),
        r1
      ]);
      return;
    }

    DLG.say([N('The cat blinks at you, slow and friendly.')]);
  }
};
