export class RGBAColor {
  public readonly r: number;
  public readonly g: number;
  public readonly b: number;
  /** value between 0 and 1 */
  public readonly alpha: number;

  public constructor(r: number, g: number, b: number, alpha = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.alpha = alpha;
  }

  public toString() {
    return `RGBAColor(${this.r}, ${this.g}, ${this.b}, ${this.alpha})`;
  }

  public toRGB(): [number, number, number] {
    return [
      Math.round(this.r * this.alpha),
      Math.round(this.g * this.alpha),
      Math.round(this.b * this.alpha)
    ];
  }

}

export const TRANSPARENT = new RGBAColor(0, 0, 0, 0);
