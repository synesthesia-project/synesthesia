import { Plugin } from '@synesthesia-project/live-core/lib/plugins';
import * as ld from '@synesthesia-project/light-desk';
import { MIDI_PLUGIN_CONFIG } from './config';

export const MIDI_PLUGIN: Plugin = {
  init: (context) => {
    const tab = new ld.Group({ direction: 'vertical', noBorder: true });
    context.createTab('MIDI', tab);

    const config = context.createConfigSection('midi', MIDI_PLUGIN_CONFIG, []);

    config.addListener((config) => {
      console.log('midi config changed', config);
    });

    tab.addChild(new ld.Button('MIDI')).addListener(() => {
      config.updateConfig((config) => [...config, 'another']);
    });
  },
};
