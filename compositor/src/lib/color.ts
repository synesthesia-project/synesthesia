import { restrictNumber } from './util';

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
      Math.round(this.b * this.alpha),
    ];
  }

  public transition(other: RGBAColor, ratio: number): RGBAColor {
    ratio = restrictNumber(ratio, 0, 1);
    const r = Math.max(
      0,
      Math.min(255, Math.round(other.r * ratio + this.r * (1 - ratio)))
    );
    const g = Math.max(
      0,
      Math.min(255, Math.round(other.g * ratio + this.g * (1 - ratio)))
    );
    const b = Math.max(
      0,
      Math.min(255, Math.round(other.b * ratio + this.b * (1 - ratio)))
    );
    const a = Math.max(
      0,
      Math.min(1, other.alpha * ratio + this.alpha * (1 - ratio))
    );
    return new RGBAColor(r, g, b, a);
  }
}

export const RGBA_BLACK = new RGBAColor(0, 0, 0);
export const RGBA_WHITE = new RGBAColor(255, 255, 255);
export const RGBA_PURPLE = new RGBAColor(200, 0, 255);
export const RGBA_BLUE = new RGBAColor(0, 50, 255);
export const RGBA_TRANSPARENT = new RGBAColor(0, 0, 0, 0);

/**
 * values must be between 0 and 1;
 */
export const hslToRgb = (
  hue: number,
  saturation: number,
  lightness: number,
  alpha = 1
): RGBAColor => {
  if (hue > 1) hue--;
  if (hue < 0) hue++;
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

  return new RGBAColor(
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
    alpha
  );
};

export const rainbow = () => {
  return [
    hslToRgb(0, 1, 0.5),
    hslToRgb(0.2, 1, 0.5),
    hslToRgb(0.4, 1, 0.5),
    hslToRgb(0.6, 1, 0.5),
    hslToRgb(0.8, 1, 0.5),
  ];
};

export const randomRGBColorPallete = (): RGBAColor[] => {
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
    return rainbow();
  } else {
    return [RGBA_PURPLE, RGBA_BLUE, new RGBAColor(200, 100, 0, 1)];
  }
};
