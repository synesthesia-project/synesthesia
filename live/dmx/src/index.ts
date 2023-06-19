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
import { v4 as uuidv4 } from 'uuid';

const INTEGER_REGEX = /^[0-9]+$/;
const MAX_UNIVERSE = 32767;
const MAX_CHANNEL = 512;

const DMX_OUTPUT_CONFIG = t.type({
  artnetUniverse: t.union([t.number, t.null]),
  fixtures: t.record(
    t.string,
    t.partial({
      name: t.string,
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
    fixtures: {},
  };

  const group = new ld.Group({ noBorder: true, direction: 'vertical' });

  const header = new ld.Group({ noBorder: true, direction: 'horizontal' });
  group.addChild(header);

  header.addChild(new ld.Label('Universe: '));
  const universeInput = new ld.TextInput('0');
  header.addChild(universeInput);
  const setUniverse = new ld.Button('Set', 'save');
  header.addChild(setUniverse);

  const addFixture = new ld.Button('Add Fixture', 'add');
  header.addChild(addFixture);

  addFixture.addListener(() => {
    context.saveConfig({
      ...config,
      fixtures: { ...config.fixtures, [uuidv4()]: {} },
    });
  });

  const fixtureGroup = new ld.Group({ noBorder: true, direction: 'vertical' });
  group.addChild(fixtureGroup);

  const updateFixtureConfig = (
    uuid: string,
    change: (current: Fixture) => Fixture
  ) =>
    context.saveConfig({
      ...config,
      fixtures: {
        ...config.fixtures,
        [uuid]: change(config.fixtures[uuid]),
      },
    });

  const removeFixture = (uuid: string) => {
    const fixtures = { ...config.fixtures };
    delete fixtures[uuid];
    context.saveConfig({
      ...config,
      fixtures,
    });
  };

  const updateFixtureGroup = () => {
    fixtureGroup.removeAllChildren();
    for (const [uuid, f] of Object.entries(config.fixtures)) {
      const grp = fixtureGroup.addChild(new ld.Group());

      const remove = grp.addChild(new ld.Button('Remove', 'delete'));
      remove.addListener(() => removeFixture(uuid));

      grp.addChild(new ld.Label('RGB Channels:'));
      const [ri, gi, bi, setColorChannels] = grp.addChildren(
        new ld.TextInput(`${f.rgb?.r || ''}`),
        new ld.TextInput(`${f.rgb?.g || ''}`),
        new ld.TextInput(`${f.rgb?.b || ''}`),
        new ld.Button('Set', 'save')
      );
      setColorChannels.addListener(() => {
        const [rt, gt, bt] = [ri, gi, bi].map((t) => t.getValue());
        if (![rt, gt, bt].some((t) => t !== '')) {
          // No values set, remove colors
          updateFixtureConfig(uuid, (c) => ({ ...c, rgb: undefined }));
        }
        // Some values set
        if ([rt, gt, bt].some((t) => !INTEGER_REGEX.exec(t))) {
          // No values set, remove colors
          throw new Error(
            `All channels must be positive integers, unless all are empty`
          );
        }
        const [r, g, b] = [rt, gt, bt].map((t) => parseInt(t));
        if ([r, g, b].some((c) => c < 1 || c > MAX_CHANNEL)) {
          throw new Error(`Channels must be between 1 and ${MAX_CHANNEL}`);
        }
        updateFixtureConfig(uuid, (c) => ({ ...c, rgb: { r, g, b } }));
      });
    }
  };

  setUniverse.addListener(() => {
    const val = universeInput.getValue();
    if (!INTEGER_REGEX.exec(val)) {
      throw new Error(`Universe value must be a positive integer`);
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

  const a = artnet({
    sendAll: true,
  });

  const buffer: number[] = [];
  const clearBuffer = () => {
    for (let i = 0; i < 512; i++) {
      buffer[i] = 0;
    }
  };

  const render = () => {
    if (!pixels) return;
    const frame = context.render(pixels.map, pixels.pixelInfo);
    for (let i = 0; i < frame.length; i++) {
      const color = frame[i];
      const fixture = pixels.fixtures[i];
      if (fixture?.rgb) {
        buffer[fixture.rgb.r - 1] = color.r * color.alpha;
        buffer[fixture.rgb.g - 1] = color.g * color.alpha;
        buffer[fixture.rgb.b - 1] = color.b * color.alpha;
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
      const pixelFixtures = Object.values(config.fixtures).filter((f) => f.rgb);
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
      updateFixtureGroup();
      clearBuffer();
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
    fixtures: {},
  },
  create: createDmxOutput,
};

export const DMX_PLUGIN: Plugin = {
  init: (context) => {
    context.registerOutputKind(DMX_OUTPUT_KIND);
  },
};
