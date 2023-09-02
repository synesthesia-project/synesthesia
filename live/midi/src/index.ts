import { Plugin } from '@synesthesia-project/live-core/lib/plugins';
import * as ld from '@synesthesia-project/light-desk';
import { MIDI_PLUGIN_CONFIG } from './config';
import { getMIDIDevices } from '@synesthesia-project/midi-consoles';
import { initializeControllers } from './controllers';
import { initializePages } from './mappings/pages';

export const MIDI_PLUGIN: Plugin = {
  init: (context) => {
    const tab = new ld.Group({ direction: 'vertical', noBorder: true });
    context.createTab('MIDI', tab);

    const configSection = context.createConfigSection(
      'midi',
      MIDI_PLUGIN_CONFIG,
      {
        controllers: {},
        pages: [],
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

    const controllers = initializeControllers(
      configSection.createChild({
        get: (config) => config.controllers,
        updateParentByChild: (current, childUpdate) => ({
          ...current,
          controllers: childUpdate(current.controllers),
        }),
      })
    );

    tab.addChild(controllers.controllersGroup);

    const pages = initializePages(
      configSection.createChild({
        get: (config) => config.pages,
        updateParentByChild: (current, childUpdate) => ({
          ...current,
          pages: childUpdate(current.pages),
        }),
      })
    );

    tab.addChild(new ld.Button('Add Page')).addListener(() => {
      pages.addPage();
    });
    tab.addChild(pages.pagesTabs);
  },
};
