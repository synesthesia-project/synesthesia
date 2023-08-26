import * as t from 'io-ts';
import { GENERIC_CONTROLLER_CONFIG } from './controllers/generic';
import { MACKIE_MCU_CONTROLLER_CONFIG } from './controllers/mcu';

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
