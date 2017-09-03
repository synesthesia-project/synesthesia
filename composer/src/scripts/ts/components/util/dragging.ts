import {ActiveModifierKeys} from '../../util/input';

const body = $('body');

type MouseCallback = (x: number, y: number, modifiers: ActiveModifierKeys) => void;

export function captureDragging(
    onMove: MouseCallback,
    onEnd: MouseCallback,
    onCancel: MouseCallback) {
  const div = document.createElement('div');
  const $div = $(div);
  $div.css({
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  });

  // Setup listeners
  $div.on('mousemove', e => {
    e.preventDefault();
    onMove(e.pageX, e.pageY, e);
  }).on('mouseout', e => {
    e.preventDefault();
    onCancel(e.pageX, e.pageY, e);
    $div.remove();
  }).on('mouseup', e => {
    e.preventDefault();
    onEnd(e.pageX, e.pageY, e);
    $div.remove();
  });

  body.append($div);
}
