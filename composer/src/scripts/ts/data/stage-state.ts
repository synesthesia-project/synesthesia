import * as util from '@synesthesia-project/core/lib/util';

/**
 * By what ratio should we zoom in / out by in a single step.
 */
const ZOOM_STEP = 1.25;
/**
 * How much should we move left / right by (in a single step) as a proportion of
 * the current viewport.
 */
const ZOOM_MOVE_AMNT = 0.1;
const MAX_ZOOM = 100; // 10000 %

export interface StageState {
  zoomPan: ZoomPanState;
}

export type ZoomPanState = {
  /**
   * Locked to follow cursor
   */
  type: 'locked';
  /**
   * * `1`: default (full timeline)
   * * `> 1`: zoomed-in
   */
  zoomLevel: number;
} | {
  /**
   * User is free to move the 
   */
  type: 'unlocked';
  /**
   * * `1`: default (full timeline)
   * * `> 1`: zoomed-in
   */
  zoomLevel: number;
  /**
   * Between 0 and 1
   */
  position: number;
}

/**
 * The initial state of the stage
 */
export function initialState(): StageState {
  return util.deepFreeze({
    zoomPan: {
      type: 'unlocked',
      zoomLevel: 1,
      position: 0
    }
  });
}

function modifyZoom(current: ZoomPanState, viewportOrigin: number, ratio: number): ZoomPanState {
  let zoomLevel = current.zoomLevel * ratio;
  if (zoomLevel > MAX_ZOOM)
    zoomLevel = MAX_ZOOM;
  if (zoomLevel < 1)
    zoomLevel = 1;
  if (current.type === 'locked') {
    return util.deepFreeze({
      type: 'locked',
      zoomLevel
    });
  }
  // TODO: Calculate new position based on zoomOrigin
  const viewportSize = 1 / current.zoomLevel;
  const hidden = 1 - viewportSize;
  const startPoint = hidden * current.position;
  const endPoint = startPoint + viewportSize;
  const newSize = 1 / zoomLevel;
  const indent = viewportSize - newSize;
  let newStart = startPoint + indent * viewportOrigin;
  if (newStart < 0)
    newStart = 0;
  let newEnd = endPoint - indent * (1 - viewportOrigin);
  if (newEnd > 1)
    newEnd = 1;
  // Calculate position based on new start and end points
  let position = newStart / (newStart + 1 - newEnd);
  if (isNaN(position))
    position = 0;
  return util.deepFreeze({
    type: 'unlocked',
    zoomLevel,
    position
  })
  return current;
  // TODO
  /*
  const minSize = 1 / MAX_ZOOM;
  const maxSize = 1;
  const currentSize = current.endPoint - current.startPoint;
  const newSize = util.restrict(currentSize / ratio, minSize, maxSize);
  // Amount we are indenting / unindenting the zoom by
  const indent = currentSize - newSize;
  // The new bounds of the viewport
  const newStart = current.startPoint + indent * zoomOrigin;
  const newEnd = current.endPoint - indent * (1 - zoomOrigin);
  if (newStart < MIN_DELTA)
    return {startPoint: 0, endPoint: newSize};
  if (newEnd > 1 - MIN_DELTA)
    return {startPoint: 1 - newSize, endPoint: 1};
  return {startPoint: newStart, endPoint: newEnd};
  */
}

function moveZoom(current: ZoomPanState, amnt: number): ZoomPanState {
  if (current.type === 'locked')
    return current;
  const currentSize = 1 / current.zoomLevel;
  let position = current.position + currentSize * amnt;
  if (position < 0)
    position = 0;
  if (position > 1)
    position = 1;
  return util.deepFreeze({
    type: 'unlocked',
    zoomLevel: current.zoomLevel,
    position
  });
}

/**
 * Zoom and have the focal point of the zoom at zoomOrigin, where zoomOrigin is
 * some value between 0 and 1, where 0 is the start of the current viewport, and
 * 1 is at the end.
 * 
 * @param viewportOrigin Where in the viewport the mouse cursor is.
 *                       Between `0` and `1`,
 *                       where `0` is the start of the current viewport,
 *                       and `1` is at the end.
 */
export function zoom(current: StageState, viewportOrigin: number, ratio: number): StageState {
  return util.deepFreeze({
    zoomPan: modifyZoom(current.zoomPan, viewportOrigin, ratio)
  });
}

/**
 * Zoom in one step
 */
export function zoomIn(current: StageState, viewportOrigin: number): StageState {
  return zoom(current, viewportOrigin, ZOOM_STEP);
}

/**
 * Zoom out one step
 */
export function zoomOut(current: StageState, viewportOrigin: number): StageState {
  return zoom(current, viewportOrigin, 1 / ZOOM_STEP);
}

/**
 * Move the zoom left by one step.
 */
export function zoomMoveLeft(current: StageState): StageState {
  return util.deepFreeze({
    zoomPan: moveZoom(current.zoomPan, -ZOOM_MOVE_AMNT)
  });
}

/**
 * Move the zoom right by one step.
 */
export function zoomMoveRight(current: StageState): StageState {
  return util.deepFreeze({
    zoomPan: moveZoom(current.zoomPan, ZOOM_MOVE_AMNT)
  });
}

interface Viewport {
  /**
   * How big is the viewport compared to the timeline?
   */
  viewportSize: number;
  /**
   * How much of the timeline is hidden? (outside of the viewport)
   */
  hidden: number;
  /**
   * Where on the timeline does the viewpoint start? (`0` - `1`)
   */
  startPoint: number;
  /**
   * Where on the timeline does the viewpoint end? (`0` - `1`)
   */
  endPoint: number;
}

function getPositionForLockedViewport(zoomPan: ZoomPanState, playerPosition: number) {
  const viewportSize = 1 / zoomPan.zoomLevel;
  const hidden = 1 - viewportSize;
  let startPoint = playerPosition - viewportSize / 2;
  if (startPoint < 0) return 0;
  let endPoint = startPoint + viewportSize;
  if (endPoint > 1) return 1;
  return startPoint / hidden;
}

export function getZoomPanViewport(zoomPan: ZoomPanState, playerPosition: number): Viewport {
  const viewportSize = 1 / zoomPan.zoomLevel;
  const hidden = 1 - viewportSize;
  /**
   * Value between 0 - 1, indicating how far the view is slid
   * TODO: calculate for locked
   */
  const position = (zoomPan.type === 'unlocked') ?
    zoomPan.position :
    getPositionForLockedViewport(zoomPan, playerPosition);
  const startPoint = hidden * position;
  const endPoint = startPoint + viewportSize;
  // const currentSize = zoom.endPoint - zoom.startPoint;
  return {
    viewportSize,
    hidden,
    startPoint,
    endPoint
  };
}

/**
 * Given a zoom state, work out what the left and right margins would be
 * relative to the size of the viewport.
 *
 * I.E: Given:
 *
 *  |<-- left -->|<-- viewport -->|<-- right -->|
 *  |<------------- full timeline ------------->|
 *
 * calculate the sizes of lm and rm relative to the size of the viewport
 */
export function relativeZoomMargins(zoomPan: ZoomPanState, playerPosition: number) {
  const { viewportSize, startPoint, endPoint } = getZoomPanViewport(zoomPan, playerPosition);
  // const currentSize = zoom.endPoint - zoom.startPoint;
  return {
    left: startPoint / viewportSize,
    right: (1 - endPoint) / viewportSize
  };
}

export function lockZoomAndPan(current: ZoomPanState) {
  return util.deepFreeze<ZoomPanState>({
    type: 'locked',
    zoomLevel: current.zoomLevel
  });
}

export function unlockZoomAndPan(current: ZoomPanState, playerPosition: number) {
  return util.deepFreeze<ZoomPanState>({
    type: 'unlocked',
    zoomLevel: current.zoomLevel,
    position: getPositionForLockedViewport(current, playerPosition)
  });
}