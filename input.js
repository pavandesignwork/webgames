// Shared input for all games: PS-style controller (Kreo Mirage) or any gamepad, plus keyboard.
//
// CONTROLS (same in every game):
//   D-pad / Left stick  = move
//   ✕ (and □ / △)       = jump / select
//   OPTIONS             = pause
//   L1 / L2 / SHARE / HOME / TOUCHPAD = back to the menu
//   Keyboard: arrows/WASD move, Space = jump, Enter/P = pause, Esc/Backspace = menu
const Input = (() => {
  const keys = {}, taps = {};
  let prev = {}, activeIndex = null;
  const state = { up:false, down:false, left:false, right:false, a:false, start:false, back:false,
                  aPressed:false, startPressed:false, backPressed:false, padName:null, mapping:null, btn:{} };
  addEventListener('keydown', e => { keys[e.code] = true; taps[e.code] = true;
    if (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Backspace') e.preventDefault(); });
  addEventListener('keyup', e => { keys[e.code] = false; });

  const OFF = v => v === undefined || Math.abs(v) > 1.05; // resting hat switches read ~1.28
  function hatDir(v) { // -1 = up, then clockwise in steps of 2/7
    if (OFF(v)) return {};
    const i = Math.round((v + 1) / (2 / 7));
    return { up:[0,1,7].includes(i), right:[1,2,3].includes(i), down:[3,4,5].includes(i), left:[5,6,7].includes(i) };
  }

  // Turn any gamepad into named PS-style buttons.
  function named(gp) {
    const n = {};
    if (!gp) return n;
    const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const v = i => (gp.buttons[i] ? gp.buttons[i].value : 0);
    const ax = i => OFF(gp.axes[i]) ? 0 : gp.axes[i];
    n.lx = ax(0); n.ly = ax(1);
    if (gp.mapping === 'standard') {          // XInput / browser-recognised DualShock layout
      Object.assign(n, { cross:b(0), circle:b(1), square:b(2), triangle:b(3), l1:b(4), r1:b(5),
        l2:b(6), r2:b(7), l2v:v(6), r2v:v(7), share:b(8), options:b(9), l3:b(10), r3:b(11),
        dup:b(12), ddown:b(13), dleft:b(14), dright:b(15), home:b(16), touchpad:b(17) });
      n.rx = ax(2); n.ry = ax(3);
    } else {                                  // raw DirectInput PS-style layout (common over Bluetooth)
      Object.assign(n, { square:b(0), cross:b(1), circle:b(2), triangle:b(3), l1:b(4), r1:b(5),
        l2:b(6), r2:b(7), l2v:v(6), r2v:v(7), share:b(8), options:b(9), l3:b(10), r3:b(11),
        home:b(12), touchpad:b(13) });
      let h = {};
      if (gp.axes.length > 9 && !OFF(gp.axes[9])) h = hatDir(gp.axes[9]);
      else for (let i = 2; i < gp.axes.length; i++) if (Math.abs(gp.axes[i]) > 1.05 || i === 9) { const d = hatDir(gp.axes[i]); if (d.up||d.down||d.left||d.right) h = d; }
      n.dup = !!h.up; n.ddown = !!h.down; n.dleft = !!h.left; n.dright = !!h.right;
      n.rx = ax(2); n.ry = gp.axes.length > 5 ? ax(5) : ax(3);
    }
    return n;
  }

  function getPad() {
    const pads = [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter(p => p && p.connected);
    for (const p of pads) if (p.buttons.some(x => x.pressed)) { activeIndex = p.index; break; }
    return pads.find(p => p.index === activeIndex) || pads[0] || null;
  }

  function poll() {
    const gp = getPad(), n = named(gp), k = c => keys[c] || taps[c], DZ = 0.45;
    const cur = {
      up:    n.dup    || n.ly < -DZ || k('ArrowUp')    || k('KeyW'),
      down:  n.ddown  || n.ly >  DZ || k('ArrowDown')  || k('KeyS'),
      left:  n.dleft  || n.lx < -DZ || k('ArrowLeft')  || k('KeyA'),
      right: n.dright || n.lx >  DZ || k('ArrowRight') || k('KeyD'),
      a:     n.cross || n.square || n.triangle || k('Space') || k('KeyZ'),
      start: n.options || k('Enter') || k('KeyP'),
      back:  n.l1 || n.l2 || n.share || n.home || n.touchpad || k('Escape') || k('Backspace'),
    };
    state.aPressed = cur.a && !prev.a;
    state.startPressed = cur.start && !prev.start;
    state.backPressed = cur.back && !prev.back;
    Object.assign(state, cur);
    state.btn = n;
    state.padName = gp ? gp.id : null;
    state.mapping = gp ? (gp.mapping || 'raw') : null;
    prev = cur;
    for (const c in taps) delete taps[c];
    // Back to menu from any game page
    if (state.backPressed && Input.autoBack && !/index\.html$|\/$/.test(location.pathname)) location.href = 'index.html';
    return state;
  }
  function rumble(ms = 120, strength = 0.6) {
    getPad()?.vibrationActuator?.playEffect?.('dual-rumble',
      { duration: ms, strongMagnitude: strength, weakMagnitude: strength }).catch(() => {});
  }
  return { poll, rumble, named, state, autoBack: true };
})();
