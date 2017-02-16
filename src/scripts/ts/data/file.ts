import * as util from "../util/util";

export interface CueFile {
  layers: CueFileLayer[];
}

export interface CueFileLayer {
  kind: 'percussion';
  items: CueFileLayerItem[];
}

export interface CueFileLayerItem {
  timestamp: number;
}

export function emptyFile(): CueFile {
  return util.deepFreeze({
    layers: []
  });
}

export function addLayer(file: CueFile) {
  const layers = file.layers.slice();
  layers.push({
    kind: 'percussion',
    items: []
  });
  return util.deepFreeze({
    layers
  });
}
