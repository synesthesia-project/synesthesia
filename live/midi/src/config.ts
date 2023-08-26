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

export const MIDI_CONTROLLER_COMPONENT_IDENTIFIER = t.type({
  cId: t.string,
  component: t.string,
});

export const LIGHT_BPM_MAPPING_CONFIG = t.type({
  type: t.literal('bpm'),
  lights: t.array(MIDI_CONTROLLER_COMPONENT_IDENTIFIER),
});

// TODO: expand with other types of mappings
export const LIGHT_MAPPING = LIGHT_BPM_MAPPING_CONFIG;

export type LightMapping = t.TypeOf<typeof LIGHT_MAPPING>;

export const LIGHTS_CONFIG = t.array(LIGHT_MAPPING);

export type LightsConfig = t.TypeOf<typeof LIGHTS_CONFIG>;

export const PAGE_CONFIG = t.partial({
  lights: t.array(LIGHT_MAPPING),
});

export type PageConfig = t.TypeOf<typeof PAGE_CONFIG>;

export const PAGES_CONFIG = t.array(PAGE_CONFIG);

export type PagesConfig = t.TypeOf<typeof PAGES_CONFIG>;

export const MIDI_PLUGIN_CONFIG = t.type({
  controllers: CONTROLLERS_CONFIG,
  pages: PAGES_CONFIG,
});

export type MidiPluginConfig = t.TypeOf<typeof MIDI_PLUGIN_CONFIG>;
