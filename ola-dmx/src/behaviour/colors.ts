export class RGBColor {
  public readonly r: number;
  public readonly g: number;
  public readonly b: number;

  public constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  public overlay(other: RGBColor, opacity: number): RGBColor {
    const r = Math.max(0, Math.min(255, Math.round(other.r * opacity + this.r * (1 - opacity))));
    const g = Math.max(0, Math.min(255, Math.round(other.g * opacity + this.g * (1 - opacity))));
    const b = Math.max(0, Math.min(255, Math.round(other.b * opacity + this.b * (1 - opacity))));
    return new RGBColor(r, g, b);
  }

}

export const RGB_BLACK = new RGBColor(0, 0, 0);
