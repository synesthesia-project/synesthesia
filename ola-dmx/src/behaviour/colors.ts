import {restrictNumber} from '../util';

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

  /** Combine the colours in an additive manner */
  public add(other: RGBColor): RGBColor {
    const r = Math.max(0, Math.min(255, Math.round((1 - (1 - this.r / 255) * (1 - other.r / 255)) * 255)));
    const g = Math.max(0, Math.min(255, Math.round((1 - (1 - this.g / 255) * (1 - other.g / 255)) * 255)));
    const b = Math.max(0, Math.min(255, Math.round((1 - (1 - this.b / 255) * (1 - other.b / 255)) * 255)));
    return new RGBColor(r, g, b);
  }

  public transition(other: RGBColor, amount: number): RGBColor {
    return this.overlay(other, amount);
  }

  public toString() {
    return `RGBColor(${this.r}, ${this.g}, ${this.b})`;
  }

}

/**
 * values must be between 0 and 1;
 */
function hslToRgb(hue: number, saturation: number, lightness: number): RGBColor {
  if (hue > 1) hue --;
  if (hue < 0) hue ++;
  const h = restrictNumber(hue, 0, 1);
  const s = restrictNumber(saturation, 0, 1);
  const l = restrictNumber(lightness, 0, 1);
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return new RGBColor(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

export const RGB_BLACK = new RGBColor(0, 0, 0);
export const RGB_WHITE = new RGBColor(255, 255, 255);
export const RGB_PURPLE = new RGBColor(200, 0, 255);
export const RGB_BLUE = new RGBColor(0, 50, 255);

export function randomRGBColorPallete(): RGBColor[] {
  const kind = Math.random();
  if (kind < 0.2) {
    // Similar Colours
    const baseHue = Math.random();
    const baseSat = Math.random() / 4 + 0.75;
    const c1 = hslToRgb(baseHue, baseSat, 0.5);
    const c2 = hslToRgb(baseHue, baseSat, 0.75);
    const c3 = hslToRgb(baseHue + 0.2, baseSat, 0.5);
    console.log('Generated Colors:', c1, c2, c3);
    return [c1, c2, c3];
  } else if (kind < 0.5) {
    // Complimentary
    const baseHue = Math.random();
    const baseSat = Math.random() / 4 + 0.75;
    const c1 = hslToRgb(baseHue, baseSat, 0.5);
    const c2 = hslToRgb(baseHue + 0.1, baseSat, 0.5);
    const c3 = hslToRgb(baseHue + 0.05, baseSat, 0.5);
    const c4 = hslToRgb(baseHue + 0.55, baseSat, 0.5);
    console.log('Generated Colors:', c1, c2, c3, c4);
    return [c1, c2, c3, c4];
  } else if (kind < 0.7) {
    // Brighten
    const baseHue = Math.random();
    const baseSat = Math.random() / 4 + 0.75;
    const c1 = hslToRgb(baseHue, baseSat, 0.5);
    const c2 = hslToRgb(baseHue + 0.1, baseSat, 0.25);
    const c3 = hslToRgb(baseHue - 0.1, baseSat, 0.25);
    const c4 = hslToRgb(baseHue, baseSat, 1);
    console.log('Generated Colors:', c1, c2, c3, c4);
    return [c1, c2, c3, c4];
  } else if (kind < 0.9) {
    return [
      hslToRgb(0, 1, 0.5),
      hslToRgb(0.2, 1, 0.5),
      hslToRgb(0.4, 1, 0.5),
      hslToRgb(0.6, 1, 0.5),
      hslToRgb(0.8, 1, 0.5)
    ];
  } else {
    return [RGB_PURPLE, RGB_BLUE, new RGBColor(200, 100, 0)];
  }
}
