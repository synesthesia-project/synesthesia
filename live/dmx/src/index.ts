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

const INTEGER_REGEX = /^[0-9]+$/;
const MAX_CHANNEL = 512;
const MAX_VALUE = 255;

const validateChannel = (t: string): number => {
  if (!INTEGER_REGEX.exec(t)) {
    throw new Error(`Channels must be positive integers`);
  }
  const c = parseInt(t);
  if (c < 1 || c > MAX_CHANNEL) {
    throw new Error(`Channels must be between 1 and ${MAX_CHANNEL}`);
  }
  return c;
};

/**
 * Return true if all the given values are set
 */
const allSet = <T>(values: (T | null | undefined)[]): values is T[] =>
  !values.some((v) => v === null || v === undefined);

const CHANNEL = t.partial({
  name: t.string,
  channel: t.number,
  /** value to use when not being set by a sequence */
  value: t.number,
});

const DMX_OUTPUT_CONFIG = t.type({
  universes: UNIVERSES_CONFIG,
  fixtures: t.record(
    t.string,
    t.partial({
      universe: t.number,
      channel: t.number,
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
      channels: t.record(t.string, CHANNEL),
    })
  ),
});

type Config = t.TypeOf<typeof DMX_OUTPUT_CONFIG>;

type Fixture = Config['fixtures'][number];

type Channel = t.TypeOf<typeof CHANNEL>;

const createDmxOutput = (context: OutputContext<Config>): Output<Config> => {
  let config: Config = {
    universes: [],
    fixtures: {},
  };

  const universes = new Universes(config.universes, (update) =>
    context.saveConfig({ ...config, universes: update(config.universes) })
  );

  const group = new ld.Group({ noBorder: true, direction: 'vertical' });

  group.addChild(universes.group);

  const header = new ld.Group({ noBorder: true, direction: 'horizontal' });
  group.addChild(header);

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

  const fixtureComponents = new Map<
    string,
    {
      config: Fixture;
      group: ld.Group;
      patch: Record<'universe' | 'channel', ld.TextInput>;
      rgb: Record<'ri' | 'gi' | 'bi', ld.TextInput>;
      channels: Map<
        string,
        {
          group: ld.Group;
          slider: ld.SliderButton;
          name: ld.TextInput;
          channel: ld.TextInput;
        }
      >;
    }
  >();

  // TODO: split components into a separate module
  const createFixtureComponents = (fxId: string) => {
    const group = fixtureGroup.addChild(
      new ld.Group(
        {
          direction: 'vertical',
        },
        {
          editableTitle: true,
          defaultCollapsibleState: 'auto',
        }
      )
    );

    group.addListener('title-changed', (name) =>
      updateFixtureConfig(fxId, (c) => ({ ...c, name }))
    );

    group.addHeaderButton(new ld.Button('Add Channel', 'add')).addListener(() =>
      updateFixtureConfig(fxId, (c) => ({
        ...c,
        channels: { ...c.channels, [uuidv4()]: {} },
      }))
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

    const header = group.addChild(new ld.Group({ noBorder: true }));

    header.addChild(new ld.Label('RGB Channels:'));
    const [ri, gi, bi, setColorChannels] = header.addChildren(
      new ld.TextInput(''),
      new ld.TextInput(''),
      new ld.TextInput(''),
      new ld.Button('Set', 'save')
    );
    setColorChannels.addListener(() => {
      const rgb = [ri, gi, bi].map((t) => t.getValidatedValue(validateChannel));
      if (!rgb.some((c) => c !== null)) {
        // No values set, remove colors
        updateFixtureConfig(fxId, (c) => ({ ...c, rgb: undefined }));
      }
      if (allSet(rgb)) {
        const [r, g, b] = rgb;
        updateFixtureConfig(fxId, (c) => ({ ...c, rgb: { r, g, b } }));
      } else {
        throw new Error(`All channels must be set or empty`);
      }
    });
    fixtureComponents.set(fxId, {
      config: {},
      group,
      patch: { universe, channel },
      rgb: { ri, gi, bi },
      channels: new Map(),
    });
  };

  // TODO: split components into a separate module
  const updateFixtureComponents = (fxId: string, fx: Fixture) => {
    const components = fixtureComponents.get(fxId);
    if (!components) {
      throw new Error(`Unexpected missing components`);
    }
    if (fx === components.config) {
      // If config hasn't changed, don't do anything
      return;
    }
    components.config = fx;

    components.group.setTitle(fx.name || '');
    if (fx.universe !== undefined && fx.channel !== undefined) {
      components.group.setLabels([{ text: `${fx.universe}.${fx.channel}` }]);
    } else {
      components.group.setLabels([{ text: 'unpatched' }]);
    }
    components.patch.universe.setValue(`${fx.universe ?? ''}`);
    components.patch.channel.setValue(`${fx.channel ?? ''}`);
    components.rgb.ri.setValue(`${fx.rgb?.r ?? ''}`);
    components.rgb.gi.setValue(`${fx.rgb?.g ?? ''}`);
    components.rgb.bi.setValue(`${fx.rgb?.b ?? ''}`);

    // Create / update channel components
    for (const [chId, ch] of Object.entries(fx.channels || {})) {
      let chComponents = components.channels.get(chId);
      if (!chComponents) {
        // Create channel components
        const group = components.group.addChild(
          new ld.Group({ noBorder: true })
        );

        const updateChannel = (update: Channel) =>
          updateFixtureConfig(fxId, (c) => ({
            ...c,
            channels: {
              ...c.channels,
              [chId]: {
                ...c.channels?.[chId],
                ...update,
              },
            },
          }));

        const slider = group.addChild(new ld.SliderButton(0, 0, MAX_VALUE, 1));
        slider.addListener((value) =>
          updateChannel({ value: Math.round(value) })
        );

        group.addChild(new ld.Label('Name:'));
        const name = group.addChild(new ld.TextInput(''));
        group.addChild(new ld.Label('Channel:'));
        const channel = group.addChild(new ld.TextInput(''));

        group.addChild(new ld.Button('Set', 'save')).addListener(() =>
          updateChannel({
            name: name.getValidatedValue((t) => t) ?? undefined,
            channel: channel.getValidatedValue(validateChannel) ?? undefined,
          })
        );

        group.addChild(new ld.Button(null, 'delete')).addListener(() =>
          updateFixtureConfig(fxId, (c) => {
            const channels = { ...c.channels };
            delete channels[chId];
            return {
              ...c,
              channels,
            };
          })
        );

        components.channels.set(
          chId,
          (chComponents = {
            group,
            slider,
            channel,
            name,
          })
        );
      }

      // Update channel components
      if (ch.value) chComponents.slider.setValue(ch.value);
      if (ch.name) chComponents.name.setValue(ch.name);
      if (ch.channel) chComponents.channel.setValue(`${ch.channel}`);
    }

    // Remove any removed channels
    for (const [chId, chComponents] of components.channels.entries()) {
      if (!fx.channels?.[chId]) {
        components.group.removeChild(chComponents.group);
      }
    }
  };

  const updateFixtureGroup = () => {
    // TODO: split components into a separate module

    // Add or update existing fixtures
    for (const [fxId, fx] of Object.entries(config.fixtures)) {
      if (!fixtureComponents.has(fxId)) {
        createFixtureComponents(fxId);
      }
      updateFixtureComponents(fxId, fx);
    }

    // Delete removed fixtures
    for (const [fxId, fxComponents] of fixtureComponents.entries()) {
      if (!config.fixtures[fxId]) {
        fixtureGroup.removeChild(fxComponents.group);
      }
    }
  };

  let pixels: {
    /**
     * Fixtures that secifically have "pixel" outputs
     */
    fixtures: Array<Fixture | undefined>;
    map: PixelMap;
    pixelInfo: Array<PixelInfo<null>>;
  } | null;

  const render = () => {
    universes.render((buffers) => {
      if (!pixels) return;
      const frame = context.render(pixels.map, pixels.pixelInfo);
      for (let i = 0; i < frame.length; i++) {
        const color = frame[i];
        const fixture = pixels.fixtures[i];
        const buffer =
          fixture?.universe !== undefined && buffers[fixture.universe];
        if (buffer && fixture?.rgb && fixture.channel !== undefined) {
          const channelOffset = fixture.channel - 1;
          buffer[channelOffset + fixture.rgb.r - 1] = color.r * color.alpha;
          buffer[channelOffset + fixture.rgb.g - 1] = color.g * color.alpha;
          buffer[channelOffset + fixture.rgb.b - 1] = color.b * color.alpha;
        }
      }
      const channelValues = context.getChannelValues();
      for (const fixture of Object.values(config.fixtures)) {
        const buffer =
          fixture?.universe !== undefined && buffers[fixture.universe];
        if (buffer && fixture.channel !== undefined) {
          const channelOffset = fixture.channel - 1;
          for (const [chId, ch] of Object.entries(fixture.channels || {})) {
            // TODO: get value from sequences if set there
            if (ch.channel !== undefined && ch.value !== undefined) {
              const value = channelValues.get(chId) || ch.value;
              buffer[channelOffset + ch.channel - 1] = value;
            }
          }
        }
      }
    });
  };

  const renderInterval = setInterval(render, 10);

  const setChannels = () => {
    const channels: Record<string, OutputChannel> = {};
    Object.values(config.fixtures).map((f, fIndex) => {
      for (const [chId, ch] of Object.entries(f.channels || {})) {
        if (ch.name && ch.channel) {
          channels[chId] = {
            type: 'dmx',
            name: [f.name || `Fixture ${fIndex}`, ch.name],
          };
        }
      }
    });
    context.setChannels(channels);
  };

  return {
    setConfig: (c) => {
      config = c;
      universes.setConfig(c.universes);
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
      setChannels();
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
