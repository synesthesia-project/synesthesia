
export function switchToMouseMode(ev: MouseEvent) {
  if (ev.movementX === 0 && ev.movementY === 0) return;
  document.body.classList.remove('touch-mode');
}

export function switchToTouchMode(ev: TouchEvent) {
  ev.preventDefault();
  document.body.classList.add('touch-mode');
}

export function initialiseListeners() {
  window.addEventListener('mousemove', switchToMouseMode);
  window.addEventListener('touchstart', switchToTouchMode, {passive: false});
  // window.addEventListener('contextmenu', (ev) => {
  //   ev.preventDefault();
  // });
}
