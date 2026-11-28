// Rattlejaw Rails voice chat. Plain WebRTC audio between players (a "mesh": everyone talks to everyone).
// The set-up messages ("signalling") travel over the game's own links, so it works with just the room code.
// One page per player runs this: the phone controller if one is connected, otherwise the game page.
//
//   Voice.init({me, send:(toId,data)=>…, onState:st=>…})   start (me = my player id)
//   Voice.setPlayers([{id,name,color}…])                    the OTHER players in the room
//   Voice.signal(fromId, data)                              feed in a signalling message that arrived
//   Voice.setMic(bool) · setSnd(bool) · setHear(id,bool) · setTalk(id,bool) · stop()
//   Voice.st = {mic, snd, hear:{id:bool}, talk:{id:bool}, speaking:{id:bool}, players, micErr, up}
//
// To make it work for everybody on every network, add a TURN relay before this script loads:
//   window.VOICE_ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'turn:YOUR_HOST',username:'…',credential:'…'}]
const Voice = (() => {
  const ICE = window.VOICE_ICE || [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
  const st = { up: false, me: null, players: [], mic: false, snd: true, hear: {}, talk: {}, speaking: {}, micErr: '' };
  let send = () => {}, onState = () => {}, ctx = null, dest = null, micGain = null, micSrc = null, micStream = null, myAn = null, myBuf = null, loopT = null, lvlT = null;
  const pcs = {}, auds = {}, ans = {}, hold = {};
  const emit = () => { try { onState(st); } catch (e) {} };

  function ensureCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    dest = ctx.createMediaStreamDestination();            // everything I say goes through here (a gate: closed = silence)
    micGain = ctx.createGain(); micGain.gain.value = 0; micGain.connect(dest);
    myAn = ctx.createAnalyser(); myAn.fftSize = 512; myBuf = new Float32Array(512); micGain.connect(myAn);
  }
  const unlock = () => { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); for (const id in auds) if (auds[id].paused) auds[id].play().catch(() => {}); };
  ['pointerdown', 'keydown', 'touchend', 'click'].forEach(e => addEventListener(e, unlock, true));

  function init({ me, send: s, onState: o }) {
    if (st.up && st.me === me) { send = s; onState = o; return; }
    if (st.up) stop();
    st.me = me; send = s; onState = o; st.up = true; ensureCtx();
    loopT = setInterval(tick, 2500); lvlT = setInterval(levels, 120); emit();
  }
  function setPlayers(list) {
    if (!st.up) return;
    st.players = list.filter(p => p.id !== st.me);
    const ids = new Set(st.players.map(p => p.id));
    for (const id in pcs) if (!ids.has(+id)) drop(+id);
    for (const p of st.players) { if (st.hear[p.id] === undefined) st.hear[p.id] = true; if (st.talk[p.id] === undefined) st.talk[p.id] = true; }
    emit(); tick();
  }
  // the player with the lower id makes the call; the other answers
  function tick() {
    if (!st.up) return;
    for (const p of st.players) { if (p.id < st.me) continue; const e = pcs[p.id], s = e && e.pc.connectionState;
      if (!e || s === 'failed' || s === 'closed' || s === 'disconnected' || (s !== 'connected' && Date.now() - e.t0 > 12000)) offer(p.id); }
  }
  function makePC(id) {
    drop(id, true);
    const pc = new RTCPeerConnection({ iceServers: ICE }), e = { pc, t0: Date.now(), queue: [], track: dest.stream.getAudioTracks()[0] };
    pcs[id] = e;
    pc.onicecandidate = ev => { if (ev.candidate) send(id, { ice: ev.candidate.toJSON ? ev.candidate.toJSON() : { candidate: ev.candidate.candidate, sdpMid: ev.candidate.sdpMid, sdpMLineIndex: ev.candidate.sdpMLineIndex } }); };
    pc.ontrack = ev => play(id, ev.streams[0] || new MediaStream([ev.track]));
    pc.onconnectionstatechange = () => emit();
    e.sender = pc.addTrack(e.track, dest.stream);
    if (st.talk[id] === false) e.sender.replaceTrack(null).catch(() => {});
    return e;
  }
  async function offer(id) {
    try { const e = makePC(id); const o = await e.pc.createOffer(); await e.pc.setLocalDescription(o); send(id, { sdp: { type: e.pc.localDescription.type, sdp: e.pc.localDescription.sdp } }); } catch (err) {}
  }
  async function signal(from, d) {
    if (!st.up || !d) return;
    try {
      let e = pcs[from];
      if (d.sdp && d.sdp.type === 'offer') {
        e = makePC(from); await e.pc.setRemoteDescription(d.sdp); flush(e);
        const a = await e.pc.createAnswer(); await e.pc.setLocalDescription(a); send(from, { sdp: { type: e.pc.localDescription.type, sdp: e.pc.localDescription.sdp } });
      } else if (d.sdp && d.sdp.type === 'answer' && e && e.pc.signalingState === 'have-local-offer') { await e.pc.setRemoteDescription(d.sdp); flush(e); }
      else if (d.ice && e) { if (e.pc.remoteDescription) e.pc.addIceCandidate(d.ice).catch(() => {}); else e.queue.push(d.ice); }
    } catch (err) {}
  }
  function flush(e) { while (e.queue.length) e.pc.addIceCandidate(e.queue.shift()).catch(() => {}); }
  function drop(id, keepAudio) {
    const e = pcs[id]; if (e) { try { e.pc.close(); } catch (x) {} delete pcs[id]; }
    if (!keepAudio) { if (auds[id]) { auds[id].srcObject = null; delete auds[id]; } if (ans[id]) { try { ans[id].src.disconnect(); } catch (x) {} delete ans[id]; } delete st.speaking[id]; }
  }
  function play(id, stream) {
    let a = auds[id]; if (!a) { a = new Audio(); a.autoplay = true; a.playsInline = true; a.setAttribute('playsinline', ''); auds[id] = a; }
    a.srcObject = stream; vol(id); a.play().catch(() => {});
    try { if (ans[id]) ans[id].src.disconnect(); const src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser(); an.fftSize = 512; src.connect(an); ans[id] = { src, an, buf: new Float32Array(512) }; } catch (e) {}
    emit();
  }
  const vol = id => { const a = auds[id]; if (a) a.muted = !st.snd || st.hear[id] === false; };
  const rms = (an, buf) => { an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.sqrt(s / buf.length); };
  function levels() {
    let ch = false; const now = performance.now();
    const set = (id, loud) => { if (loud) hold[id] = now + 350; const on = (hold[id] || 0) > now; if (!!st.speaking[id] !== on) { st.speaking[id] = on; ch = true; } };
    for (const id in ans) set(id, rms(ans[id].an, ans[id].buf) > .012);
    if (myAn) set(st.me, st.mic && rms(myAn, myBuf) > .012);
    if (ch) emit();
  }
  async function setMic(on) {
    if (!st.up) { st.micErr = ''; return; }
    if (on) {
      ensureCtx(); if (ctx.state !== 'running') ctx.resume().catch(() => {});
      if (!micSrc) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { st.micErr = 'Microphone needs a secure (https) page.'; st.mic = false; micGain.gain.value = 0; emit(); return; }
        try { micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
          micSrc = ctx.createMediaStreamSource(micStream); micSrc.connect(micGain); st.micErr = ''; }
        catch (e) { st.micErr = e && e.name === 'NotAllowedError' ? 'Microphone is blocked. Allow it in the browser settings.' : 'No microphone found.'; st.mic = false; micGain.gain.value = 0; emit(); return; }
      }
    } else if (micSrc) {   // let go of the microphone (the browser's recording light goes off)
      try { micSrc.disconnect(); micStream.getTracks().forEach(t => t.stop()); } catch (e) {} micSrc = null; micStream = null;
    }
    st.mic = !!on; micGain.gain.value = on ? 1 : 0; emit();
  }
  function setSnd(b) { st.snd = !!b; for (const id in auds) vol(id); emit(); }
  function setHear(id, b) { st.hear[id] = !!b; vol(id); emit(); }
  function setTalk(id, b) { st.talk[id] = !!b; const e = pcs[id]; if (e && e.sender) e.sender.replaceTrack(b ? e.track : null).catch(() => {}); emit(); }
  function stop() {
    clearInterval(loopT); clearInterval(lvlT);
    for (const id in pcs) drop(+id);
    if (micSrc) { try { micSrc.disconnect(); micStream.getTracks().forEach(t => t.stop()); } catch (e) {} micSrc = null; micStream = null; }
    if (ctx) { try { ctx.close(); } catch (e) {} ctx = null; dest = micGain = myAn = null; }
    st.up = false; st.players = []; st.mic = false; st.speaking = {}; emit();
  }
  const dbg = () => ({ ctx: ctx && ctx.state, pcs: Object.fromEntries(Object.entries(pcs).map(([k, e]) => [k, [e.pc.connectionState, e.pc.iceConnectionState, e.pc.signalingState, e.pc.getSenders().length, e.pc.getReceivers().length]])) });
  const stats = async () => { const out = {}; for (const id in pcs) { const r = await pcs[id].pc.getStats(); r.forEach(x => { if (x.type === 'inbound-rtp' && x.kind === 'audio') out['in' + id] = [x.packetsReceived, x.totalAudioEnergy && +x.totalAudioEnergy.toFixed(4), x.audioLevel]; if (x.type === 'outbound-rtp' && x.kind === 'audio') out['out' + id] = [x.packetsSent, x.bytesSent]; }); }
    out.mine = myAn ? +rms(myAn, myBuf).toFixed(4) : null; out.gain = micGain && micGain.gain.value; out.aud = Object.fromEntries(Object.entries(auds).map(([k, a]) => [k, [a.paused, a.muted, a.readyState]])); out.rem = Object.fromEntries(Object.entries(ans).map(([k, a]) => [k, +rms(a.an, a.buf).toFixed(4)])); return out; };
  return { init, setPlayers, signal, setMic, setSnd, setHear, setTalk, stop, st, dbg, stats };
})();
