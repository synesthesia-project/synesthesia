
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
