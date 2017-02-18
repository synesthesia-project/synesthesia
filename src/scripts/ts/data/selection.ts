import * as util from "../util/util";

/**
 * The currently selected elements on the screen
 */
export interface Selection {
  layers: number[];
}

export function initialSelection(): Selection {
  return util.deepFreeze({
    layers: []
  });
}

export function toggleLayer(selection: Selection, layer: number) {
  const layers = selection.layers.slice();
  const index = layers.indexOf(layer);
  if (index < 0)
    layers.push(layer);
  else
    layers.splice(index, 1);
  return util.deepFreeze({
    layers
  });
}
