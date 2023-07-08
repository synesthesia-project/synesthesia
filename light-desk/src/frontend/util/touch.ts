export function switchToMouseMode(ev: MouseEvent) {
  if (ev.movementX === 0 && ev.movementY === 0) return;
  document.body.classList.remove('touch-mode');
}

export function switchToTouchMode(_ev: TouchEvent) {
  document.body.classList.add('touch-mode');
}

export function initialiseListeners() {
  window.addEventListener('mousemove', switchToMouseMode);
  window.addEventListener('touchstart', switchToTouchMode, { passive: false });
}

