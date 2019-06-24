import { RGBAColor, TRANSPARENT } from '../color';
import { Map, PixelInfo, CompositorModule } from './';

/**
 * Module that fills all pixels with a given color
 */
export default class ScanModule<State> implements CompositorModule<State> {

  private readonly color: ((state: State) => RGBAColor) | RGBAColor;

  private origin = {
    time: new Date().getTime(),
    xRatio: 0
  };

  /**
   * map ratio per second
   */
  private speed = 0.5;
  private beamFadeWidth = 0.1;
  /**
   * Number of seconds between each "scan"
   */
  private delay = 0.5;
  /**
   * The minimum x value w.r.t the map width, where 0 = start of map and 1 = end of map
   */
  private xRatioMin = 0 - this.beamFadeWidth;
  /**
   * The maximum x value w.r.t the map width, where 0 = start of map and 1 = end of map
   */
  private xRatioMax = 1 + this.beamFadeWidth + this.delay;
  /**
   * When outside the bounds, how much should be shifted to "correct"
   */
  private xRatioShift = this.xRatioMax - this.xRatioMin;

  public constructor(color: ((state: State) => RGBAColor) | RGBAColor) {
    this.color = color;
  }

  public render(map: Map, pixels: PixelInfo<unknown>[], state: State): RGBAColor[] {
    const now = new Date().getTime();
    const diff = now - this.origin.time;
    /** 0 = start of map, 1 = end of map */
    let xRatio = this.origin.xRatio + (diff * this.speed / 1000);
    while (xRatio > this.xRatioMax) {
      this.origin.time = now;
      this.origin.xRatio = xRatio = xRatio - this.xRatioShift;
    }
    while (xRatio < this.xRatioMin) {
      this.origin.time = now;
      this.origin.xRatio = xRatio = xRatio + this.xRatioShift;
    }
    const mapWidth = map.xMax - map.xMin;
    const color = typeof this.color === 'function' ? this.color(state) : this.color;
    return pixels.map(pixel => {
      const pixelXRatio = (pixel.x - map.xMin) / mapWidth;
      const distance = Math.abs(pixelXRatio - xRatio);
      const brightness = Math.max(0, 1 - distance / this.beamFadeWidth);
      return brightness === 0 ? TRANSPARENT : new RGBAColor(color.r, color.g, color.b, color.alpha * brightness);
    });
  }

}
