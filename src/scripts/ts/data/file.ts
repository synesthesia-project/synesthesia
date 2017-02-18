import * as util from "../util/util";

export interface CueFile {
  layers: CueFileLayer[];
}

export interface CueFileLayer {
  kind: 'percussion';
  items: CueFileLayerItem[];
}

export interface CueFileLayerItem {
  timestampMillis: number;
}

export function emptyFile(): CueFile {
  return util.deepFreeze({
    layers: []
  });
}

export function addLayer(file: CueFile): CueFile {
  const layers = file.layers.slice();
  layers.push({
    kind: 'percussion',
    items: []
  });
  return util.deepFreeze({
    layers
  });
}

export function addLayerItem(file: CueFile, layer: number, timestampMillis: number): CueFile {
  return util.deepFreeze({
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
