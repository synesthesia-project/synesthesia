import { Compositor } from './lib/compositor';
import { PixelInfo } from './lib/modules';
import * as color from './lib/color';

const { RGBAColor } = color;

export function tee<T>(f: (v: T) => void, v: T) {
  f(v);
  return v;
}

export { color, PixelInfo, RGBAColor, Compositor };
