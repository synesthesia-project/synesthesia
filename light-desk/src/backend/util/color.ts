/**
 * Classes and type definitions to handle colors.
 *
 * This module is exported from the main module, like components.
 *
 * **Example:**
 *
 * ```ts
 * // Javascript:
 * const color = require('@synesthesia-project/light-desk').color;
 * const c = new color.RGBColor(255, 0, 0);
 *
 * // TypeScript:
 * import {color} from '@synesthesia-project/light-desk';
 * const c = new color.RGBColor(255, 0, 0);
 * ```
 */

import { ColorJSON, RGBColorJSON } from '../../shared/proto';

export interface Color {
  /** @returns a string representation of the current color */
  toString(): string;
  /** @returns an object that describes the color's properties and can be used in JSON. */
  json(): ColorJSON;
  /** @returns true if this color is equal to the color given */
  equals(other: Color): boolean;
}

/** A color described by it's red, blue and green values. */
export class RGBColor implements Color {
  /** @hidden */
  public readonly r: number;
  /** @hidden */
  public readonly g: number;
  /** @hidden */
  public readonly b: number;

  /**
   * @param r value between 0 and 255
   * @param g value between 0 and 255
   * @param b value between 0 and 255
   */
  public constructor(r: number, g: number, b: number) {
    this.r = Math.max(0, Math.min(255, r));
    this.g = Math.max(0, Math.min(255, g));
    this.b = Math.max(0, Math.min(255, b));
  }

  /**
   * Overlay another color ontop of this one with a certain opacity
   *
   * @param other the color you with to overlay over this one
   * @param opacity value between 0 and 1, the amount you wish to overlay this color.
   */
  public overlay(other: RGBColor, opacity: number): RGBColor {
    const r = Math.max(
      0,
      Math.min(255, Math.round(other.r * opacity + this.r * (1 - opacity)))
    );
    const g = Math.max(
      0,
      Math.min(255, Math.round(other.g * opacity + this.g * (1 - opacity)))
    );
    const b = Math.max(
      0,
      Math.min(255, Math.round(other.b * opacity + this.b * (1 - opacity)))
    );
    return new RGBColor(r, g, b);
  }

  /** Combine the colours in an additive manner */
  public add(other: RGBColor): RGBColor {
    const r = Math.max(
      0,
      Math.min(
        255,
        Math.round((1 - (1 - this.r / 255) * (1 - other.r / 255)) * 255)
      )
    );
    const g = Math.max(
      0,
      Math.min(
        255,
        Math.round((1 - (1 - this.g / 255) * (1 - other.g / 255)) * 255)
      )
    );
    const b = Math.max(
      0,
      Math.min(
        255,
        Math.round((1 - (1 - this.b / 255) * (1 - other.b / 255)) * 255)
      )
    );
    return new RGBColor(r, g, b);
  }

  /**
   * Dim the color by a certain amount.
   *
   * @param brightness a value between 0-1, where 0 dims the colour to black, and 1 keeps it at the current value
   */
  public dim(brightness: number) {
    brightness = Math.max(0, Math.min(1, brightness));
    return new RGBColor(
      this.r * brightness,
      this.g * brightness,
      this.b * brightness
    );
  }

  /**
   * Produce a new color that is mid way between this color and another
   *
   * @param other the color you to transition to
   * @param amount value between 0 and 1, how far the transition has progressed
   */
  public transition(other: RGBColor, amount: number): RGBColor {
    return this.overlay(other, amount);
  }

  public toString() {
    return `RGBColor(${this.r}, ${this.g}, ${this.b})`;
  }

  public equals(other: Color): boolean {
    return (
      other instanceof RGBColor &&
      other.r === this.r &&
      other.g === this.g &&
      other.b === this.b
    );
  }

  public json(): RGBColorJSON {
    return {
      type: 'rgb',
      r: this.r,
      g: this.g,
      b: this.b,
    };
  }
}

/** #ffffff */
export const COLOR_RGB_WHITE = new RGBColor(255, 255, 255);
