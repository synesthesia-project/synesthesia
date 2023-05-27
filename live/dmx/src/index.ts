import artnet = require('artnet');
import * as t from 'io-ts';
import {
  Output,
  OutputContext,
  OutputKind,
  Plugin,
} from '@synesthesia-project/live-core/lib/plugins';
import * as ld from '@synesthesia-project/light-desk';
import {
  PixelInfo,
  PixelMap,
} from '@synesthesia-project/compositor/lib/modules';

const UNIVERSE_REGEX = /^[0-9]+$/;
const MAX_UNIVERSE = 32767;

const DMX_OUTPUT_CONFIG = t.type({
  artnetUniverse: t.union([t.number, t.null]),
  fixtures: t.array(
    t.partial({
      pos: t.type({
        x: t.number,
        y: t.number,
      }),
      rgb: t.type({
        r: t.number,
        g: t.number,
        b: t.number,
      }),
    })
  ),
});

type Config = t.TypeOf<typeof DMX_OUTPUT_CONFIG>;

type Fixture = Config['fixtures'][number];

const createDmxOutput = (context: OutputContext<Config>): Output<Config> => {
  let config: Config = {
    artnetUniverse: 0,
    fixtures: [],
  };

  const group = new ld.Group({ noBorder: true, direction: 'vertical' });

  const header = new ld.Group({ noBorder: true, direction: 'horizontal' });
  group.addChild(header);

  header.addChild(new ld.Label('Universe: '));
  const universeInput = new ld.TextInput('0');
  header.addChild(universeInput);
  const setUniverse = new ld.Button('Set');
  header.addChild(setUniverse);

  setUniverse.addListener(() => {
    const val = universeInput.getValue();
    if (!UNIVERSE_REGEX.exec(val)) {
      throw new Error(`Universe value must be number`);
    }
    const artnetUniverse = parseInt(val);
    if (artnetUniverse < 0 || artnetUniverse > MAX_UNIVERSE) {
      throw new Error(`Universe must be between 0 and ${MAX_UNIVERSE}`);
    }
    context.saveConfig({
      ...config,
      artnetUniverse,
    });
  });

  let pixels: {
    /**
     * Fixtures that secifically have "pixel" outputs
     */
    fixtures: Array<Fixture | undefined>;
    map: PixelMap;
    pixelInfo: Array<PixelInfo<null>>;
  } | null;

  group.addChild(new ld.Label('DMX'));

  const a = artnet({
    sendAll: true,
  });

  const buffer: number[] = [];
  for (let i = 0; i < 512; i++) {
    buffer[i] = 0;
  }

  const render = () => {
    if (!pixels) return;
    const frame = context.render(pixels.map, pixels.pixelInfo);
    for (let i = 0; i < frame.length; i++) {
      const color = frame[i];
      const fixture = pixels.fixtures[i];
      if (fixture?.rgb) {
        buffer[fixture.rgb.r - 1] = color.r;
        buffer[fixture.rgb.g - 1] = color.g;
        buffer[fixture.rgb.b - 1] = color.b;
      }
    }
    a.set(config.artnetUniverse ?? 0, 1, buffer);
  };

  const renderInterval = setInterval(render, 10);

  return {
    setConfig: (c) => {
      config = c;
      universeInput.setValue(`${c.artnetUniverse}`);
      // Only include fixtures with RGB output in pixel fixtures
      const pixelFixtures = config.fixtures.filter((f) => f.rgb);
      pixels = {
        fixtures: pixelFixtures,
        map: {
          xMin: Math.min(
            ...pixelFixtures.filter((f) => f.pos).map((f) => f.pos?.x ?? 0)
          ),
          xMax: Math.max(
            ...pixelFixtures.filter((f) => f.pos).map((f) => f.pos?.x ?? 0)
          ),
          yMin: Math.min(
            ...pixelFixtures.filter((f) => f.pos).map((f) => f.pos?.y ?? 0)
          ),
          yMax: Math.max(
            ...pixelFixtures.filter((f) => f.pos).map((f) => f.pos?.y ?? 0)
          ),
        },
        pixelInfo: pixelFixtures.map((f) => ({
          data: null,
          x: f.pos?.x ?? 0,
          y: f.pos?.y ?? 0,
        })),
      };
      render();
    },
    destroy: () => {
      clearInterval(renderInterval);
      a.close();
    },
    getLightDeskComponent: () => group,
  };
};

export const DMX_OUTPUT_KIND: OutputKind<Config> = {
  kind: 'dmx',
  config: DMX_OUTPUT_CONFIG,
  initialConfig: {
    artnetUniverse: 0,
    fixtures: [],
  },
  create: createDmxOutput,
};

export const DMX_PLUGIN: Plugin = {
  init: (context) => {
    context.registerOutputKind(DMX_OUTPUT_KIND);
  },
};
