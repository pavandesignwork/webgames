// Sound effects + background music made with the Web Audio API (no sound files needed).
// Browsers only allow sound after a click or key press on the page, so we show a hint until then.
const Sfx = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = AC ? new AC() : null;
  let master, musicGain, sfxGain, muted = localStorage.getItem('muted') === '1';
  if (ctx) {
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.13; musicGain.connect(master);
  }
  // --- unlock audio on first click / key / touch ---
  const hint = document.createElement('div');
  hint.textContent = '🔊 Click anywhere to turn on sound';
  hint.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#ffd84a;color:#000;padding:8px 18px;border-radius:99px;font:bold 16px system-ui;z-index:9;cursor:pointer;display:none';
  addEventListener('DOMContentLoaded', () => document.body.appendChild(hint));
  const unlock = () => { if (ctx && ctx.state !== 'running') ctx.resume(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(e => addEventListener(e, unlock));
  setInterval(() => { hint.style.display = ctx && ctx.state !== 'running' && !muted ? 'block' : 'none'; }, 300);

  function tone(freq, dur, { type = 'square', vol = 1, slide = 0, delay = 0, out = sfxGain } = {}) {
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 1, delay = 0, ftype = 'lowpass', ffreq = 900) {
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + delay, len = ctx.sampleRate * dur, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = ftype; f.frequency.value = ffreq; s.buffer = buf; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t);
  }
  const notes = (seq, type = 'square', vol = .6) => seq.forEach(([f, d, at]) => tone(f, d, { type, vol, delay: at }));

  let chomp = 0;
  const fx = {
    eat()     { tone((chomp ^= 1) ? 520 : 400, 0.07, { type: 'triangle', vol: .5 }); },
    power()   { notes([[400,.1,0],[600,.1,.08],[800,.1,.16],[1100,.2,.24]], 'square', .35); },
    eatBug()  { tone(300, .25, { type: 'square', vol: .4, slide: 1200 }); },
    die()     { tone(700, .9, { type: 'sawtooth', vol: .35, slide: -620 }); noise(.4, .3, .5); },
    win()     { notes([[523,.15,0],[659,.15,.15],[784,.15,.3],[1047,.4,.45],[784,.12,.7],[1047,.6,.82]], 'square', .35); },
    ready()   { notes([[392,.12,0],[523,.12,.15],[659,.12,.3],[784,.3,.45]], 'triangle', .6); },
    star()    { const b = 880 + Math.random() * 300; tone(b, .12, { type: 'triangle', vol: .5 }); tone(b * 1.5, .2, { type: 'sine', vol: .4, delay: .06 }); },
    heart()   { notes([[660,.1,0],[880,.1,.1],[1320,.25,.2]], 'sine', .5); },
    hit()     { noise(.35, .9); tone(160, .3, { type: 'square', vol: .4, slide: -100 }); },
    jump()    { tone(300, .2, { type: 'square', vol: .25, slide: 500 }); },
    gameOver(){ notes([[523,.25,0],[466,.25,.25],[415,.25,.5],[349,.7,.75]], 'triangle', .6); },
    // --- construction game sounds ---
    honk()    { tone(370, .4, { type: 'square', vol: .3 }); tone(466, .4, { type: 'square', vol: .25 }); },
    truckHorn(){ tone(311, .18, { type: 'sawtooth', vol: .25 }); tone(311, .25, { type: 'sawtooth', vol: .25, delay: .24 }); },
    thud()    { noise(.25, .9, 0, 'lowpass', 400); tone(90, .25, { type: 'sine', vol: .7, slide: -40 }); },
    scoop()   { noise(.15, .45, 0, 'lowpass', 1400); },
    pour()    { noise(.35, .25, 0, 'bandpass', 1200); },
    clunk()   { tone(240, .08, { type: 'square', vol: .45 }); noise(.08, .6, 0, 'highpass', 2000); },
    splash()  { noise(1.2, .7, 0, 'highpass', 1500); tone(200, .5, { type: 'sine', vol: .3, slide: 300 }); },
    treasure(){ notes([[784,.1,0],[988,.1,.1],[1175,.1,.2],[1568,.35,.3]], 'triangle', .55); },
    crash()   { noise(.6, .9, 0, 'lowpass', 700); tone(150, .5, { type: 'sawtooth', vol: .3, slide: -100 }); },
    step()    { noise(.05, .25, 0, 'lowpass', 600); },
    boing()   { tone(180, .45, { type: 'sine', vol: .5, slide: 420 }); noise(.2, .6, 0, 'lowpass', 500); },
    tick()    { tone(1200, .03, { type: 'square', vol: .15 }); },
    move()    { tone(660, .05, { type: 'square', vol: .2 }); },
    select()  { notes([[660,.08,0],[990,.15,.08]], 'square', .3); },
    pause()   { tone(500, .1, { type: 'square', vol: .3 }); },
  };


  // --- continuous engine hum, one per player slot ---
  const engines = {};
  function engine(slot, throttle) {
    if (!ctx || ctx.state !== 'running') return;
    let e = engines[slot];
    if (!e) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), gn = ctx.createGain();
      o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 380; gn.gain.value = 0;
      o.connect(f); f.connect(gn); gn.connect(sfxGain); o.start();
      e = engines[slot] = { o, gn };
    }
    const t = ctx.currentTime;
    e.o.frequency.setTargetAtTime(42 + slot * 6 + throttle * 50, t, .12);
    e.gn.gain.setTargetAtTime(.06 + throttle * .08, t, .12);
  }
  function engineStop() { for (const k in engines) engines[k].gn.gain.setTargetAtTime(0, ctx.currentTime, .05); }


  // --- farts! a low buzzing oscillator with a fast wobble = "brrrrt" ---
  const farts = {};
  function fartVoice(pitch) {
    const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lfoG = ctx.createGain(), f = ctx.createBiquadFilter(), gn = ctx.createGain();
    const trem = ctx.createOscillator(), tremG = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = pitch;
    lfo.type = 'square'; lfo.frequency.value = 18 + Math.random() * 14; lfoG.gain.value = pitch * .35;
    lfo.connect(lfoG); lfoG.connect(o.frequency);
    trem.type = 'sine'; trem.frequency.value = 9 + Math.random() * 8; tremG.gain.value = .35;
    f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 6;
    gn.gain.value = 0;
    const amp = ctx.createGain(); amp.gain.value = .65; trem.connect(tremG); tremG.connect(amp.gain);
    o.connect(f); f.connect(amp); amp.connect(gn); gn.connect(sfxGain);
    o.start(); lfo.start(); trem.start();
    return { o, lfo, trem, gn, f, pitch };
  }
  function fartStart(slot, pitch = 90, vol = .9) {
    if (!ctx || ctx.state !== 'running') return;
    let v = farts[slot]; if (!v) v = farts[slot] = fartVoice(pitch);
    const t = ctx.currentTime;
    v.o.frequency.cancelScheduledValues(t); v.o.frequency.setValueAtTime(pitch * 1.25, t); v.o.frequency.exponentialRampToValueAtTime(pitch * .8, t + 1.2);
    v.lfo.frequency.setValueAtTime(16 + Math.random() * 18, t);
    v.gn.gain.cancelScheduledValues(t); v.gn.gain.setTargetAtTime(vol, t, .015);
  }
  function fartStop(slot) { const v = farts[slot]; if (v) { v.gn.gain.cancelScheduledValues(ctx.currentTime); v.gn.gain.setTargetAtTime(0, ctx.currentTime, .04); } }
  function fartStopAll() { for (const k in farts) fartStop(k); }
  function fart(dur = .35, pitch = 95, vol = .9) {   // one-shot toot
    if (!ctx || ctx.state !== 'running') return;
    const v = fartVoice(pitch), t = ctx.currentTime;
    v.gn.gain.setValueAtTime(0, t); v.gn.gain.linearRampToValueAtTime(vol, t + .02); v.gn.gain.setValueAtTime(vol, t + dur * .7); v.gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
    v.o.frequency.setValueAtTime(pitch * 1.3, t); v.o.frequency.exponentialRampToValueAtTime(pitch * .7, t + dur);
    [v.o, v.lfo, v.trem].forEach(n => n.stop(t + dur + .05));
  }
  function cheer(dur = 2) { if (!ctx || ctx.state !== 'running') return; noise(dur, .5, 0, 'bandpass', 1800); noise(dur * .8, .35, .2, 'bandpass', 900); }

  // --- simple looping background tune (original) ---
  let musicTimer = null, step = 0, song = null;
  const SONGS = {
    maze:  { bpm: 150, lead: [64,0,67,0,69,67,64,0, 62,0,64,67,64,0,60,0, 64,0,67,0,72,71,69,0, 67,0,64,62,60,0,0,0],
                       bass: [48,48,55,55,45,45,52,52, 43,43,50,50,48,48,55,55] },
    stars: { bpm: 110, lead: [72,0,76,79,0,76,72,0, 74,0,77,81,0,77,74,0, 72,0,76,79,84,0,79,76, 74,0,71,67,72,0,0,0],
                       bass: [48,0,55,0,53,0,55,0, 50,0,57,0,55,0,52,0] },
  };
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);
  function startMusic(name) {
    stopMusic(); song = SONGS[name]; step = 0;
    const stepDur = 60 / song.bpm / 2;
    musicTimer = setInterval(() => {
      const l = song.lead[step % song.lead.length], b = song.bass[Math.floor(step / 2) % song.bass.length];
      if (l) tone(midi(l), stepDur * .9, { type: 'square', vol: .5, out: musicGain });
      if (b && step % 2 === 0) tone(midi(b), stepDur * 1.8, { type: 'triangle', vol: .9, out: musicGain });
      step++;
    }, stepDur * 1000);
  }
  function stopMusic() { clearInterval(musicTimer); musicTimer = null; }
  function setMusicVolume(v) { if (musicGain) musicGain.gain.value = v; }
  function toggleMute() {
    muted = !muted; localStorage.setItem('muted', muted ? '1' : '0');
    if (master) master.gain.value = muted ? 0 : 0.8;
    showToast(muted ? '🔇 Sound off' : '🔊 Sound on');
    return muted;
  }
  function showToast(t) {
    let el = document.getElementById('sfx-toast');
    if (!el) { el = document.createElement('div'); el.id = 'sfx-toast';
      el.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#000c;color:#fff;padding:10px 16px;border-radius:12px;font:bold 18px system-ui;z-index:9;transition:opacity .4s';
      document.body.appendChild(el); }
    el.textContent = t; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => el.style.opacity = 0, 1200);
  }
  addEventListener('keydown', e => { if (e.code === 'KeyM') toggleMute(); });
  return { ...fx, fart, fartStart, fartStop, fartStopAll, cheer, engine, engineStop, startMusic, stopMusic, setMusicVolume, toggleMute, get muted() { return muted; } };
})();
