// ============================================================
// audio.js — DOS/AdLib-flavored music + SFX, all Web Audio.
// Square-wave lead with a detuned partner (OPL vibe), triangle
// bass, simple ADSR. Songs are note strings; unit = eighth note.
// ============================================================

var SND = {
  ctx: null, master: null, muted: false, ready: false,
  current: null, timer: null, tracks: [],

  init: function(){
    if (this.ready) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;
    this.master.connect(this.ctx.destination);
    this.ready = true;
  },

  noteFreq: function(name){
    if (name === 'R') return 0;
    var m = name.match(/^([A-G])(#|b)?(\d)$/);
    if (!m) return 0;
    var semis = {C:0, D:2, E:4, F:5, G:7, A:9, B:11}[m[1]];
    if (m[2] === '#') semis++;
    if (m[2] === 'b') semis--;
    var midi = (parseInt(m[3]) + 1) * 12 + semis;
    return 440 * Math.pow(2, (midi - 69) / 12);
  },

  parse: function(str){
    var out = [], toks = str.trim().split(/\s+/);
    for (var i = 0; i < toks.length; i++){
      var p = toks[i].split(':');
      out.push({ f: this.noteFreq(p[0]), d: parseFloat(p[1] || 2) });
    }
    return out;
  },

  // one synthesized note
  voice: function(freq, when, dur, kind, vol){
    if (!freq || this.muted) return;
    var ctx = this.ctx, g = ctx.createGain();
    g.connect(this.master);
    var a = 0.012, rel = Math.min(0.12, dur * 0.4);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(vol, when + a);
    g.gain.setValueAtTime(vol * 0.8, Math.max(when + a, when + dur - rel));
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    var oscs = [];
    if (kind === 'lead'){
      var o1 = ctx.createOscillator(); o1.type = 'square'; o1.frequency.value = freq;
      var o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = freq * 1.006;
      var g2 = ctx.createGain(); g2.gain.value = 0.35;
      var flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 2400;
      o1.connect(flt); o2.connect(g2); g2.connect(flt); flt.connect(g);
      oscs = [o1, o2];
    } else if (kind === 'bass'){
      var b = ctx.createOscillator(); b.type = 'triangle'; b.frequency.value = freq;
      b.connect(g); oscs = [b];
    } else { // 'bell' for sfx
      var s = ctx.createOscillator(); s.type = 'sine'; s.frequency.value = freq;
      var s2 = ctx.createOscillator(); s2.type = 'square'; s2.frequency.value = freq * 2;
      var sg = ctx.createGain(); sg.gain.value = 0.12;
      s.connect(g); s2.connect(sg); sg.connect(g);
      oscs = [s, s2];
    }
    for (var i = 0; i < oscs.length; i++){ oscs[i].start(when); oscs[i].stop(when + dur + 0.05); }
  },

  playSong: function(name){
    if (!this.ready) { this.current = name; return; }   // remembered until init
    if (this.current === name && this.timer) return;
    this.stopSong();
    this.current = name;
    var song = SONGS[name];
    if (!song) return;
    var spu = 60 / (song.tempo * 2);  // seconds per eighth
    var self = this;
    this.tracks = [
      { notes: this.parse(song.lead), idx: 0, next: this.ctx.currentTime + 0.08, kind: 'lead', vol: 0.30 },
      { notes: this.parse(song.bass), idx: 0, next: this.ctx.currentTime + 0.08, kind: 'bass', vol: 0.26 }
    ];
    this.timer = setInterval(function(){
      var horizon = self.ctx.currentTime + 0.45;
      for (var t = 0; t < self.tracks.length; t++){
        var tr = self.tracks[t];
        while (tr.next < horizon){
          var n = tr.notes[tr.idx];
          var dur = n.d * spu;
          self.voice(n.f, tr.next, dur * 0.92, tr.kind, tr.vol);
          tr.next += dur;
          tr.idx = (tr.idx + 1) % tr.notes.length;
        }
      }
    }, 120);
  },

  stopSong: function(){
    if (this.timer){ clearInterval(this.timer); this.timer = null; }
    this.current = null;
  },

  toggleMute: function(){
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.16;
  },

  // --- SFX ---
  ding: function(){                       // item pickup: bright two-note blip
    if (!this.ready) return;
    var t = this.ctx.currentTime;
    this.voice(1046.5, t, 0.09, 'bell', 0.5);        // C6
    this.voice(1568.0, t + 0.09, 0.22, 'bell', 0.5); // G6
  },
  fanfare: function(){                    // collar earned: rising arpeggio + ding
    if (!this.ready) return;
    var t = this.ctx.currentTime;
    var seq = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    for (var i = 0; i < seq.length; i++) this.voice(seq[i], t + i * 0.09, 0.24, 'lead', 0.4);
    this.voice(2093, t + 0.5, 0.5, 'bell', 0.45);
  },
  meow: function(){
    if (!this.ready || this.muted) return;
    var ctx = this.ctx, t = ctx.currentTime;
    var o = ctx.createOscillator(); o.type = 'sawtooth';
    var g = ctx.createGain(); g.connect(this.master);
    var flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 1600;
    o.connect(flt); flt.connect(g);
    o.frequency.setValueAtTime(660, t);
    o.frequency.linearRampToValueAtTime(880, t + 0.08);
    o.frequency.linearRampToValueAtTime(440, t + 0.28);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.start(t); o.stop(t + 0.32);
  },
  err: function(){
    if (!this.ready) return;
    var t = this.ctx.currentTime;
    this.voice(160, t, 0.16, 'bass', 0.5);
    this.voice(130, t + 0.14, 0.2, 'bass', 0.5);
  },
  step: function(){
    if (!this.ready) return;
    this.voice(220 + Math.random() * 40, this.ctx.currentTime, 0.03, 'bass', 0.12);
  }
};

// ============================================================
// Songs — unit is an eighth note. R = rest.
// ============================================================
var SONGS = {
  title: { tempo: 118,
    lead: "F4:2 A4:2 C5:2 A4:2 Bb4:2 A4:2 G4:4 A4:2 C5:2 F5:2 E5:2 D5:2 C5:2 A4:4 " +
          "Bb4:2 D5:2 F5:2 D5:2 C5:2 Bb4:2 A4:4 G4:2 A4:2 Bb4:2 G4:2 A4:2 G4:2 F4:4",
    bass: "F2:8 Bb2:8 F2:4 A2:4 D3:4 C3:4 Bb2:8 F2:8 C3:8 F2:4 C3:4" },

  forest: { tempo: 100,
    lead: "E4:2 G4:2 C5:2 G4:2 A4:2 G4:2 E4:4 D4:2 E4:2 F4:2 A4:2 G4:6 R:2 " +
          "E4:2 G4:2 C5:2 E5:2 D5:2 C5:2 A4:4 G4:2 A4:2 F4:2 D4:2 C4:6 R:2",
    bass: "C3:8 C3:8 F2:8 G2:8 C3:8 A2:8 F2:4 G2:4 C3:8" },

  night: { tempo: 78,
    lead: "A4:4 C5:4 B4:4 G4:4 A4:4 E5:4 D5:6 R:2 C5:4 B4:4 A4:4 F4:4 E4:8 R:8",
    bass: "A2:8 E2:8 F2:8 G2:8 A2:8 F2:8 E2:8 E2:8" },

  river: { tempo: 132,
    lead: "G4:2 B4:2 D5:2 E5:4 D5:2 B4:2 G4:2 E4:2 D4:6 " +
          "G4:2 B4:2 D5:2 G5:4 F#5:2 E5:2 D5:2 B4:2 G4:6",
    bass: "G2:2 D3:2 B2:2 C3:2 G3:2 E3:2 G2:2 D3:2 B2:2 D3:2 A2:2 F#2:2 G2:2 D3:2 B2:2 G2:6" },

  wind: { tempo: 148,
    lead: "A4:1 C5:1 E5:2 A4:1 C5:1 E5:2 D5:1 F5:1 A5:2 G5:2 E5:2 " +
          "C5:1 E5:1 G5:2 F5:2 D5:2 E5:1 D5:1 C5:2 B4:2 A4:2 " +
          "A4:1 C5:1 E5:2 A5:4 G5:1 F5:1 E5:2 D5:2 C5:2 B4:2 A4:4",
    bass: "A2:4 E3:4 F2:4 C3:4 A2:4 E3:4 D3:4 E3:4 A2:4 A2:4 F2:4 G2:4 A2:8" },

  shadow: { tempo: 82,
    lead: "D4:4 F4:2 E4:2 D4:2 A3:2 D4:4 F4:4 G4:2 A4:2 Bb4:4 A4:4 " +
          "G4:2 F4:2 E4:2 D4:2 C#4:4 A3:4 D4:2 E4:2 F4:2 E4:2 D4:8",
    bass: "D2:8 D2:8 G2:8 Bb2:4 A2:4 G2:8 A2:8 D2:8 D2:8" },

  sky: { tempo: 126,
    lead: "G4:2 B4:2 D5:2 G5:2 F#5:2 D5:2 B4:4 C5:2 E5:2 G5:2 E5:2 D5:6 R:2 " +
          "E5:2 D5:2 B4:2 G4:2 A4:2 B4:2 C5:4 B4:2 A4:2 G4:6 R:2",
    bass: "G2:8 G2:8 C3:8 D3:8 E3:8 C3:8 D3:4 D3:4 G2:8" },

  birthday: { tempo: 112,
    lead: "C4:1 C4:1 D4:2 C4:2 F4:2 E4:4 C4:1 C4:1 D4:2 C4:2 G4:2 F4:4 " +
          "C4:1 C4:1 C5:2 A4:2 F4:2 E4:2 D4:4 Bb4:1 Bb4:1 A4:2 F4:2 G4:2 F4:6",
    bass: "F2:8 C3:4 C3:4 F2:8 F2:4 C3:4 F2:4 A2:4 Bb2:4 C3:4 Bb2:4 C3:2 F2:6" }
};
