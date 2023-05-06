import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';

import { Output, OutputContext, OutputKind, Plugin } from '.';

const PIXEL_COUNT_MATCH = /^[0-9]+$/;

const VIRTUAL_OUTPUT_CONFIG = t.type({
  pixels: t.number,
});

type Config = t.TypeOf<typeof VIRTUAL_OUTPUT_CONFIG>;

const createVirtualOutput = (
  context: OutputContext<Config>
): Output<Config> => {
  const group = new ld.Group();
  const label = new ld.Label(`pixels:`);
  group.addChild(label);

  const pixels = new ld.TextInput('');
  group.addChild(pixels);

  const update = new ld.Button('Update');
  group.addChild(update);

  update.addListener(async () => {
    const value = pixels.getValue();
    if (PIXEL_COUNT_MATCH.test(value)) {
      context.saveConfig({
        pixels: parseInt(value),
      });
    } else {
      throw new Error(`Invalid pixel count: ${value}`);
    }
  });

  let rects = new ld.Group();

  return {
    setConfig: (config) => {
      group.removeChild(rects);
      rects = new ld.Group({ noBorder: true });
      group.addChild(rects);
      for (let i = 0; i < config.pixels && i < 10; i++) {
        rects.addChild(new ld.Rect(ld.color.COLOR_RGB_WHITE));
      }
      pixels.setValue(`${config.pixels}`);
    },
    getLightDeskComponent: () => group,
  };
};

export const VIRTUAL_OUTPUT_KIND: OutputKind<Config> = {
  kind: 'virtual',
  config: VIRTUAL_OUTPUT_CONFIG,
  initialConfig: {
    pixels: 1,
  },
  create: createVirtualOutput,
};

export const VIRTUAL_OUTPUT_PLUGIN: Plugin = {
  init: (context) => {
    context.registerOutputKind(VIRTUAL_OUTPUT_KIND);
  },
};
