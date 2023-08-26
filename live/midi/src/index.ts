import { Plugin } from '@synesthesia-project/live-core/lib/plugins';
import * as ld from '@synesthesia-project/light-desk';

export const MIDI_PLUGIN: Plugin = {
  init: (context) => {
    context.createTab(
      'MIDI',
      new ld.Group({ direction: 'vertical', noBorder: true })
    );
  },
};
