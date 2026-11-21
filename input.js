// Shared input: Kreo Mirage (or any) gamepad via the browser Gamepad API + keyboard fallback.
// Pair the controller over Bluetooth to your PC/laptop first, then press any button on the game page.
const Input = (() => {
  const keys = {}, taps = {};
  let prevPad = {};
  const state = { up:false, down:false, left:false, right:false, a:false, start:false,
                  aPressed:false, startPressed:false, padName:null };
  addEventListener('keydown', e => { keys[e.code] = true; taps[e.code] = true;
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); });
  addEventListener('keyup', e => { keys[e.code] = false; });

  function poll() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    const b = i => !!(gp && gp.buttons[i] && gp.buttons[i].pressed);
    const ax = i => (gp && gp.axes[i]) || 0;
    const DZ = 0.45;
    // Standard mapping: 12-15 D-pad, 0 = A/Cross, 9 = Start/Menu, axes 0/1 = left stick
    const k = c => keys[c] || taps[c];
    const cur = {
      up:    b(12) || ax(1) < -DZ || k('ArrowUp') || k('KeyW'),
      down:  b(13) || ax(1) >  DZ || k('ArrowDown') || k('KeyS'),
      left:  b(14) || ax(0) < -DZ || k('ArrowLeft') || k('KeyA'),
      right: b(15) || ax(0) >  DZ || k('ArrowRight') || k('KeyD'),
      a:     b(0) || b(1) || k('Space') || k('KeyZ'),
      start: b(9) || k('Enter') || k('Escape') || k('KeyP'),
    };
    state.aPressed = cur.a && !prevPad.a;
    state.startPressed = cur.start && !prevPad.start;
    Object.assign(state, cur);
    state.padName = gp ? gp.id : null;
    prevPad = cur;
    for (const c in taps) delete taps[c];
    return state;
  }
  function rumble(ms = 120, strength = 0.6) {
    const gp = [...(navigator.getGamepads?.() || [])].find(p => p && p.connected);
    gp?.vibrationActuator?.playEffect?.('dual-rumble',
      { duration: ms, strongMagnitude: strength, weakMagnitude: strength }).catch(() => {});
  }
  return { poll, rumble, state };
})();
