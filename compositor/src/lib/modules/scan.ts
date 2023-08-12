import { RGBAColor, RGBA_TRANSPARENT } from '../color';
import { PixelMap, PixelInfo, CompositorModule } from './';

export interface ScanOptions {
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
   * How fast is the beam moving, in ratio per second
   */
  speed: number;
}

interface Origin {
  time: number;
  xRatio: number;
}

interface CalculatedValues {
  /**
   * The minimum x value w.r.t the map width, where 0 = start of map and 1 = end of map
   */
  readonly xRatioMin: number;
  /**
   * The maximum x value w.r.t the map width, where 0 = start of map and 1 = end of map
   */
  readonly xRatioMax: number;
  /**
   * When outside the bounds, how much should be shifted to "correct"
   */
  readonly xRatioShift: number;
  /**
   * Width of the "fade" either size of the absolute center of the beam
   */
  readonly beamFadeWidth: number;
}

export default class ScanModule implements CompositorModule {
  private readonly color: (() => RGBAColor) | RGBAColor;

  private options: ScanOptions;
  private calculatedValues: CalculatedValues;
  /**
   * Calculate frame values relative to this
   * (avoid keeping track of frames, and allows for time between frames to be variable)
   */
  private origin: Origin;

  public constructor(
    color: (() => RGBAColor) | RGBAColor,
    options: Partial<ScanOptions> = {}
  ) {
    this.color = color;
    // Configuration Options
    this.options = {
      beamWidth: 0.2,
      delay: 0.5,
      speed: 0.5,
      ...options,
    };

    // Calculated Values
    this.calculatedValues = this.calculateValues();
    this.origin = {
      time: new Date().getTime(),
      xRatio: this.calculatedValues.xRatioMin,
    };
  }

  public render(map: PixelMap, pixels: PixelInfo<unknown>[]): RGBAColor[] {
    const now = new Date().getTime();
    const diff = now - this.origin.time;
    /** 0 = start of map, 1 = end of map */
    let xRatio = this.origin.xRatio + (diff * this.options.speed) / 1000;
    while (xRatio > this.calculatedValues.xRatioMax) {
      this.origin.time = now;
      this.origin.xRatio = xRatio = xRatio - this.calculatedValues.xRatioShift;
    }
    while (xRatio < this.calculatedValues.xRatioMin) {
      this.origin.time = now;
      this.origin.xRatio = xRatio = xRatio + this.calculatedValues.xRatioShift;
    }
    const mapWidth = map.xMax - map.xMin;
    const color = typeof this.color === 'function' ? this.color() : this.color;
    return pixels.map((pixel) => {
      const pixelXRatio = (pixel.x - map.xMin) / mapWidth;
      const distance = Math.abs(pixelXRatio - xRatio);
      const brightness = Math.max(
        0,
        1 - distance / this.calculatedValues.beamFadeWidth
      );
      return brightness === 0
        ? RGBA_TRANSPARENT
        : new RGBAColor(color.r, color.g, color.b, color.alpha * brightness);
    });
  }

  private calculateValues = (): CalculatedValues => {
    const xRatioMin = 0 - this.options.beamWidth / 2 - this.options.delay / 2;
    const xRatioMax = 1 + this.options.beamWidth / 2 + this.options.delay / 2;
    const xRatioShift = xRatioMax - xRatioMin;
    const beamFadeWidth = this.options.beamWidth / 2;
    return {
      xRatioMin,
      xRatioMax,
      xRatioShift,
      beamFadeWidth,
    };
  };

  public setOptions = (options: Partial<ScanOptions> = {}) => {
    this.options = {
      ...this.options,
      ...options,
    };
    this.calculatedValues = this.calculateValues();
  };
}
