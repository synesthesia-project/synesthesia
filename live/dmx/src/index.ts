import * as t from 'io-ts';
import {
  Output,
  OutputContext,
  OutputKind,
  Plugin,
  Channel as OutputChannel,
} from '@synesthesia-project/live-core/lib/plugins';
import * as ld from '@synesthesia-project/light-desk';
import {
  PixelInfo,
  PixelMap,
} from '@synesthesia-project/compositor/lib/modules';
import { v4 as uuidv4 } from 'uuid';

import { UNIVERSES_CONFIG, Universes } from './universes';
import {
  CUSTOM_FIXTURE_CONFIG,
  CustomFixtureConfig,
  createFixture as createCustomFixture,
} from './fixtures/custom';
import { Fixture, FixturePixel } from './fixtures/types';
import { validateChannel } from './util';

const DMX_OUTPUT_CONFIG = t.type({
  universes: UNIVERSES_CONFIG,
  fixtures: t.record(
    t.string,
    t.partial({
      universe: t.number,
      channel: t.number,
      name: t.string,
      config: CUSTOM_FIXTURE_CONFIG,
    })
  ),
});

type Config = t.TypeOf<typeof DMX_OUTPUT_CONFIG>;

type FixtureConfig = Config['fixtures'][number];

type ActiveFixture = {
  config: FixtureConfig | null;
  fixture: Fixture<CustomFixtureConfig>;
  components: {
    group: ld.Group;
    patch: Record<'universe' | 'channel', ld.TextInput>;
  };
};

const createDmxOutput = (context: OutputContext<Config>): Output<Config> => {
  let lastConfig: unknown = null;

  const universes = new Universes((update) =>
    context.saveConfig((existing) => ({
      ...existing,
      universes: update(existing.universes),
    }))
  );

  const group = new ld.Group({ noBorder: true, direction: 'vertical' });

  group.addChild(universes.group);

  const header = new ld.Group({ noBorder: true, direction: 'horizontal' });
  group.addChild(header);

  const addFixture = new ld.Button('Add Fixture', 'add');
  header.addChild(addFixture);

  addFixture.addListener(() => {
    context.saveConfig((existing) => ({
      ...existing,
      fixtures: { ...existing.fixtures, [uuidv4()]: {} },
    }));
  });

  const fixtureGroup = new ld.Group({ noBorder: true, direction: 'vertical' });
  group.addChild(fixtureGroup);

  const updateFixtureConfig = (
    uuid: string,
    change: (current: FixtureConfig) => FixtureConfig
  ) =>
    context.saveConfig((existing) => ({
      ...existing,
      fixtures: {
        ...existing.fixtures,
        [uuid]: change(existing.fixtures[uuid]),
      },
    }));

  const removeFixture = (uuid: string) => {
    context.saveConfig((existing) => {
      const fixtures = { ...existing.fixtures };
      delete fixtures[uuid];
      return {
        ...existing,
        fixtures,
      };
    });
  };

  const fixtures = new Map<string, ActiveFixture>();

  const createFixture = (fxId: string): ActiveFixture => {
    const group = new ld.Group(
      {
        direction: 'vertical',
      },
      {
        editableTitle: true,
        defaultCollapsibleState: 'auto',
      }
    );

    group.addListener('title-changed', (name) =>
      updateFixtureConfig(fxId, (c) => ({ ...c, name }))
    );

    group
      .addHeaderButton(new ld.Button(null, 'delete'))
      .addListener(() => removeFixture(fxId));

    const patch = group.addChild(new ld.Group({ noBorder: true }));

    patch.addChild(new ld.Label('Universe + Channel:'));
    const [universe, channel, setUniverseChannel] = patch.addChildren(
      new ld.TextInput(''),
      new ld.TextInput(''),
      new ld.Button('Set', 'save')
    );
    setUniverseChannel.addListener(() => {
      const u = universe.getValidatedValue(universes.validateUniverse);
      const c = channel.getValidatedValue(validateChannel);
      if (u !== null && c !== null) {
        updateFixtureConfig(fxId, (config) => ({
          ...config,
          universe: u,
          channel: c,
        }));
      } else {
        updateFixtureConfig(fxId, (c) => ({
          ...c,
          universe: undefined,
          channel: undefined,
        }));
      }
    });

    const fixture = createCustomFixture((update) =>
      updateFixtureConfig(fxId, (existing) => ({
        ...existing,
        config: update(existing.config || { type: 'custom' }),
      }))
    );

    group.addChild(fixture.group);

    return {
      fixture,
      config: null,
      components: {
        group,
        patch: { universe, channel },
      },
    };
  };

  const updateFixture = (fxId: string, fxConfig: FixtureConfig) => {
    const fixture = fixtures.get(fxId);
    if (!fixture) {
      throw new Error(`Unexpected missing fixture`);
    }
    if (fixture.config === fxConfig) {
      // Unchanged
      return;
    }
    fixture.config = fxConfig;

    fixture.components.group.setTitle(fxConfig.name || '');
    if (fxConfig.universe !== undefined && fxConfig.channel !== undefined) {
      fixture.components.group.setLabels([
        { text: `${fxConfig.universe}.${fxConfig.channel}` },
      ]);
    } else {
      fixture.components.group.setLabels([{ text: 'unpatched' }]);
    }
    fixture.components.patch.universe.setValue(`${fxConfig.universe ?? ''}`);
    fixture.components.patch.channel.setValue(`${fxConfig.channel ?? ''}`);

    fixture.fixture.setConfig(fxConfig.config || fixture.fixture.defaultConfig);
  };

  const updateFixtures = (config: Config) => {
    // Add or update existing fixtures
    for (const [fxId, fx] of Object.entries(config.fixtures)) {
      if (!fixtures.has(fxId)) {
        const fixture = createFixture(fxId);
        fixtures.set(fxId, fixture);
        group.addChild(fixture.components.group);
      }
      updateFixture(fxId, fx);
    }

    // Delete removed fixtures
    for (const [fxId, fx] of fixtures.entries()) {
      if (!config.fixtures[fxId]) {
        fixtureGroup.removeChild(fx.components.group);
      }
    }
  };

  type EnhancedFixturePixel = FixturePixel & {
    fixtureConfig: FixtureConfig;
  };

  let pixels: {
    fixturePixels: EnhancedFixturePixel[];
    map: PixelMap;
    pixelInfo: Array<PixelInfo<null>>;
  } | null;

  const render = () => {
    universes.render((buffers) => {
      if (!pixels) return;
      const frame = context.render(pixels.map, pixels.pixelInfo);
      if (frame.length !== pixels.fixturePixels.length) {
        throw new Error(`Unexpected frame length`);
      }
      for (let i = 0; i < frame.length; i++) {
        const color = frame[i];
        const pixel = pixels.fixturePixels[i];
        const fxConfig = pixel.fixtureConfig;
        const buffer =
          fxConfig?.universe !== undefined && buffers[fxConfig.universe];
        if (buffer && fxConfig.channel !== undefined) {
          const channelOffset = fxConfig.channel - 1;
          buffer[channelOffset + pixel.channels.r - 1] = color.r * color.alpha;
          buffer[channelOffset + pixel.channels.g - 1] = color.g * color.alpha;
          buffer[channelOffset + pixel.channels.b - 1] = color.b * color.alpha;
        }
      }
      const channelValues = context.getChannelValues();
      for (const fx of fixtures.values()) {
        const fxConfig = fx.config;
        const buffer =
          fxConfig?.universe !== undefined && buffers[fxConfig.universe];
        if (buffer && fxConfig.channel !== undefined) {
          const channelOffset = fxConfig.channel - 1;
          for (const ch of fx.fixture.getChannels()) {
            if (ch.channel !== undefined && ch.value !== undefined) {
              const value = ch.override
                ? ch.value
                : channelValues.get(ch.id) ?? ch.value;
              buffer[channelOffset + ch.channel - 1] = value;
            }
          }
        }
      }
    });
  };

  const renderInterval = setInterval(render, 10);

  const updateContextChannels = () => {
    const channels: Record<string, OutputChannel> = {};
    [...fixtures.values()].map((f, fIndex) => {
      for (const ch of f.fixture.getChannels()) {
        if (ch.name && ch.channel) {
          channels[ch.id] = {
            type: 'dmx',
            name: [f.config?.name || `Fixture ${fIndex}`, ch.name],
          };
        }
      }
    });
    context.setChannels(channels);
  };

  const updatePixelsFromFixtures = () => {
    const fixturePixels: EnhancedFixturePixel[] = [];
    for (const fixture of fixtures.values()) {
      if (fixture.config) {
        for (const pixel of fixture.fixture.getPixels()) {
          fixturePixels.push({
            ...pixel,
            fixtureConfig: fixture.config,
          });
        }
      }
    }

    pixels = {
      fixturePixels,
      map: {
        xMin: Math.min(...fixturePixels.map((f) => f.x)),
        xMax: Math.max(...fixturePixels.map((f) => f.x)),
        yMin: Math.min(...fixturePixels.map((f) => f.y)),
        yMax: Math.max(...fixturePixels.map((f) => f.y)),
      },
      pixelInfo: fixturePixels.map((f) => ({
        data: null,
        x: f.x,
        y: f.y,
      })),
    };
  };

  return {
    setConfig: (config) => {
      if (lastConfig === config) {
        return;
      }
      lastConfig = config;
      universes.setConfig(config.universes);
      updateFixtures(config);
      updatePixelsFromFixtures();
      updateContextChannels();
      render();
    },
    destroy: () => {
      clearInterval(renderInterval);
      universes.destroy();
    },
    getLightDeskComponent: () => group,
  };
};

export const DMX_OUTPUT_KIND: OutputKind<Config> = {
  kind: 'dmx',
  config: DMX_OUTPUT_CONFIG,
  initialConfig: {
    universes: [],
    fixtures: {},
  },
  create: createDmxOutput,
};

export const DMX_PLUGIN: Plugin = {
  init: (context) => {
    context.registerOutputKind(DMX_OUTPUT_KIND);
  },
};
