import { useState } from 'react';
import { play } from './audio';

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
  window.addEventListener('contextmenu', (e) => {
    if ((e as PointerEvent).pointerType === 'touch') {
      e.preventDefault();
    }
  });
}

export const usePressable = (
  click: () => void
): {
  touching: boolean;
  handlers: {
    onClick: React.MouseEventHandler<unknown>;
    onTouchStart: React.TouchEventHandler<unknown>;
    onTouchEnd: React.TouchEventHandler<unknown>;
  };
} => {
  const [touching, setTouching] = useState(false);

  return {
    touching,
    handlers: {
      onClick: click,
      onTouchStart: (event) => {
        play('touch');
        event.preventDefault();
        setTouching(true);
      },
      onTouchEnd: (event) => {
        event.preventDefault();
        setTouching(false);
        click();
        play('beep2');
      },
    },
  };
};
