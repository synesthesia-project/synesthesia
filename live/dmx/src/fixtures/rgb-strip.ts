import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';

import { Fixture, FixturePixel } from './types';
import { INTEGER_REGEX, MAX_CHANNEL, validateNumber } from '../util';

const MAX_PIXELS_PER_STRIP = MAX_CHANNEL / 3;

export const RGB_STRIP_FIXTURE_CONFIG = t.intersection([
  t.type({
    type: t.literal('rgb-strip'),
  }),
  t.partial({
    startX: t.number,
    startY: t.number,
    endX: t.number,
    endY: t.number,
    pixels: t.number,
  }),
]);

export type RGBStripFixtureConfig = t.TypeOf<typeof RGB_STRIP_FIXTURE_CONFIG>;

export const DEFAULT_RGB_STRIP_FIXTURE_CONFIG: RGBStripFixtureConfig = {
  type: 'rgb-strip',
};

export const createRGBStripFixture = (
  updateConfig: (
    update: (current: RGBStripFixtureConfig) => RGBStripFixtureConfig
  ) => void
): Fixture<RGBStripFixtureConfig> => {
  let config: RGBStripFixtureConfig = DEFAULT_RGB_STRIP_FIXTURE_CONFIG;

  const group = new ld.Group({
    noBorder: true,
    direction: 'horizontal',
    wrap: true,
  });

  group.addChild(new ld.Label('Number of pixels:'));
  const pixels = group.addChild(new ld.TextInput(''));

  group.addChild(new ld.Label('Start Position (X,Y):'));
  const startX = group.addChild(new ld.TextInput(''));
  const startY = group.addChild(new ld.TextInput(''));

  group.addChild(new ld.Label('End Position (X,Y):'));
  const endX = group.addChild(new ld.TextInput(''));
  const endY = group.addChild(new ld.TextInput(''));

  // Input Listeners
  pixels.addListener(() => {
    try {
      const value = pixels.getValidatedValue((v) => {
        if (!INTEGER_REGEX.exec(v)) {
          throw new Error(`Number of pixels mut be an integer`);
        }
        const p = parseInt(v);
        if (p < 1 || p > MAX_PIXELS_PER_STRIP) {
          throw new Error(
            `Number of pixels must be between 1 and ${MAX_PIXELS_PER_STRIP}`
          );
        }
        return p;
      });
      updateConfig((current) => ({
        ...current,
        pixels: value ?? undefined,
      }));
    } catch (e) {
      console.error(e);
    }
  });

  startX.addListener(() =>
    updateConfig((current) => ({
      ...current,
      startX: startX.getValidatedValue(validateNumber) ?? undefined,
    }))
  );

  startY.addListener(() =>
    updateConfig((current) => ({
      ...current,
      startY: startY.getValidatedValue(validateNumber) ?? undefined,
    }))
  );

  endX.addListener(() =>
    updateConfig((current) => ({
      ...current,
      endX: endX.getValidatedValue(validateNumber) ?? undefined,
    }))
  );

  endY.addListener(() =>
    updateConfig((current) => ({
      ...current,
      endY: endY.getValidatedValue(validateNumber) ?? undefined,
    }))
  );

  return {
    type: 'rgb-strip',
    group,
    defaultConfig: DEFAULT_RGB_STRIP_FIXTURE_CONFIG,
    setConfig: (newConfig) => {
      config = newConfig;

      pixels.setValue(`${config.pixels ?? ''}`);
      startX.setValue(`${config.startX ?? ''}`);
      startY.setValue(`${config.startY ?? ''}`);
      endX.setValue(`${config.endX ?? ''}`);
      endY.setValue(`${config.endY ?? ''}`);
    },
    getPixels: () => {
      if (!config.pixels) {
        return [];
      }
      const pixels: FixturePixel[] = [];
      const startX = config.startX ?? 0;
      const startY = config.startY ?? 0;
      const endX = config.endX ?? 0;
      const endY = config.endY ?? 0;
      const xIncrement = (endX - startX) / config.pixels;
      const yIncrement = (endY - startY) / config.pixels;
      for (let i = 0; i < config.pixels; i++) {
        pixels.push({
          channels: {
            r: i * 3,
            g: i * 3 + 1,
            b: i * 3 + 2,
          },
          x: startX + xIncrement * i,
          y: startY + yIncrement * i,
        });
      }
      return pixels;
    },
    getChannels: () => [],
  };
};
