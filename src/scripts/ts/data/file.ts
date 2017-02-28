import * as util from "../util/util";

export interface CueFile {
  lengthMillis: number;
  layers: CueFileLayer[];
}

export interface CueFileLayer {
  kind: 'percussion';
  events: CueFileEvent[];
}

export interface CueFileEvent {
  timestampMillis: number;
  states: CueFileEventState[];
}

export interface CueFileEventState {
  millisDelta: number;
  values: {
    amplitude: number;
    pitch: number;
  }
}

export function emptyFile(lengthMillis: number): CueFile {
  return util.deepFreeze({
    lengthMillis,
    layers: []
  });
}

export function setLength(file: CueFile, lengthMillis: number): CueFile {
  return util.deepFreeze({
    lengthMillis,
    layers: file.layers
  });
}

export function addLayer(file: CueFile): CueFile {
  const layers = file.layers.slice();
  layers.push({
    kind: 'percussion',
    events: []
  });
  return util.deepFreeze({
    lengthMillis: file.lengthMillis,
    layers
  });
}

export function addLayerItem(file: CueFile, layer: number, timestampMillis: number): CueFile {
  return util.deepFreeze({
    lengthMillis: file.lengthMillis,
    layers: file.layers.map((l, i) => {
      if (i !== layer)
        return l;
      // Add item
      const events = l.events.slice();
      events.push({
        timestampMillis,
        states: []
      });
      return {
        kind: l.kind,
        events
      }
    })
  });
}
