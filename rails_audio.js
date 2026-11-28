// Rattlejaw Rails sound engine: everything is synthesized with the Web Audio API (no sound files).
// Layers: wind + creepy music drone (tension follows the monsters), train chuff + rail clacks,
// monster sounds, weapons, footsteps, hammering, random spooky ambience.
export const A = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const master = ctx.createGain(); master.gain.value = .8; master.connect(ctx.destination);
  const sfx = ctx.createGain(); sfx.gain.value = .9; sfx.connect(master);
  const mus = ctx.createGain(); mus.gain.value = .5; mus.connect(master);
  const unlock = () => { if (ctx.state !== 'running') ctx.resume(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(e => addEventListener(e, unlock));
  const ok = () => ctx.state === 'running';
  // shared noise buffer
  const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); { const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  function noise({ dur = .2, type = 'lowpass', freq = 800, q = 1, vol = .5, at = 0, attack = .005, out = sfx, slideTo = 0 } = {}) {
    if (!ok()) return; const t = ctx.currentTime + at, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = nb; s.loop = true; f.type = type; f.frequency.setValueAtTime(freq, t); if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur); f.Q.value = q;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 1.5); s.stop(t + dur + .05);
  }
  function tone({ freq = 220, to = 0, dur = .3, type = 'sine', vol = .3, at = 0, attack = .01, out = sfx, filter = 0 } = {}) {
    if (!ok()) return; const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let last = o; if (filter) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; o.connect(f); last = f; }
    last.connect(g); g.connect(out); o.start(t); o.stop(t + dur + .05);
  }
  // ---- continuous layers ----
  const loop = (make) => { const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; const r = make(s); s.start(); return r; };
  const wind = loop(s => { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = .6; const g = ctx.createGain(); g.gain.value = .05; s.connect(f); f.connect(g); g.connect(master); return { f, g }; });
  const rumble = loop(s => { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 90; const g = ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); return { g }; });
  // music: a low detuned drone + a dissonant layer that fades in with tension
  const droneF = ctx.createBiquadFilter(); droneF.type = 'lowpass'; droneF.frequency.value = 260; droneF.connect(mus);
  const droneG = ctx.createGain(); droneG.gain.value = .12; droneG.connect(droneF);
  [55, 55.6, 82.4].forEach(fq => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fq; o.connect(droneG); o.start(); });
  const tenseG = ctx.createGain(); tenseG.gain.value = 0; tenseG.connect(droneF);
  [58.3, 116.5, 123.5].forEach(fq => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fq; const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .3 + Math.random() * .4; lg.gain.value = 1.5; lfo.connect(lg); lg.connect(o.frequency); lfo.start(); o.connect(tenseG); o.start(); });
  const pulseG = ctx.createGain(); pulseG.gain.value = 0; pulseG.connect(mus);   // heartbeat-like pulse in big fights
  let tension = 0, beatT = 0, ambT = 4;
  // ---- one-shots ----
  const fx = {
    chuff(v) { noise({ dur: .16, type: 'bandpass', freq: 500 + v * 30, q: .8, vol: .18 + v * .015 }); tone({ freq: 60, to: 40, dur: .12, vol: .12, filter: 200 }); },
    clack() { noise({ dur: .04, type: 'highpass', freq: 2500, vol: .12 }); noise({ dur: .04, type: 'highpass', freq: 2200, vol: .1, at: .11 }); },
    brake() { noise({ dur: .8, type: 'bandpass', freq: 3200, q: 8, vol: .08 }); },
    whistle() { [523, 659, 784].forEach((f, i) => tone({ freq: f, dur: 1.1, type: 'triangle', vol: .09, attack: .08 })); noise({ dur: 1.1, type: 'bandpass', freq: 1800, q: 3, vol: .05 }); },
    ghostHorn(vol = .25) { [98, 103.8, 146.8].forEach(f => tone({ freq: f, to: f * .92, dur: 2.2, type: 'sawtooth', vol: vol * .4, attack: .3, filter: 900 })); },
    gun() { noise({ dur: .09, type: 'highpass', freq: 900, vol: .35 }); tone({ freq: 110, to: 50, dur: .12, vol: .3 }); },
    dry() { tone({ freq: 900, dur: .04, type: 'square', vol: .08 }); },
    whoosh() { noise({ dur: .9, type: 'bandpass', freq: 600, slideTo: 2400, q: 2, vol: .3, attack: .05 }); },
    boom() { noise({ dur: 1.4, type: 'lowpass', freq: 900, slideTo: 80, vol: .8 }); tone({ freq: 70, to: 30, dur: 1, vol: .6 }); },
    roar(vol = .7) { tone({ freq: 95, to: 55, dur: 2.2, type: 'sawtooth', vol: vol * .5, attack: .15, filter: 500 }); tone({ freq: 142, to: 70, dur: 2, type: 'sawtooth', vol: vol * .3, attack: .2, filter: 700 }); noise({ dur: 2.2, type: 'bandpass', freq: 300, q: .7, vol: vol * .5, attack: .2 }); },
    bite() { noise({ dur: .25, type: 'lowpass', freq: 1400, vol: .8 }); tone({ freq: 80, to: 40, dur: .3, vol: .6 }); noise({ dur: .5, type: 'highpass', freq: 3000, vol: .2, at: .05 }); },
    ram() { noise({ dur: .6, type: 'lowpass', freq: 700, vol: .9 }); tone({ freq: 55, to: 35, dur: .6, vol: .7 }); noise({ dur: 1, type: 'bandpass', freq: 2600, q: 4, vol: .15, at: .1 }); },
    squeak() { tone({ freq: 1500 + Math.random() * 600, to: 2400, dur: .12, type: 'square', vol: .05, filter: 3000 }); },
    skitter() { for (let i = 0; i < 4; i++) noise({ dur: .02, type: 'highpass', freq: 3000, vol: .08, at: i * .05 }); },
    splat() { noise({ dur: .2, type: 'lowpass', freq: 600, vol: .4 }); tone({ freq: 300, to: 120, dur: .15, vol: .2 }); },
    step() { noise({ dur: .07, type: 'lowpass', freq: 500, vol: .14 }); },
    hammer() { tone({ freq: 880, dur: .25, type: 'square', vol: .06, filter: 2500 }); tone({ freq: 1320, dur: .2, type: 'triangle', vol: .08 }); noise({ dur: .05, type: 'highpass', freq: 1500, vol: .25 }); },
    pickup() { tone({ freq: 660, dur: .12, type: 'triangle', vol: .2 }); tone({ freq: 990, dur: .2, type: 'triangle', vol: .2, at: .1 }); },
    fanfare() { [392, 523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: .45, type: 'triangle', vol: .18, at: i * .13 })); },
    win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone({ freq: f, dur: .5, type: 'triangle', vol: .2, at: i * .16 })); },
    hurt() { noise({ dur: .3, type: 'lowpass', freq: 900, vol: .5 }); tone({ freq: 200, to: 90, dur: .3, type: 'sawtooth', vol: .2, filter: 800 }); },
    crow() { for (let i = 0; i < 2; i++) { noise({ dur: .22, type: 'bandpass', freq: 1300, q: 4, vol: .08, at: i * .3 }); tone({ freq: 700, to: 520, dur: .2, type: 'sawtooth', vol: .04, at: i * .3, filter: 1600 }); } },
    creak() { tone({ freq: 140 + Math.random() * 80, to: 90, dur: 1.2, type: 'sawtooth', vol: .05, attack: .3, filter: 600 }); },
    howl() { tone({ freq: 330, to: 440, dur: 1.4, type: 'sine', vol: .05, attack: .4 }); tone({ freq: 440, to: 300, dur: 1.4, type: 'sine', vol: .05, at: 1.3, attack: .2 }); },
    heartbeat() { tone({ freq: 55, to: 40, dur: .15, vol: .35 }); tone({ freq: 50, to: 38, dur: .15, vol: .25, at: .22 }); },
  };
  // ---- per-frame update: wind, tension music, rumble, random ambience ----
  function update(dt, { tension: tgt = 0, quake = 0, region = 0, boss = false } = {}) {
    if (!ok()) return;
    tension += (tgt - tension) * Math.min(1, dt * 1.5);
    const t = ctx.currentTime;
    tenseG.gain.setTargetAtTime(tension * .16, t, .2); droneF.frequency.setTargetAtTime(220 + tension * 900, t, .3); droneG.gain.setTargetAtTime(.1 + tension * .05, t, .3);
    wind.g.gain.setTargetAtTime(.04 + region * .01 + Math.sin(t * .3) * .02, t, .5); wind.f.frequency.setTargetAtTime(380 + Math.sin(t * .17) * 140, t, .5);
    rumble.g.gain.setTargetAtTime(quake * .9, t, .1);
    if (tension > .6 || boss) { beatT -= dt; if (beatT <= 0) { beatT = boss ? .55 : .8; fx.heartbeat(); } }
    ambT -= dt; if (ambT <= 0) { ambT = 6 + Math.random() * 10; const r = Math.random(); if (r < .35) fx.crow(); else if (r < .7) fx.creak(); else fx.howl(); }
  }
  const setVolume = v => { master.gain.value = v; };
  return { ...fx, update, setVolume, ctx, ok };
})();
