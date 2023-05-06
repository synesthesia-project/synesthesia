import { CompositorModule, RenderMethod } from '.';
import { RGBAColor } from '../color';
import { restrictNumber } from '../util';

export class RGBChase<State> implements CompositorModule<State> {
  private readonly advanceAmountPerSecond: number;

  private readonly colors: RGBAColor[];

  /**
   * Array of values from 0-colors.length that
   * represent how far along in the chase each pixel is.
   */
  private readonly positions: number[] = [];

  /**
   * Store when the last frame was calculated to know how much to advance the
   * positions by
   */
  private lastFrame = Date.now();

  public constructor(
    colors: RGBAColor[],
    options?: {
      advanceAmountPerSecond?: number;
    }
  ) {
    this.colors = colors;
    this.advanceAmountPerSecond = options?.advanceAmountPerSecond || 0.3;
  }

  render: RenderMethod<State> = (_map, pixels) => {
    // How many seconds since last frame
    const now = Date.now();
    const diff = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    // How much to we advance each position by?
    const advance = diff * this.advanceAmountPerSecond;
    // For each pixel,
    // advance the position by an appropriate amount,
    // and calculate it's color
    const result: RGBAColor[] = pixels.map((_info, i) => {
      let pos = this.positions[i];
      if (pos === undefined) {
        pos = Math.random() * this.colors.length;
      }
      // Advance position
      pos += advance;
      if (pos >= this.colors.length) {
        pos -= this.colors.length;
      }
      this.positions[i] = pos;
      const color1 = restrictNumber(Math.floor(pos), 0, this.colors.length - 1);
      const color2 = color1 + 1 >= this.colors.length ? 0 : color1 + 1;
      const transition = restrictNumber(pos - color1, 0, 1);
      return this.colors[color1].transition(this.colors[color2], transition);
    });
    return result;
  };
}
