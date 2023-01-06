import * as jQuery from 'jquery';
import { ActiveModifierKeys } from '../../util/input';

const body = jQuery('body');

type MouseCallback = (
  x: number,
  y: number,
  modifiers: ActiveModifierKeys
) => void;

export function captureDragging(
  onMove: MouseCallback,
  onEnd: MouseCallback,
  onCancel: MouseCallback,
  cursor?: 'default' | 'pointer' | 'move'
) {
  const div = document.createElement('div');
  const $div = jQuery(div);
  $div.css({
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  });

  if (cursor) $div.css({ cursor });

  // Setup listeners
  $div
    .on('mousemove', (e) => {
      e.preventDefault();
      onMove(e.pageX, e.pageY, e);
    })
    .on('mouseout', (e) => {
      e.preventDefault();
      onCancel(e.pageX, e.pageY, e);
      $div.remove();
    })
    .on('mouseup', (e) => {
      e.preventDefault();
      onEnd(e.pageX, e.pageY, e);
      $div.remove();
    });

  body.append($div);
}

/** Minimum number of pixels to drag before it's considered a drag */
export const MIN_DRAG_THRESHOLD = 5;
