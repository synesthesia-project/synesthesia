import { RGBAColor } from '../color';

/**
 * Meta information about the pixel map
 */
export interface Map {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface PixelInfo<Data> {
  x: number;
  y: number;
  data: Data;
}

export interface CompositorModule<State> {
  render(map: Map, pixels: PixelInfo<unknown>[], state: State): RGBAColor[];
}
