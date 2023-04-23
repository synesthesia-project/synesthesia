
export function trackMouseDown(move: (pos: {pageX: number, pageY: number}) => void, end: (pos: {pageX: number, pageY: number}) => void) {
  const mouseMove = (ev: MouseEvent) => {
    move({pageX: ev.pageX, pageY: ev.pageY});
  };

  const mouseUp = (ev: MouseEvent) => {
    end({pageX: ev.pageX, pageY: ev.pageY});
    window.removeEventListener('mousemove', mouseMove);
    window.removeEventListener('mouseup', mouseUp);
    window.removeEventListener('mouseleave', mouseUp);
  };

  window.addEventListener('mousemove', mouseMove);
  window.addEventListener('mouseup', mouseUp);
  window.addEventListener('mouseleave', mouseUp);
}

export function trackTouch(
  touch: React.Touch,
  move: (pos: {pageX: number, pageY: number}) => void,
  end: (pos: {pageX: number, pageY: number}) => void
    ) {
  const touchMove = (ev: TouchEvent) => {
    for (const t of Array.from(ev.changedTouches)) {
      if (t.identifier === touch.identifier) {
        move({pageX: t.pageX, pageY: t.pageY});
      }
    }
  };

  const touchEnd = (ev: TouchEvent) => {
    for (const t of Array.from(ev.changedTouches)) {
      if (t.identifier === touch.identifier) {
        end({pageX: t.pageX, pageY: t.pageY});
        window.removeEventListener('touchmove', touchMove);
        window.removeEventListener('touchend', touchEnd);
        window.removeEventListener('touchcancel', touchEnd);
      }
    }
  };

  window.addEventListener('touchmove', touchMove);
  window.addEventListener('touchend', touchEnd);
  window.addEventListener('touchcancel', touchEnd);
}
