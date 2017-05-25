import * as file from './file';
import * as selection from './selection';
import * as util from '../util/util';

/*
 * Build up a data structure for quick lookup of selected events
 * layer -> {set of event ids}
 */
function buildUpSelectionSet(selection: selection.Selection) {
  const selectedEvents = new Map<number, Set<number>>();
  for (const e of selection.events) {
    let layerSet = selectedEvents.get(e.layer);
    if (!layerSet)
      selectedEvents.set(e.layer, layerSet = new Set<number>());
    layerSet.add(e.index);
  }
  return selectedEvents;
}

export function updateStartTimeForSelectedEvents(
    cueFile: file.CueFile,
    selection: selection.Selection,
    newStartTime: number): file.CueFile {

  // Ignore empty selections
  if (selection.events.length === 0)
    return cueFile;

  function events() {
    return selection.events.map(e => cueFile.layers[e.layer].events[e.index]);
  }

  // Get the current earliest start time for any event of the selection
  const start = Math.min.apply(null, events().map(e => e.timestampMillis));

  // Make sure the start time is no less than 0
  newStartTime = Math.max(0, newStartTime);

  // Don't change the file if the start time hasn't changed
  if (start === newStartTime)
    return cueFile;

  const shift = newStartTime - start;
  // Don't change the file if shifting less than 0.1 ms
  if (shift < 0.1 && shift > 0.1)
    return cueFile;

  const selectedEvents = buildUpSelectionSet(selection);

  function convertLayer<K, S, V>(
      selectedEvents: Set<number>,
      layer: file.CueFileLayer<K, S, V>): file.CueFileLayer<K, S, V> {
    return {
      kind: layer.kind,
      settings: layer.settings,
      events: layer.events.map((e, i) => {
        if (selectedEvents.has(i)) {
          return {
            timestampMillis: e.timestampMillis + shift,
            states: e.states
          };
        } else {
          return e;
        }
      })
    };
  }

  const newLayers = cueFile.layers.map((layer, i) => {
    const layerSet = selectedEvents.get(i);
    if (!layerSet)
      // Layer unchanged
      return layer;
    return file.convertLayer(layer, l => convertLayer(layerSet, l));
  });

  return util.deepFreeze({
    lengthMillis: cueFile.lengthMillis,
    layers: newLayers
  });
}

export function deleteSelectedEvents(
    cueFile: file.CueFile,
    selection: selection.Selection): file.CueFile {

  // Ignore empty selections
  if (selection.events.length === 0)
    return cueFile;

  const selectedEvents = buildUpSelectionSet(selection);

  const newLayers = cueFile.layers.map((layer, i) => {
    const layerSet = selectedEvents.get(i);
    if (!layerSet)
      // Layer unchanged
      return layer;
    return file.convertLayer(layer, l => ({
      kind: layer.kind,
      settings: layer.settings,
      events: layer.events.filter((e, i) => !layerSet.has(i))
    }));
  });

  return util.deepFreeze({
    lengthMillis: cueFile.lengthMillis,
    layers: newLayers
  });
}
