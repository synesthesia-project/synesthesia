import * as React from "react";
import * as util from "../util/util";

type ItemsSelection = {layer: number, index: number}[];

/**
 * The currently selected elements on the screen
 */
export interface Selection {
  /**
   * Layers selected for adding new items on keypresses
   */
  layers: number[];
  /**
   * Items currently selected for modification
   */
  items: ItemsSelection;
}

export function initialSelection(): Selection {
  return util.deepFreeze({
    layers: [],
    items: []
  });
}

export function toggleLayer(selection: Selection, layer: number): Selection  {
  const layers = selection.layers.slice();
  const index = layers.indexOf(layer);
  if (index < 0)
    layers.push(layer);
  else
    layers.splice(index, 1);
  return util.deepFreeze({
    layers,
    items: selection.items
  });
}

export function handleItemSelectionChange(
    selection: Selection,
    e: React.MouseEvent<{}>,
    layer: number,
    itemIndexes: number[]): Selection  {
  let items: ItemsSelection;
  if (e.ctrlKey) {
    // Toggle each item in the list
    const existingIndexesForLayer = new Set(
      selection.items.filter(i => i.layer === layer).map(i => i.index)
    );
    const itemIndexesSet = new Set(itemIndexes);
    // Remove existing items
    items = selection.items.filter(i => i.layer !== layer || !itemIndexesSet.has(i.index));
    // Add not-existing items
    items = items.concat(
      itemIndexes.filter(i => !existingIndexesForLayer.has(i)).map(index => ({layer, index}))
    );
  } else if (e.shiftKey) {
    // Add to existing items (but ensure no duplicates)
    const existingIndexesForLayer = new Set(
      selection.items.filter(i => i.layer === layer).map(i => i.index)
    );
    items = selection.items.concat(
      itemIndexes
      .filter(index => !existingIndexesForLayer.has(index))
      .map(index => ({layer, index}))
    );
  } else {
    // Fresh selection
    items = itemIndexes.map(index => ({layer, index}));
  }
  return util.deepFreeze({
    layers: selection.layers,
    items
  });
}
