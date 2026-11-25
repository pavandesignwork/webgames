// Phone <-> game link.
// Normal mode: WebRTC through PeerJS (vendor/peerjs.min.js). The free PeerJS server only introduces the
// two devices; after that, button presses go straight from the phone to the game.
// Test mode (?local in the URL): BroadcastChannel, so two tabs in the same browser can talk.
const NetLink = (() => {
  const PREFIX = 'pdw-webgames-toot-';
  const LOCAL = new URLSearchParams(location.search).has('local');
  const newCode = () => String(1000 + Math.floor(Math.random() * 9000));

  function emitter() {
    const h = {};
    return { on(ev, f) { (h[ev] = h[ev] || []).push(f); }, emit(ev, d) { (h[ev] || []).forEach(f => f(d)); } };
  }
  function wrapPeer(c) {
    const e = emitter();
    c.on('data', d => e.emit('data', d)); c.on('close', () => e.emit('close')); c.on('error', () => e.emit('close'));
    return { send: d => { if (c.open) c.send(d); }, on: e.on, close: () => c.close() };
  }

  // ---------- game (host) side ----------
  function host({ onCode, onConn, onError }) {
    if (LOCAL) {
      const code = newCode(), ch = new BroadcastChannel('toot-' + code), conns = {};
      ch.onmessage = ev => {
        const { from, t, d } = ev.data; if (!from) return;
        if (t === 'join') {
          const e = emitter();
          conns[from] = { e, conn: { send: d => ch.postMessage({ to: from, t: 'data', d }), on: e.on, close: () => ch.postMessage({ to: from, t: 'close' }) } };
          ch.postMessage({ to: from, t: 'ok' }); onConn(conns[from].conn);
        } else if (conns[from]) { if (t === 'data') conns[from].e.emit('data', d); if (t === 'close') conns[from].e.emit('close'); }
      };
      setTimeout(() => onCode(code)); return;
    }
    if (typeof Peer === 'undefined') { onError && onError('Could not load the connection library.'); return; }
    const tryCode = () => {
      const code = newCode(), peer = new Peer(PREFIX + code, { debug: 0 });
      peer.on('open', () => onCode(code));
      peer.on('connection', c => c.on('open', () => onConn(wrapPeer(c))));
      peer.on('error', e => { if (e.type === 'unavailable-id') { peer.destroy(); tryCode(); } else onError && onError(e.type || String(e)); });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (_) {} });
    };
    tryCode();
  }

  // ---------- phone side ----------
  function join(code, { onOpen, onError }) {
    code = String(code).trim();
    if (LOCAL) {
      const me = Math.random().toString(36).slice(2), ch = new BroadcastChannel('toot-' + code), e = emitter();
      let ok = false;
      ch.onmessage = ev => { const { to, t, d } = ev.data; if (to !== me) return;
        if (t === 'ok') { ok = true; onOpen({ send: d => ch.postMessage({ from: me, t: 'data', d }), on: e.on, close: () => ch.postMessage({ from: me, t: 'close' }) }); }
        if (t === 'data') e.emit('data', d); if (t === 'close') e.emit('close'); };
      ch.postMessage({ from: me, t: 'join' });
      setTimeout(() => { if (!ok) onError('No game found with code ' + code); }, 3000); return;
    }
    if (typeof Peer === 'undefined') { onError('Could not load the connection library. Check your internet.'); return; }
    const peer = new Peer({ debug: 0 }); let done = false;
    const fail = m => { if (!done) { done = true; onError(m); try { peer.destroy(); } catch (_) {} } };
    peer.on('open', () => {
      const c = peer.connect(PREFIX + code, { reliable: true });
      c.on('open', () => { done = true; onOpen(wrapPeer(c)); });
      setTimeout(() => fail('Could not connect. Check the code, and that the game screen is open.'), 12000);
    });
    peer.on('error', e => fail(e.type === 'peer-unavailable' ? 'No game found with code ' + code : 'Connection problem: ' + (e.type || e)));
  }
  return { host, join, LOCAL };
})();
