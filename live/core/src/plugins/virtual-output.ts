import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import {
  RGBAColor,
  RGBA_BLACK,
  RGBA_PURPLE,
} from '@synesthesia-project/compositor/lib/color';

import { Output, OutputContext, OutputKind, Plugin } from '.';
import {
  PixelInfo,
  PixelMap,
} from '@synesthesia-project/compositor/lib/modules';

const PIXEL_COUNT_MATCH = /^[0-9]+$/;

const VIRTUAL_OUTPUT_CONFIG = t.type({
  pixels: t.number,
});

type Config = t.TypeOf<typeof VIRTUAL_OUTPUT_CONFIG>;

const createVirtualOutput = (
  context: OutputContext<Config>
): Output<Config> => {
  const group = new ld.Group({ noBorder: true });
  const label = new ld.Label(`pixels:`);
  group.addChild(label);

  const pixelsInput = new ld.TextInput('');
  group.addChild(pixelsInput);

  const update = new ld.Button('Update');
  group.addChild(update);

  let pixels: {
    px: Array<{
      color: RGBAColor;
      pixelInfo: PixelInfo<null>;
    }>;
    rects: ld.Rect[];
    map: PixelMap;
  } | null = null;

  update.addListener(async () => {
    const value = pixelsInput.getValue();
    if (PIXEL_COUNT_MATCH.test(value)) {
      context.saveConfig({
        pixels: parseInt(value),
      });
    } else {
      throw new Error(`Invalid pixel count: ${value}`);
    }
  });

  const x = 0;
  let rects = new ld.Group();

  const render = () => {
    if (!pixels) return;
    const frame = context.render(
      pixels.map,
      pixels.px.map((p) => p.pixelInfo)
    );
    for (let i = 0; i < pixels.px.length; i++) {
      pixels.px[i].color = frame[i];
    }
    for (let i = 0; i < pixels.rects.length; i++) {
      const samplePixel = Math.round(
        (i / Math.max(1, pixels.rects.length - 1)) * (pixels.px.length - 1)
      );
      const px = pixels.px[samplePixel];
      const c = px.color.transition(RGBA_BLACK, x);
      pixels.rects[i].setColor(
        new ld.color.RGBColor(c.r * c.alpha, c.g * c.alpha, c.b * c.alpha)
      );
    }
  };

  const renderInterval = setInterval(render, 10);

  return {
    setConfig: (config) => {
      group.removeChild(rects);
      rects = new ld.Group({ noBorder: true });
      pixels = {
        px: [],
        rects: [],
        map: {
          xMin: 0,
          xMax: config.pixels,
          yMin: 0,
          yMax: 0,
        },
      };
      for (let i = 0; i < config.pixels; i++) {
        const color = RGBA_PURPLE;
        pixels.px.push({
          color,
          pixelInfo: {
            data: null,
            x: i,
            y: 0,
          },
        });
      }
      for (let i = 0; i < config.pixels && i < 10; i++) {
        const rect = new ld.Rect();
        pixels.rects.push(rect);
        rects.addChild(rect);
      }
      render();
      group.addChild(rects);
      pixelsInput.setValue(`${config.pixels}`);
    },
    getLightDeskComponent: () => group,
    destroy: () => {
      clearInterval(renderInterval);
    },
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
