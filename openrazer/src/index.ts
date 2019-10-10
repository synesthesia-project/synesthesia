import * as fs from 'fs';
import * as path from 'path';
import {promisify} from 'util';

import { getPixelMap, PixelMap } from './lib/pixelmaps';

const KEYBOARDS_PATH = '/sys/bus/hid/drivers/razerkbd/';
const MOUSE_MATS_PATH = '/sys/bus/hid/drivers/razermousemat/';
const ENCODING = 'utf8';

const device_type = 'device_type';
const device_serial = 'device_serial';
const firmware_version = 'firmware_version';
const matrix_effect_breath = 'matrix_effect_breath';
const matrix_effect_starlight = 'matrix_effect_starlight';
const matrix_effect_custom = 'matrix_effect_custom';
const matrix_effect_none = 'matrix_effect_none';
const matrix_effect_reactive = 'matrix_effect_reactive';
const matrix_effect_spectrum = 'matrix_effect_spectrum';
const matrix_effect_pulsate = 'matrix_effect_pulsate';
const matrix_effect_static = 'matrix_effect_static';
const matrix_effect_wave = 'matrix_effect_wave';
const matrix_brightness = 'matrix_brightness';
const matrix_custom_frame = 'matrix_custom_frame';

export type RGB = [number, number, number];

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

function filterNonNull<T>(values: Array<T | null>): T[] {
  return values.filter(v => v !== null) as T[];
}

function validateByte(byte: number, name: string) {
  if (byte < 0 || byte > 255)
    throw new Error(`invalid ${name}`);
}

function validateRGB(value: RGB) {
  if (value.length !== 3) throw new Error('invalid RGB Value');
  for (let i = 0; i <= 3; i++) {
    if (value[i] < 0 || value[i] > 255)
      throw new Error('invalid RGB Value');
  }
}

export function getKeyboards() {
  return getDevices(KEYBOARDS_PATH, Keyboard);
}

export function getMousemats() {
  return getDevices(MOUSE_MATS_PATH, MouseMat);
}

export function getDevices<T extends Device>(
    devicesFolder: string, cls: new(devicePath: string, deviceType: string) => T): Promise<T[]> {
  const keyboards = readdir(devicesFolder).then(devices => Promise.all(
    devices.map(async deviceId => {
      // Get Device Type
      const devicePath = path.join(devicesFolder, deviceId);
      const deviceType = await readFile(path.join(devicePath, device_type), ENCODING).catch(() => null);
      return deviceType ? new cls(devicePath, deviceType.trim()) : null;
    }),
  ));
  return keyboards.then(filterNonNull);
}

class Device {

  /**
   * The path to the device
   */
  private readonly devicePath: string;
  private readonly deviceType: string;

  public constructor(devicePath: string, deviceType: string) {
    this.devicePath = devicePath;
    this.deviceType = deviceType;
  }

  /**
   * Return the path of the device folder
   */
  public getDevicePath() {
    return this.devicePath;
  }

  public getDeviceType() {
    return this.deviceType;
  }

  public getPixelMap(): Promise<PixelMap | null> {
    return getPixelMap(this.deviceType);
  }

  public setMatrixEffectBreath(firstColor?: RGB, secondColor?: RGB) {
    if (firstColor) {
      validateRGB(firstColor);
      if (secondColor) {
        validateRGB(secondColor);
        return this.writeBytes(matrix_effect_breath, [...firstColor, ...secondColor]);
      } else {
        return this.writeBytes(matrix_effect_breath, [...firstColor]);
      }
    } else {
      return this.writeBytes(matrix_effect_breath, [0x1]);
    }
  }

  /**
   * @param speed between 1 and 3, 1 = short, 3 = long
   * @param color an RGB value
   */
  public setMatrixEffectReactive(speed: number, color: RGB) {
    if (speed < 1 || speed > 3) throw new Error('invalid speed');
    validateRGB(color);
    return this.writeBytes(matrix_effect_reactive, [speed, ...color]);
  }

  public setMatrixEffectNone() {
    return this.writeBytes(matrix_effect_none, [0x1]);
  }

  public setMatrixEffectSpectrum() {
    return this.writeBytes(matrix_effect_spectrum, [0x1]);
  }

  public setMatrixEffectStatic(color: RGB) {
    return this.writeBytes(matrix_effect_static, [...color]);
  }

  public setMatrixEffectWave(direction: 'left' | 'right') {
    return this.writeBytes(matrix_effect_wave, [direction === 'left' ? 1 : 2]);
  }

  public setMatrixBrightness(brightness: number) {
    validateByte(brightness, 'brightness');
    return writeFile(path.join(this.devicePath, matrix_brightness), brightness.toString());
  }

  protected writeBytes(file: string, bytes: number[]) {
    return writeFile(path.join(this.devicePath, file), Buffer.from(bytes));
  }

  public getSerialNumber() {
    return readFile(path.join(this.devicePath, device_serial), ENCODING).then(s => s.trim());
  }

  public getFirmwareVersion() {
    return readFile(path.join(this.devicePath, firmware_version), ENCODING).then(s => s.trim());
  }
}

export class Keyboard extends Device {

  /**
   * @param speed between 0 and 255, 0 = slow, 255 = fast
   * @param firstColor if set, use this colour in single-color mode
   * @param secondColor if set, use this colour in dual-color mode
   */
  public setMatrixEffectStarlight(speed: number, firstColor?: RGB, secondColor?: RGB) {
    validateByte(speed, 'speed');
    if (firstColor) {
      validateRGB(firstColor);
      if (secondColor) {
        validateRGB(secondColor);
        return this.writeBytes(matrix_effect_starlight, [speed, ...firstColor, ...secondColor]);
      } else {
        return this.writeBytes(matrix_effect_starlight, [speed, ...firstColor]);
      }
    } else {
      return this.writeBytes(matrix_effect_starlight, [speed]);
    }
  }

  /**
   * Display a custom frame on the keyboard
   *
   * @param rows An array of row objects. For each row specify index, start and colors.
   * @param row between 0-5, the row index
   * @param start between 0-21, the first column you want to write a color to
   * @param colors the colors you wish to write, providing no more than (22-start) values
   */
  public async writeCustomFrame(rows: Array<{ index: number, start: number, colors: RGB[] }>) {
    const bytes: number[] = [];
    rows.map(({ index, start, colors }) => {
      if (index < 0 || index > 5) throw new Error(`invalid row index: ${index}`);
      if (start < 0 || start > 21) throw new Error(`invalid start index: ${start}`);
      const end = start + colors.length - 1;
      if (end > 21) throw new Error('too many colors provided');
      bytes.push(index, start, end);
      for (const color of colors) bytes.push(...color);
    });
    await this.writeBytes(matrix_custom_frame, bytes);
    await this.writeBytes(matrix_effect_custom, [0x1]);
  }

  /**
   * This is only available for the Razer BlackWidow Ultimate 2013,
   * and for other non-Chroma/non-Ultimate devices.
   * This mode just fades in and out.
   */
  public setMatrixEffectPulsate() {
    return this.writeBytes(matrix_effect_pulsate, [0x1]);
  }

}

export class MouseMat extends Device {

  /**
   * Display a custom frame on the mousemat
   *
   * @param start between 0-14, the first pixel you want to write a color to
   * @param colors the colors you wish to write, providing no more than (15-start) values
   */
  public async writeCustomFrame(start: number, colors: RGB[]) {
    if (start < 0 || start > 14) throw new Error(`invalid start index: ${start}`);
    const bytes: number[] = [];
    const end = start + colors.length - 1;
    if (end > 14) throw new Error('too many colors provided');
    bytes.push(0, start, end);
    for (const color of colors) bytes.push(...color);
    await this.writeBytes(matrix_custom_frame, bytes);
    await this.writeBytes(matrix_effect_custom, [0x1]);
  }

}

export {
  PixelMap,
};
