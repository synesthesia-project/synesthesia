import * as ld from '@synesthesia-project/light-desk';
import { SequencesConfig } from '../config';
import { Channel } from '@synesthesia-project/live-core/lib/plugins';

export const INIT_SEQUENCES_CONFIG: SequencesConfig = {
  groups: {},
};

export const Sequences = () => {
  const configGroup = new ld.Group({ direction: 'vertical', noBorder: true });

  configGroup.addChild(new ld.Label('SQ'));

  const init = (_options: {
    updateConfig: (
      update: (config: SequencesConfig) => SequencesConfig
    ) => Promise<void>;
  }) => {};

  const loadConfig = (_config: SequencesConfig) => {};

  const setChannels = (channels: Record<string, Channel>) => {
    console.log('setChannels', channels);
  };

  return {
    init,
    configGroup,
    setConfig: loadConfig,
    setChannels,
  };
};
