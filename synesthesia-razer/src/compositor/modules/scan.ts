import { RGBAColor, TRANSPARENT } from '../color';
import { Map, PixelInfo, CompositorModule } from './';

interface ScanOptions {
  /**
   * How wide is the beam (as a proportion of the map)
   * some value between 0 and 1
   */
  beamWidth: number;
  /**
   * Number of seconds between each "scan"
   */
  delay: number;
  /**
   * How fast is the beam moving, in ration per second
   */
  speed: number;
}

interface Origin {
  time: number;
  xRatio: number;
}

/**
 * Module that fills all pixels with a given color
 */
export default class ScanModule<State> implements CompositorModule<State> {

  private readonly color: ((state: State) => RGBAColor) | RGBAColor;

  private readonly beamWidth: number;
  private readonly delay: number;
  private readonly speed: number;
  /**
   * The minimum x value w.r.t the map width, where 0 = start of map and 1 = end of map
   */
  private readonly xRatioMin: number;
  /**
   * The maximum x value w.r.t the map width, where 0 = start of map and 1 = end of map
   */
  private readonly xRatioMax: number;
  /**
   * When outside the bounds, how much should be shifted to "correct"
   */
  private readonly xRatioShift: number;
  /**
   * Width of the "fade" either size of the absolute center of the beam
   */
  private readonly beamFadeWidth: number;
  /**
   * Calculate frame values relative to this
   * (avoid keeping track of frames, and allows for time between frames to be variable)
   */
  private origin: Origin;

  public constructor(color: ((state: State) => RGBAColor) | RGBAColor, options: Partial<ScanOptions> = {}) {
    this.color = color;
    // Configuration Options
    this.beamWidth = options && options.beamWidth !== undefined ? options.beamWidth : 0.2;
    this.delay = options && options.delay !== undefined ? options.delay : 0.5;
    this.speed = options && options.speed !== undefined ? options.speed : 0.5;

    // Calculated Values
    this.xRatioMin = 0 - this.beamWidth / 2 - this.delay / 2;
    this.xRatioMax = 1 + this.beamWidth / 2 + this.delay / 2;
    this.xRatioShift = this.xRatioMax - this.xRatioMin;
    this.beamFadeWidth = this.beamWidth / 2;
    this.origin = {
      time: new Date().getTime(),
      xRatio: this.xRatioMin
    };
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
