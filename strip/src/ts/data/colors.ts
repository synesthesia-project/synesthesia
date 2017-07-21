export class Color {
  public readonly r: number;
  public readonly g: number;
  public readonly b: number;

  public static fromTriple([r, g, b]:[number, number, number]) {
    return new Color(r, g, b);
  }

  public constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  public toTriple(): [number, number, number] {
    return [this.r, this.g, this.b];
  }

  public overlay(other: Color, opacity: number): Color {
    const r = Math.max(0, Math.min(255, Math.round(other.r * opacity + this.r * (1 - opacity))));
    const g = Math.max(0, Math.min(255, Math.round(other.g * opacity + this.g * (1 - opacity))));
    const b = Math.max(0, Math.min(255, Math.round(other.b * opacity + this.b * (1 - opacity))));
    return new Color(r, g, b);
  }

  public equals(other: Color) {
    return this.r === other.r && this.g === other.g && this.b === other.b;
  }

}

export class AlphaColor extends Color {
  public readonly a: number;

  public constructor(r: number, g: number, b: number, a: number) {
    super(r, g, b);
    this.a = a;
  }
}

export class Colors {
  public static readonly Black = new Color(0, 0, 0);
  public static readonly White = new Color(255, 255, 255);
  public static readonly Transparent = new AlphaColor(0, 0, 0, 0);
}
