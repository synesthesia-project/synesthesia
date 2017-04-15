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
  events: ItemsSelection;
}

export function initialSelection(): Selection {
  return util.deepFreeze({
    layers: [],
    events: []
  });
}

export function clearSelectedEvents(selection: Selection): Selection {
  return util.deepFreeze({
    layers: selection.layers,
    events: []
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
    events: selection.events
  });
}

export function handleItemSelectionChange(
    selection: Selection,
    e: React.MouseEvent<{}>,
    layer: number,
    itemIndexes: number[]): Selection  {
  let events: ItemsSelection;
  if (e.ctrlKey) {
    // Toggle each item in the list
    const existingIndexesForLayer = new Set(
      selection.events.filter(i => i.layer === layer).map(i => i.index)
    );
    const itemIndexesSet = new Set(itemIndexes);
    // Remove existing items
    events = selection.events.filter(i => i.layer !== layer || !itemIndexesSet.has(i.index));
    // Add not-existing items
    events = events.concat(
      itemIndexes.filter(i => !existingIndexesForLayer.has(i)).map(index => ({layer, index}))
    );
  } else if (e.shiftKey) {
    // Add to existing items (but ensure no duplicates)
    const existingIndexesForLayer = new Set(
      selection.events.filter(i => i.layer === layer).map(i => i.index)
    );
    events = selection.events.concat(
      itemIndexes
      .filter(index => !existingIndexesForLayer.has(index))
      .map(index => ({layer, index}))
    );
  } else {
    // Fresh selection
    events = itemIndexes.map(index => ({layer, index}));
  }
  return util.deepFreeze({
    layers: selection.layers,
    events
  });
}
