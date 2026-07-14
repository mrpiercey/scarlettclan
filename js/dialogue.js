// ============================================================
// dialogue.js — KQ6-style framed portrait dialogue box with
// typewriter text, a step queue, and clickable choices.
// Steps: { who:'scarlett'|catId|null, name, text, choices?, effect? }
// ============================================================

var DLG = {
  queue: [], active: false, chars: 0, step: null,
  hoverChoice: -1, toastMsg: null, toastTimer: 0, toastItem: null,
  anchor: 'bottom',        // 'top' docks the box up top (used when the scene's action is low)

  say: function(steps, onAllDone){
    for (var i = 0; i < steps.length; i++) this.queue.push(steps[i]);
    if (onAllDone) this.queue.push({ _done: onAllDone });
    if (!this.active) this._next();
  },

  _next: function(){
    while (this.queue.length && this.queue[0]._done){
      var fn = this.queue.shift()._done; fn();
    }
    if (!this.queue.length){ this.active = false; this.step = null; return; }
    this.step = this.queue.shift();
    this.active = true;
    this.chars = 0;
    this.hoverChoice = -1;
    if (this.step.effect) this.step.effect();
    if (this.step.who && window.CATS && CATS[this.step.who]) SND.meow();
  },

  fullText: function(){ return this.step ? this.step.text : ''; },

  // click / space handling. Returns true if consumed.
  click: function(mx, my){
    if (!this.active) return false;
    var full = this.fullText();
    if (this.chars < full.length){ this.chars = full.length; return true; }
    if (this.step.choices){
      var c = this._choiceAt(mx, my);
      if (c >= 0){
        var choice = this.step.choices[c];
        this.step = null;
        if (choice.say) this.queue = choice.say.concat(this.queue);
        if (choice.effect) choice.effect();
        this._next();
      }
      return true;   // with choices up, clicks elsewhere do nothing
    }
    this._next();
    return true;
  },

  // one source of truth for the box geometry — the frame grows to fit the
  // text and any choices, so nothing ever spills outside it
  _layout: function(){
    var s = this.step;
    var portrait = !!(s.who && s.who !== 'narrator');
    var lines = this._wrap(s.text, portrait ? 45 : 58);
    var textH = lines.length * 9;
    var choicesH = s.choices ? s.choices.length * 11 + 3 : 0;
    var h = Math.max(portrait ? 66 : 34, textH + choicesH + 21);
    var top = this.anchor === 'top' ? 4 : 196 - h;
    var rects = [];
    if (s.choices){
      var cy = top + 10 + textH + 4;
      for (var i = 0; i < s.choices.length; i++) rects.push({ x: 86, y: cy + i * 11, w: 218, h: 10 });
    }
    return { top: top, h: h, portrait: portrait, lines: lines, textX: portrait ? 84 : 16, rects: rects };
  },

  _choiceAt: function(mx, my){
    var rects = this._layout().rects;
    for (var i = 0; i < rects.length; i++){
      var r = rects[i];
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
    }
    return -1;
  },

  hover: function(mx, my){
    if (this.active && this.step && this.step.choices) this.hoverChoice = this._choiceAt(mx, my);
  },

  _wrap: function(text, width){
    width = width || 45;
    var words = text.split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++){
      var test = line ? line + ' ' + words[i] : words[i];
      if (test.length > width){ lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  },

  toast: function(msg, itemId){
    this.toastMsg = msg; this.toastItem = itemId || null; this.toastTimer = 130;
  },

  update: function(){
    if (this.active && this.step){
      var full = this.fullText();
      if (this.chars < full.length) this.chars = Math.min(full.length, this.chars + 2);
    }
    if (this.toastTimer > 0) this.toastTimer--;
  },

  ornateFrame: function(g, x, y, w, h){
    frect(g, x, y, w, h, '#2a1e14');
    frect(g, x + 2, y + 2, w - 4, h - 4, '#8a6a3a');
    frect(g, x + 3, y + 3, w - 6, h - 6, PAL.gold);
    frect(g, x + 4, y + 4, w - 8, h - 8, '#5a4226');
    frect(g, x + 5, y + 5, w - 10, h - 10, '#efe6cc');
    // corner gems, KQ6 style
    var cs = [[x+2,y+2],[x+w-6,y+2],[x+2,y+h-6],[x+w-6,y+h-6]];
    for (var i = 0; i < 4; i++){
      frect(g, cs[i][0], cs[i][1], 4, 4, '#a83a3a');
      px(g, cs[i][0]+1, cs[i][1]+1, '#e88a7a');
    }
  },

  draw: function(g, tick){
    // toast box (item pickups, hints) — sits at the top, clear of the dialogue box
    if (this.toastTimer > 0){
      var tw = this.toastMsg.length * 4.9 + (this.toastItem ? 26 : 14);
      var tx = (VW - tw) / 2;
      g.globalAlpha = Math.min(1, this.toastTimer / 20);
      this.ornateFrame(g, tx, 24, tw, 24);
      g.fillStyle = '#2a1e14'; g.font = '8px monospace'; g.textBaseline = 'top';
      if (this.toastItem){
        drawItem(g, tx + 6, 28, this.toastItem);
        g.fillText(this.toastMsg, tx + 24, 32);
      } else g.fillText(this.toastMsg, tx + 7, 32);
      g.globalAlpha = 1;
    }
    if (!this.active || !this.step) return;
    var s = this.step;
    var L = this._layout();
    this.ornateFrame(g, 6, L.top, 308, L.h);
    g.font = '8px monospace'; g.textBaseline = 'top';

    if (L.portrait){
      // portrait frame
      frect(g, 12, L.top + 6, 62, 54, '#2a1e14');
      frect(g, 13, L.top + 7, 60, 52, PAL.gold);
      g.save(); g.beginPath(); g.rect(15, L.top + 9, 56, 48); g.clip();
      if (s.who === 'scarlett') drawPortraitScarlett(g, 15, L.top + 5);
      else if (window.CATS && CATS[s.who]) drawPortraitCat(g, 15, L.top + 5, CATS[s.who]);
      else if (window.FAMILY && FAMILY[s.who]) drawPortraitHuman(g, 15, L.top + 5, FAMILY[s.who]);
      g.restore();
      // name plate
      frect(g, 15, L.top + 50, 56, 9, 'rgba(20,12,8,0.85)');
      g.fillStyle = PAL.gold2;
      var nm = s.name || (window.CATS && CATS[s.who] ? CATS[s.who].name
                : (window.FAMILY && FAMILY[s.who] ? FAMILY[s.who].name : 'Scarlett'));
      g.fillText(nm, 43 - nm.length * 2.4, L.top + 51);
    }

    // typewriter text
    g.fillStyle = '#2a1e14';
    var count = 0;
    for (var i = 0; i < L.lines.length; i++){
      var take = Math.max(0, Math.min(L.lines[i].length, this.chars - count));
      g.fillText(L.lines[i].substring(0, take), L.textX, L.top + 10 + i * 9);
      count += L.lines[i].length + 1;
    }

    // choices
    if (s.choices && this.chars >= this.fullText().length){
      for (var c = 0; c < s.choices.length; c++){
        var r = L.rects[c];
        if (c === this.hoverChoice){
          frect(g, r.x - 2, r.y - 1, r.w + 4, r.h, '#d8c890');
        }
        g.fillStyle = c === this.hoverChoice ? '#7a1e1e' : '#3a3050';
        g.fillText('▸ ' + s.choices[c].text, r.x, r.y);
      }
    } else if (this.chars >= this.fullText().length && !s.choices){
      // blinking advance arrow
      if ((tick / 20 | 0) % 2 === 0){
        g.fillStyle = '#7a1e1e';
        g.fillText('▼', 298, L.top + L.h - 12);
      }
    }
  }
};
