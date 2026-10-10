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
  // a tap anywhere on the play field is a jump too (the biggest target there is)
  on(field, 'pointerdown', e => { if (!enabled() || e.button > 0) return; e.preventDefault(); jump('touch') });
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

  return { on, destroy() { while (offs.length) offs.pop()(); down.clear() } };
}
