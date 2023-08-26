import { Plugin } from '@synesthesia-project/live-core/lib/plugins';
import * as ld from '@synesthesia-project/light-desk';
import { MIDI_PLUGIN_CONFIG } from './config';
import { getMIDIDevices } from '@synesthesia-project/midi-consoles';
import { initializeControllers } from './controllers';

export const MIDI_PLUGIN: Plugin = {
  init: (context) => {
    const tab = new ld.Group({ direction: 'vertical', noBorder: true });
    context.createTab('MIDI', tab);

    const configSection = context.createConfigSection(
      'midi',
      MIDI_PLUGIN_CONFIG,
      {
        controllers: {},
      }
    );

    const addController = tab.addChild(
      new ld.Group(
        { direction: 'vertical' },
        { defaultCollapsibleState: 'closed' }
      )
    );

    addController.setTitle('Add Controller');

    addController
      .addHeaderButton(new ld.Button(null, 'refresh'))
      .addListener(() => {
        addController.removeAllChildren();
        for (const name of getMIDIDevices()) {
          addController.addChild(new ld.Button(name)).addListener(() => {
            controllers.addController(name);
          });
        }
      });

    const controllers = initializeControllers((update) =>
      configSection.updateConfig((config) => ({
        ...config,
        controllers: update(config.controllers),
      }))
    );

    tab.addChild(controllers.controllersGroup);

    configSection.addListener((newConfig, oldConfig) => {
      if (oldConfig?.controllers !== newConfig.controllers) {
        controllers.applyConfig(
          newConfig.controllers,
          oldConfig?.controllers ?? null
        );
      }
    });
  },
};
