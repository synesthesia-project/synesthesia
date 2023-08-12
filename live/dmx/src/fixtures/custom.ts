import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import { v4 as uuidv4 } from 'uuid';

import { Fixture, FixtureChannel } from './types';
import { MAX_CHANNEL_VALUE, allSet, validateChannel } from '../util';

const CHANNEL = t.partial({
  name: t.string,
  channel: t.number,
  /** value to use when not being set by a sequence */
  value: t.number,
});

export type Channel = t.TypeOf<typeof CHANNEL>;

export const CUSTOM_FIXTURE_CONFIG = t.intersection([
  t.type({
    type: t.literal('custom'),
  }),
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
    channels: t.record(t.string, CHANNEL),
  }),
]);

export type CustomFixtureConfig = t.TypeOf<typeof CUSTOM_FIXTURE_CONFIG>;

export const DEFAULT_CUSTOM_FIXTURE_CONFIG: CustomFixtureConfig = {
  type: 'custom',
};

export const createFixture = (
  updateConfig: (
    update: (current: CustomFixtureConfig) => CustomFixtureConfig
  ) => void
): Fixture<CustomFixtureConfig> => {
  let config: CustomFixtureConfig = DEFAULT_CUSTOM_FIXTURE_CONFIG;

  const group = new ld.Group({ noBorder: true, direction: 'vertical' });

  const header = group.addChild(new ld.Group({ noBorder: true, wrap: true }));

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
      updateConfig((c) => ({ ...c, rgb: undefined }));
    }
    if (allSet(rgb)) {
      const [r, g, b] = rgb;
      updateConfig((c) => ({ ...c, rgb: { r, g, b } }));
    } else {
      throw new Error(`All channels must be set or empty`);
    }
  });

  group.addChild(new ld.Button('Add Channel', 'add')).addListener(() =>
    updateConfig((c) => ({
      ...c,
      channels: { ...c.channels, [uuidv4()]: {} },
    }))
  );

  const channels: Map<
    string,
    {
      group: ld.Group;
      slider: ld.SliderButton;
      name: ld.TextInput;
      channel: ld.TextInput;
    }
  > = new Map();

  return {
    type: 'custom',
    group,
    defaultConfig: DEFAULT_CUSTOM_FIXTURE_CONFIG,
    setConfig: (newConfig) => {
      config = newConfig;

      ri.setValue(`${config.rgb?.r ?? ''}`);
      gi.setValue(`${config.rgb?.g ?? ''}`);
      bi.setValue(`${config.rgb?.b ?? ''}`);

      // Create / update channel components
      for (const [chId, ch] of Object.entries(config.channels || {})) {
        let chComponents = channels.get(chId);
        if (!chComponents) {
          // Create channel components
          const chGroup = group.addChild(
            new ld.Group({ noBorder: true, wrap: true })
          );

          const updateChannel = (update: Channel) =>
            updateConfig((c) => ({
              ...c,
              channels: {
                ...c.channels,
                [chId]: {
                  ...c.channels?.[chId],
                  ...update,
                },
              },
            }));

          const slider = chGroup.addChild(
            new ld.SliderButton(0, 0, MAX_CHANNEL_VALUE, 1)
          );
          slider.addListener((value) =>
            updateChannel({ value: Math.round(value) })
          );

          chGroup.addChild(new ld.Label('Name:'));
          const name = chGroup.addChild(new ld.TextInput(''));
          chGroup.addChild(new ld.Label('Channel:'));
          const channel = chGroup.addChild(new ld.TextInput(''));

          chGroup.addChild(new ld.Button('Set', 'save')).addListener(() =>
            updateChannel({
              name: name.getValidatedValue((t) => t) ?? undefined,
              channel: channel.getValidatedValue(validateChannel) ?? undefined,
            })
          );

          chGroup.addChild(new ld.Button(null, 'delete')).addListener(() =>
            updateConfig((c) => {
              const channels = { ...c.channels };
              delete channels[chId];
              return {
                ...c,
                channels,
              };
            })
          );

          channels.set(
            chId,
            (chComponents = {
              group: chGroup,
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
      for (const [chId, chComponents] of channels.entries()) {
        if (!config.channels?.[chId]) {
          group.removeChild(chComponents.group);
        }
      }
    },
    getPixels: () => {
      if (config.rgb) {
        return [
          {
            channels: {
              r: config.rgb.r - 1,
              g: config.rgb.g - 1,
              b: config.rgb.b - 1,
            },
            x: config.pos?.x ?? 0,
            y: config.pos?.y ?? 0,
          },
        ];
      }
      return [];
    },
    getChannels: () => {
      const channels: FixtureChannel[] = [];
      for (const [chId, ch] of Object.entries(config.channels || {})) {
        if (ch.channel) {
          channels.push({
            id: chId,
            channel: ch.channel,
            value: ch.value ?? 0,
            name: ch.name,
          });
        }
      }
      return channels;
    },
    getTotalChannelsUsed: () => {
      return Math.max(
        ...Object.values(config.channels || {}).map((c) => c.channel ?? 0),
        config.rgb?.r ?? 0,
        config.rgb?.g ?? 0,
        config.rgb?.b ?? 0
      );
    },
  };
};
