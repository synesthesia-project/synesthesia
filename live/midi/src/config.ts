import * as t from 'io-ts';

export const GENERIC_CONTROLLER_CONFIG = t.type({
  type: t.literal('generic'),
});

export const MACKIE_MCU_CONTROLLER_CONFIG = t.type({
  type: t.literal('mcu'),
  /**
   * Required if you want to set LCD text
   */
  deviceId: t.union([t.null, t.number]),
});

export const CONTROLER_CONFIG = t.type({
  name: t.string,
  config: t.union([
    t.null,
    GENERIC_CONTROLLER_CONFIG,
    MACKIE_MCU_CONTROLLER_CONFIG,
  ]),
});

export type ControllerConfig = t.TypeOf<typeof CONTROLER_CONFIG>;

export const CONTROLLERS_CONFIG = t.record(t.string, CONTROLER_CONFIG);

export type ControllersConfig = t.TypeOf<typeof CONTROLLERS_CONFIG>;

export const MIDI_PLUGIN_CONFIG = t.type({
  controllers: CONTROLLERS_CONFIG,
});

export type MidiPluginConfig = t.TypeOf<typeof MIDI_PLUGIN_CONFIG>;
