import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import {
  RGBAColor,
  RGBA_BLACK,
  RGBA_PURPLE,
} from '@synesthesia-project/compositor/lib/color';
import type {
  Output,
  OutputContext,
  OutputKind,
  Plugin,
} from '@synesthesia-project/live-core/lib/plugins';
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
  const group = new ld.Group({ noBorder: true, wrap: true });
  group.addChild(new ld.Label({ text: `pixels:` }));

  const pixelsInput = group.addChild(new ld.TextInput());

  const update = group.addChild(
    new ld.Button({ text: 'Update', icon: 'save' })
  );

  let pixels: {
    px: Array<{
      color: RGBAColor;
      pixelInfo: PixelInfo<null>;
    }>;
    rects: ld.Rect[];
    map: PixelMap;
  } | null = null;

  update.addListener('click', () => {
    const value = pixelsInput.getValue() ?? '';
    if (PIXEL_COUNT_MATCH.test(value)) {
      context.updateConfig(() => ({
        pixels: parseInt(value),
      }));
    } else {
      throw new Error(`Invalid pixel count: ${value}`);
    }
  });

  const x = 0;
  let rects = new ld.Group({ wrap: true });

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
      pixels.rects[i].setColor(c);
    }
  };

  const renderInterval = setInterval(render, 10);

  return {
    applyConfig: (config) => {
      group.removeChild(rects);
      rects = new ld.Group({ noBorder: true, wrap: true });
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
