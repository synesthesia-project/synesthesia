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
import {
  RGBStripFixtureConfig,
  RGB_STRIP_FIXTURE_CONFIG,
  createRGBStripFixture,
} from './fixtures/rgb-strip';

const SPECIFIC_FIXTURE_CONFIG = t.union([
  CUSTOM_FIXTURE_CONFIG,
  RGB_STRIP_FIXTURE_CONFIG,
]);

type FixtureType = t.TypeOf<typeof SPECIFIC_FIXTURE_CONFIG>['type'];

const DMX_OUTPUT_CONFIG = t.type({
  universes: UNIVERSES_CONFIG,
  fixtures: t.record(
    t.string,
    t.intersection([
      t.type({
        config: SPECIFIC_FIXTURE_CONFIG,
      }),
      t.partial({
        universe: t.number,
        channel: t.number,
        name: t.string,
        properties: t.record(t.string, t.union([t.string, t.undefined]))
      }),
    ])
  ),
});

type Config = t.TypeOf<typeof DMX_OUTPUT_CONFIG>;

type FixtureConfig = Config['fixtures'][number];

type ActiveFixture = {
  config: FixtureConfig | null;
  fixture: Fixture<CustomFixtureConfig> | Fixture<RGBStripFixtureConfig>;
  components: {
    group: ld.Group;
    patch: Record<'universe' | 'channel', ld.TextInput>;
    propertiesList: ld.Group;
  };
};

const createDmxOutput = (context: OutputContext<Config>): Output<Config> => {
  const universes = new Universes((update) =>
    context.updateConfig((existing) => ({
      ...existing,
      universes: update(existing.universes),
    }))
  );

  const group = new ld.Group({ noBorder: true, direction: 'vertical' });

  group.addChild(universes.group);

  const header = new ld.Group({
    noBorder: true,
    direction: 'horizontal',
    wrap: true,
  });
  group.addChild(header);

  header
    .addChild(new ld.Button({ text: 'Add Custom Fixture', icon: 'add' }))
    .addListener('click', () => {
      context.updateConfig((existing) => ({
        ...existing,
        fixtures: {
          ...existing.fixtures,
          [uuidv4()]: { config: { type: 'custom' } },
        },
      }));
    });

  header
    .addChild(new ld.Button({ text: 'Add RGB Strip', icon: 'add' }))
    .addListener('click', () => {
      context.updateConfig((existing) => ({
        ...existing,
        fixtures: {
          ...existing.fixtures,
          [uuidv4()]: { config: { type: 'rgb-strip' } },
        },
      }));
    });

  const fixtureGroup = new ld.Group({ noBorder: true, direction: 'vertical' });
  group.addChild(fixtureGroup);

  const updateFixtureConfig = (
    uuid: string,
    change: (current: FixtureConfig) => FixtureConfig
  ) =>
    context.updateConfig((existing) => ({
      ...existing,
      fixtures: {
        ...existing.fixtures,
        [uuid]: change(existing.fixtures[uuid]),
      },
    }));

  const removeFixture = (uuid: string) => {
    context.updateConfig((existing) => {
      const fixtures = { ...existing.fixtures };
      delete fixtures[uuid];
      return {
        ...existing,
        fixtures,
      };
    });
  };

  const fixtures = new Map<string, ActiveFixture>();

  const createSpecificFixture = (fxId: string, type: FixtureType) => {
    switch (type) {
      case 'custom':
        return createCustomFixture((update) =>
          updateFixtureConfig(fxId, (existing) => ({
            ...existing,
            config: update(
              existing.config?.type === 'custom'
                ? existing.config
                : { type: 'custom' }
            ),
          }))
        );
      case 'rgb-strip':
        return createRGBStripFixture((update) =>
          updateFixtureConfig(fxId, (existing) => ({
            ...existing,
            config: update(
              existing.config?.type === 'rgb-strip'
                ? existing.config
                : { type: 'rgb-strip' }
            ),
          }))
        );
    }
  };

  const updatePropertiesList = (fxId: string, group: ld.Group, config: FixtureConfig) => {
    group.removeAllChildren();
    for (const [key, val] of Object.entries(config.properties || {})) {
      const prop = group.addChild(new ld.Group({ noBorder: true }));
      prop.addChild(
        new ld.Button({ icon: 'delete', text: 'Delete'})
      ).addListener('click', () =>
        updateFixtureConfig(fxId, (c) => ({
          ...c,
          properties: Object.fromEntries(Object.entries(c.properties || {}).filter(([k]) => k !== key))
        }))
      );
      prop.addChild(
        new ld.Label({ text: `${key}: ${val}`})
      );
    }
  }

  const createFixture = (fxId: string, type: FixtureType): ActiveFixture => {
    const group = new ld.Group({
      direction: 'vertical',
      editableTitle: true,
      defaultCollapsibleState: 'auto',
    });

    group.addListener('title-changed', (name) =>
      updateFixtureConfig(fxId, (c) => ({ ...c, name }))
    );

    group
      .addHeaderChild(new ld.Button({ icon: 'delete' }))
      .addListener('click', () => removeFixture(fxId));

    const patch = group.addChild(new ld.Group({ noBorder: true, wrap: true }));

    patch.addChild(new ld.Label({ text: 'Universe + Channel:' }));
    const [universe, channel, setUniverseChannel] = patch.addChildren(
      new ld.TextInput(),
      new ld.TextInput(),
      new ld.Button({ text: 'Set', icon: 'save' })
    );
    setUniverseChannel.addListener('click', () => {
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

    const properties = group.addChild(new ld.Group({
      title: 'Properties',
      defaultCollapsibleState: 'closed',
      direction: 'vertical'
    }));

    const addPropertyGroup = properties.addChild(new ld.Group({
      direction: 'horizontal',
      noBorder: true
    }));

    addPropertyGroup.addChild(new ld.Label({ text: 'Set Property: '}));
    addPropertyGroup.addChild(new ld.Label({ text: 'Key: '}));
    const newPropertyName = addPropertyGroup.addChild(new ld.TextInput());
    addPropertyGroup.addChild(new ld.Label({ text: 'Val: '}));
    const newPropertyVal = addPropertyGroup.addChild(new ld.TextInput());

    addPropertyGroup.addChild(new ld.Button({icon: 'save', text: 'Save'}))
      .addListener('click', () => 
        updateFixtureConfig(fxId, (config) => ({
          ...config,
          properties: {
            ...config.properties,
            [newPropertyName.getValue() || '']: newPropertyVal.getValue() || ''
          }
        }))
      );

    const propertiesList = properties.addChild(new ld.Group({
      direction: 'vertical',
      noBorder: true
    }));

    const fixture = createSpecificFixture(fxId, type);

    group.addChild(fixture.group);

    return {
      fixture,
      config: null,
      components: {
        group,
        patch: { universe, channel },
        propertiesList
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

    if (
      fixture.fixture.type === 'custom' &&
      fxConfig.config.type === 'custom'
    ) {
      fixture.fixture.setConfig(fxConfig.config);
    } else if (
      fixture.fixture.type === 'rgb-strip' &&
      fxConfig.config.type === 'rgb-strip'
    ) {
      fixture.fixture.setConfig(fxConfig.config);
    } else {
      throw new Error(`Config Mismatch`);
    }

    fixture.components.group.setTitle(fxConfig.name || '');
    const labels: Array<{
      text: string;
    }> = [{ text: `${fxConfig.config.type}` }];
    if (fxConfig.universe !== undefined && fxConfig.channel !== undefined) {
      const firstChannel = fxConfig.channel;
      const lastChannel =
        firstChannel + fixture.fixture.getTotalChannelsUsed() - 1;
      const channelNotation =
        firstChannel !== lastChannel
          ? `${firstChannel}-${lastChannel}`
          : `${firstChannel}`;
      labels.push({
        text: `${fxConfig.universe}.${channelNotation}`,
      });
    }
    fixture.components.group.setLabels(labels);
    fixture.components.patch.universe.setValue(`${fxConfig.universe ?? ''}`);
    fixture.components.patch.channel.setValue(`${fxConfig.channel ?? ''}`);

    updatePropertiesList(fxId, fixture.components.propertiesList, fixture.config);
  };

  const updateFixtures = (config: Config) => {
    // Add or update existing fixtures
    for (const [fxId, fx] of Object.entries(config.fixtures)) {
      if (!fixtures.has(fxId)) {
        const fixture = createFixture(fxId, fx.config.type);
        fixtures.set(fxId, fixture);
        fixtureGroup.addChild(fixture.components.group);
      }
      updateFixture(fxId, fx);
    }

    // Delete removed fixtures
    for (const [fxId, fx] of fixtures.entries()) {
      if (!config.fixtures[fxId]) {
        fixtureGroup.removeChild(fx.components.group);
        fixtures.delete(fxId);
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
          buffer[channelOffset + pixel.channels.r] = color.r * color.alpha;
          buffer[channelOffset + pixel.channels.g] = color.g * color.alpha;
          buffer[channelOffset + pixel.channels.b] = color.b * color.alpha;
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
    applyConfig: (config, lastConfig) => {
      if (lastConfig === config) {
        return;
      }
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
