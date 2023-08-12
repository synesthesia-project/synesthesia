import { RGBAColor } from '../color';
import { PixelMap, PixelInfo, CompositorModule } from './';

/**
 * Module that fills all pixels with a given color
 */
export default class FillModule implements CompositorModule {
  private readonly color: (() => RGBAColor) | RGBAColor;

  public constructor(color: (() => RGBAColor) | RGBAColor) {
    this.color = color;
  }

  public render(_map: PixelMap, pixels: PixelInfo<unknown>[]): RGBAColor[] {
    const color = typeof this.color === 'function' ? this.color() : this.color;
    const result: RGBAColor[] = [];
    for (const _ of pixels) result.push(color);
    return result;
  }
}
