import * as util from '../util/util';

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
const MIN_DELTA = 0.0005;

export interface StageState {
  zoom: ZoomState;
}

export interface ZoomState {
  /**
   * Start point of the zoomed-in section, between 0 and 1.
   */
  startPoint: number;
  /**
   * End point of the zoomed-in section, between 0 and 1.
   */
  endPoint: number;
}

/**
 * The initial state of the stage
 */
export function initialState(): StageState {
  return util.deepFreeze({
    zoom: {
      startPoint: 0,
      endPoint: 1
    }
  });
}

function modifyZoom(current: ZoomState, zoomOrigin: number, ratio: number): ZoomState {
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
}

function moveZoom(current: ZoomState, amnt: number): ZoomState {
  const currentSize = current.endPoint - current.startPoint;
  const moveAmnt = currentSize * amnt;
  const newStart = current.startPoint + moveAmnt;
  const newEnd = current.endPoint + moveAmnt;
  if (newStart < MIN_DELTA)
    return {startPoint: 0, endPoint: currentSize};
  if (newEnd > 1 - MIN_DELTA)
    return {startPoint: 1 - currentSize, endPoint: 1};
  return {startPoint: newStart, endPoint: newEnd};
}

/**
 * Zoom and have the focal point of the zoom at zoomOrigin, where zoomOrigin is
 * some value between 0 and 1, where 0 is the start of the current viewport, and
 * 1 is at the end.
 */
export function zoom(current: StageState, zoomOrigin: number, ratio: number): StageState {
  return util.deepFreeze({
    zoom: modifyZoom(current.zoom, zoomOrigin, ratio)
  });
}

/**
 * Zoom in one step
 */
export function zoomIn(current: StageState, zoomOrigin: number): StageState {
  return zoom(current, zoomOrigin, ZOOM_STEP);
}

/**
 * Zoom out one step
 */
export function zoomOut(current: StageState, zoomOrigin: number): StageState {
  return zoom(current, zoomOrigin, 1 / ZOOM_STEP);
}

/**
 * Move the zoom left by one step.
 */
export function zoomMoveLeft(current: StageState): StageState {
  return util.deepFreeze({
    zoom: moveZoom(current.zoom, -ZOOM_MOVE_AMNT)
  });
}

/**
 * Move the zoom right by one step.
 */
export function zoomMoveRight(current: StageState): StageState {
  return util.deepFreeze({
    zoom: moveZoom(current.zoom, ZOOM_MOVE_AMNT)
  });
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
export function relativeZoomMargins(zoom: ZoomState) {
  const currentSize = zoom.endPoint - zoom.startPoint;
  return {
    left: zoom.startPoint / currentSize,
    right: (1 - zoom.endPoint) / currentSize
  };
}
