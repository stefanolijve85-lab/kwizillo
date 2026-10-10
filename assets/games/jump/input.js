// Mike & Mia: Jump & Slide — input. Pointer events on the two buttons (each its
// own finger, so jump and slide work together), a tap on the play field also
// jumps, and the keyboard: Space / ArrowUp / W jump, ArrowDown / S slide,
// Escape / P pause. A held key never repeats a press (event.repeat is ignored),
// so keyboard auto-repeat can never fire the double jump.
//
// Every listener is registered through `on`, so destroy() removes exactly what
// was added; `live` counts them for the leak test.
export const live = { listeners: 0, raf: 0, observers: 0 };

export function createInput({ root, jumpBtn, slideBtn, field }, { jump, slide, pause, enabled }) {
  const offs = [];
  const on = (el, type, fn, opts) => { el.addEventListener(type, fn, opts); live.listeners++; offs.push(() => { el.removeEventListener(type, fn, opts); live.listeners-- }) };
  const down = new Set();
  const press = (btn, fn) => e => {
    if (!enabled()) return;
    e.preventDefault();
    try { btn.setPointerCapture?.(e.pointerId) } catch { }
    if (down.has(btn.id + e.pointerId)) return;   // the same finger cannot press twice
    down.add(btn.id + e.pointerId); btn.classList.add('down'); fn('touch');
  };
  const lift = btn => e => { down.delete(btn.id + e.pointerId); if (![...down].some(k => k.startsWith(btn.id))) btn.classList.remove('down') };
  for (const [btn, fn] of [[jumpBtn, jump], [slideBtn, slide]]) {
    on(btn, 'pointerdown', press(btn, fn));
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) on(btn, t, lift(btn));
    on(btn, 'contextmenu', e => e.preventDefault());
  }
  // Gestures on the play field, each finger tracked on its own:
  //   a tap (let go without swiping down) = jump — a second tap in the air is the double jump
  //   a swipe up = jump, as soon as the finger has moved SWIPE px up
  //   a swipe down = slide, as soon as the finger has moved SWIPE px down (within SWIPE_MS)
  // Nothing fires on touching down, so a swipe down is never also a jump.
  const SWIPE = 30, SWIPE_MS = 250, touches = new Map();
  on(field, 'pointerdown', e => {
    if (!enabled() || e.button > 0) return; e.preventDefault();
    try { field.setPointerCapture?.(e.pointerId) } catch { }
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), done: false });
  });
  on(field, 'pointermove', e => {
    const p = touches.get(e.pointerId); if (!p || p.done || !enabled()) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (Math.abs(dy) < SWIPE || Math.abs(dy) < Math.abs(dx)) return;
    if (dy > 0 && performance.now() - p.t <= SWIPE_MS) { p.done = true; slide('swipe') }
    else if (dy < 0) { p.done = true; jump('swipe') }
  });
  on(field, 'pointerup', e => {
    const p = touches.get(e.pointerId); touches.delete(e.pointerId);
    if (!p || p.done || !enabled()) return;
    // let go: a jump, unless the finger went clearly down (a slow swipe down is no jump either)
    if (e.clientY - p.y >= SWIPE) return;
    jump('touch');
  });
  for (const t of ['pointercancel', 'lostpointercapture']) on(field, t, e => { if (t === 'pointercancel') touches.delete(e.pointerId) });
  // no scrolling, zooming or callouts inside the game
  const stop = e => e.preventDefault();
  on(root, 'touchmove', stop, { passive: false });
  on(root, 'gesturestart', stop, { passive: false });
  on(root, 'dblclick', stop);

  const JUMP = new Set(['Space', 'ArrowUp', 'KeyW']), SLIDE = new Set(['ArrowDown', 'KeyS']), PAUSE = new Set(['Escape', 'KeyP']);
  on(window, 'keydown', e => {
    if (!root.isConnected) return;
    const k = e.code;
    if (!JUMP.has(k) && !SLIDE.has(k) && !PAUSE.has(k)) return;
    // a key on a focused menu button keeps working as a click
    if (k === 'Space' && e.target instanceof HTMLButtonElement && !e.target.closest('.kj-controls')) return;
    e.preventDefault();
    if (e.repeat) return;
    if (PAUSE.has(k)) { pause(); return }
    if (!enabled()) return;
    if (JUMP.has(k)) { jumpBtn.classList.add('down'); jump('key') } else { slideBtn.classList.add('down'); slide('key') }
  });
  on(window, 'keyup', e => { if (JUMP.has(e.code)) jumpBtn.classList.remove('down'); if (SLIDE.has(e.code)) slideBtn.classList.remove('down') });

  return { on, destroy() { while (offs.length) offs.pop()(); down.clear(); touches.clear() } };
}
