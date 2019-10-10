import { RGBAColor } from '../color';
import { PixelMap, PixelInfo, CompositorModule } from './';

/**
 * Module that fills all pixels with a given color
 */
export default class FillModule<State> implements CompositorModule<State> {

  private readonly color: ((state: State) => RGBAColor) | RGBAColor;

  public constructor(color: ((state: State) => RGBAColor) | RGBAColor) {
    this.color = color;
  }

  public render(_map: PixelMap, pixels: PixelInfo<unknown>[], state: State): RGBAColor[] {
    const color = typeof this.color === 'function' ? this.color(state) : this.color;
    const result: RGBAColor[] = [];
    for (const _ of pixels) result.push(color);
    return result;
  }

}
