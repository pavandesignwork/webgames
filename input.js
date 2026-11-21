// Shared input: Kreo Mirage (or any) gamepad via the browser Gamepad API + keyboard fallback.
// Handles "standard" mapped pads AND non-standard ones (DirectInput / Switch / Android modes
// over Bluetooth often report the D-pad as a hat axis and use different button numbers).
const Input = (() => {
  const keys = {}, taps = {};
  let prev = {}, activeIndex = null;
  const state = { up:false, down:false, left:false, right:false, a:false, start:false,
                  aPressed:false, startPressed:false, padName:null, mapping:null };
  addEventListener('keydown', e => { keys[e.code] = true; taps[e.code] = true;
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); });
  addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('gamepadconnected', e => { console.log('Gamepad connected:', e.gamepad.id, e.gamepad.mapping); });

  function anyInput(p) {
    return p.buttons.some(b => b.pressed) || p.axes.some((a, i) => Math.abs(a) > 0.5 && !isHat(p, i, a));
  }
  // A resting hat switch often reads ~1.28 (out of range); treat that as "not pressed".
  function isHat(p, i, a) { return Math.abs(a) > 1.05; }

  function hatDir(v) { // hat axis: -1 up, -0.71 up-right, -0.43 right, ... 0.71 up-left, >1 = centre
    if (v === undefined || Math.abs(v) > 1.05) return {};
    const idx = Math.round((v + 1) / (2 / 7)); // 0..7
    return { up: [0,1,7].includes(idx), right: [1,2,3].includes(idx),
             down: [3,4,5].includes(idx), left: [5,6,7].includes(idx) };
  }

  function getPad() {
    const pads = [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter(p => p && p.connected);
    // Switch to whichever pad the player is actually pressing (skips phantom/virtual devices)
    for (const p of pads) if (anyInput(p)) { activeIndex = p.index; break; }
    return pads.find(p => p.index === activeIndex) || pads[0] || null;
  }

  function poll() {
    const gp = getPad();
    const b = i => !!(gp && gp.buttons[i] && gp.buttons[i].pressed);
    const ax = i => (gp && gp.axes[i] !== undefined && Math.abs(gp.axes[i]) <= 1.05) ? gp.axes[i] : 0;
    const DZ = 0.45;
    const k = c => keys[c] || taps[c];
    let up=false, down=false, left=false, right=false, a=false, start=false;
    if (gp) {
      up = ax(1) < -DZ; down = ax(1) > DZ; left = ax(0) < -DZ; right = ax(0) > DZ;
      if (gp.mapping === 'standard') {
        up ||= b(12); down ||= b(13); left ||= b(14); right ||= b(15);
        a = b(0) || b(1) || b(2) || b(3);
        start = b(9);
      } else {
        // Non-standard: D-pad may be a hat axis (often axes[9]) or axes 6/7 / 4/5, or buttons 12-15
        for (let i = 2; i < gp.axes.length; i++) {
          const v = gp.axes[i];
          if (i === 9 || Math.abs(v) > 1.05) { const h = hatDir(v); up ||= !!h.up; down ||= !!h.down; left ||= !!h.left; right ||= !!h.right; }
        }
        if (gp.axes.length >= 8) { up ||= gp.axes[7] < -DZ; down ||= gp.axes[7] > DZ; left ||= gp.axes[6] < -DZ; right ||= gp.axes[6] > DZ; }
        up ||= b(12); down ||= b(13); left ||= b(14); right ||= b(15);
        a = b(0) || b(1) || b(2) || b(3);           // any face button jumps/selects
        start = b(9) || b(11);                     // Start/Plus on most layouts
        start ||= b(8) && gp.buttons.length <= 12;   // some DInput pads put Start at 8
      }
    }
    const cur = {
      up: up || k('ArrowUp') || k('KeyW'), down: down || k('ArrowDown') || k('KeyS'),
      left: left || k('ArrowLeft') || k('KeyA'), right: right || k('ArrowRight') || k('KeyD'),
      a: a || k('Space') || k('KeyZ'), start: start || k('Enter') || k('Escape') || k('KeyP'),
    };
    state.aPressed = cur.a && !prev.a;
    state.startPressed = cur.start && !prev.start;
    Object.assign(state, cur);
    state.padName = gp ? gp.id : null;
    state.mapping = gp ? (gp.mapping || 'non-standard') : null;
    prev = cur;
    for (const c in taps) delete taps[c];
    return state;
  }
  function rumble(ms = 120, strength = 0.6) {
    const gp = getPad();
    gp?.vibrationActuator?.playEffect?.('dual-rumble',
      { duration: ms, strongMagnitude: strength, weakMagnitude: strength }).catch(() => {});
  }
  return { poll, rumble, state };
})();
