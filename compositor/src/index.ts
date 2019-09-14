import { Compositor } from './lib/compositor';
import { PixelInfo } from './lib/modules';
import { RGBAColor } from './lib/color';

export function tee<T>(f: (v: T) => void, v: T) {
  f(v);
  return v;
}

export { PixelInfo, RGBAColor, Compositor };
