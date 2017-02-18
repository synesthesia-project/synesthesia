import * as util from "../util/util";

export interface CueFile {
  lengthMillis: number;
  layers: CueFileLayer[];
}

export interface CueFileLayer {
  kind: 'percussion';
  items: CueFileLayerItem[];
}

export interface CueFileLayerItem {
  timestampMillis: number;
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
    items: []
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
      const items = l.items.slice();
      items.push({
        timestampMillis
      });
      return {
        kind: l.kind,
        items
      }
    })
  });
}
