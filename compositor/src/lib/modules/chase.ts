import { CompositorModule, RenderMethod } from '.';
import { RGBAColor } from '../color';
import { restrictNumber } from '../util';

export class ChaseModule<State> implements CompositorModule<State> {
  private advanceAmountPerSecond: number;

  private readonly sequence: Array<CompositorModule<State>>;

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
    sequence: Array<CompositorModule<State>>,
    options?: {
      advanceAmountPerSecond?: number;
    }
  ) {
    this.sequence = sequence;
    this.advanceAmountPerSecond = options?.advanceAmountPerSecond || 0.3;
  }

  render: RenderMethod<State> = (map, pixels, state) => {
    // How many seconds since last frame
    const now = Date.now();
    const diff = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    // How much to we advance each position by?
    const advance = diff * this.advanceAmountPerSecond;
    // For each pixel,
    // advance the position by an appropriate amount,
    // and calculate it's color
    const result: RGBAColor[] = pixels.map((info, i) => {
      let pos = this.positions[i];
      if (pos === undefined) {
        pos = Math.random() * this.sequence.length;
      }
      // Advance position
      pos += advance;
      if (pos >= this.sequence.length) {
        pos -= this.sequence.length;
      }
      this.positions[i] = pos;
      const module1 = restrictNumber(
        Math.floor(pos),
        0,
        this.sequence.length - 1
      );
      const module2 = module1 + 1 >= this.sequence.length ? 0 : module1 + 1;
      const transition = restrictNumber(pos - module1, 0, 1);
      const color1 = this.sequence[module1].render(map, [info], state)[0];
      const color2 = this.sequence[module2].render(map, [info], state)[0];
      return color1.transition(color2, transition);
    });
    return result;
  };

  public setAdvanceAmountPerSecond(advanceAmountPerSecond: number) {
    this.advanceAmountPerSecond = advanceAmountPerSecond;
  }
}
