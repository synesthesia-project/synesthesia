import * as fs from 'fs';
import * as path from 'path';
import svgson from 'svgson';
import { promisify } from 'util';

import { HARDCODED_MAPS, KEYBOARD_PIXEL_MAPS } from './data';

const readFile = promisify(fs.readFile);

const PIXELMAP_FOLDER = path.join(
  path.dirname(path.dirname(__dirname)),
  'pixelmaps'
);

export interface SVGKey {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PixelMapKey = {
  i: number;
  centreX: number;
  centreY: number;
  svg?: SVGKey;
};

export type PixelMapRow = {
  keys: PixelMapKey[];
};

export type PixelMap = {
  rows: PixelMapRow[];
};

export async function getPixelMap(deviceType: string) {
  console.log('getPixelMap', deviceType);

  const map = HARDCODED_MAPS[deviceType];
  if (map) return map;

  const data = KEYBOARD_PIXEL_MAPS[deviceType];
  if (!data) return null;

  // Pull the key coordinate data from the SVG file
  const svgXML = await readFile(path.join(PIXELMAP_FOLDER, data.svg), 'utf8');
  const svgJSON = await svgson(svgXML);

  /**
   * Key rectangles from the SVG file that are yet to be mapped to
   * keys specified in KEYBOARD_PIXEL_MAPS
   */
  const unmappedKeys = new Map<number, SVGKey[]>();
  if (svgJSON.name === 'svg') {
    for (const rect of svgJSON.children) {
      if (rect.name !== 'rect') continue;
      const key: SVGKey = {
        x: Number.parseFloat(rect.attributes.x),
        y: Number.parseFloat(rect.attributes.y),
        width: Number.parseFloat(rect.attributes.width),
        height: Number.parseFloat(rect.attributes.height),
      };
      let row = unmappedKeys.get(key.y);
      if (!row) {
        unmappedKeys.set(key.y, (row = []));
      }
      row.push(key);
    }
  }

  // Order each key on each row by x position
  unmappedKeys.forEach((keys) => keys.sort((a, b) => a.x - b.x));

  // Map each key in KEYBOARD_PIXEL_MAPS to it's svg counterpart
  const rows = data.rows.map((row) => {
    const r: PixelMapRow = {
      keys: [],
    };

    const unmappedRow = unmappedKeys.get(row.svgY);
    if (!unmappedRow) throw new Error(`invalid svg y value: ${row.svgY}`);
    for (const key of row.keys) {
      // TODO: allow specifying override Y or X values for keys
      // with abnormal positions
      const svg = unmappedRow.shift();
      if (!svg)
        throw new Error(`ran out of keys for row: ${row.svgY} at key ${key.i}`);
      r.keys.push({
        i: key.i,
        centreX: svg.x + svg.width / 2,
        centreY: svg.y + svg.height / 2,
        svg,
      });
    }

    return r;
  });

  const result: PixelMap = { rows };
  console.log(result);
  return result;
}
