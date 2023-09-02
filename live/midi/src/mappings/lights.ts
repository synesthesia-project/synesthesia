import * as ld from '@synesthesia-project/light-desk/';
import {
  CONFIG_MISSING,
  ConfigNode,
} from '@synesthesia-project/live-core/lib/util';

import { LightMapping, LightsConfig } from '../config';

type Mapping = {
  type: LightMapping['type'];
  component: ld.Component;
};

export const initializeLights = (
  config: ConfigNode<LightsConfig | undefined>
) => {
  const group = new ld.Group(
    { direction: 'vertical' },
    { defaultCollapsibleState: 'closed' }
  );
  group.setTitle('Light Mappings');

  group.addHeaderButton(new ld.Button('BPM Link', 'add')).addListener(() => {
    config.update((config) => [...(config || []), { type: 'bpm', lights: [] }]);
  });

  const mappings: Mapping[] = [];

  const createMapping = (lId: number, type: LightMapping['type']): Mapping => {
    const group = new ld.Group(
      { direction: 'vertical' },
      { defaultCollapsibleState: 'auto' }
    );

    group.addHeaderButton(new ld.Button('Remove', 'remove')).addListener(() =>
      config.update((config) => {
        const newConfig = [...(config || [])];
        newConfig.splice(lId, 1);
        return newConfig;
      })
    );

    return {
      type,
      component: group,
    };
  };

  config.addListener('change', (newConfig, oldConfig) => {
    newConfig = newConfig === CONFIG_MISSING ? [] : [...(newConfig || [])];
    oldConfig = oldConfig === CONFIG_MISSING ? [] : [...(oldConfig || [])];
    group.removeAllChildren();

    // Update all mappings to match new config
    for (let i = 0; i < newConfig.length; i++) {
      const existingMapping = mappings[i];
      if (!existingMapping || existingMapping.type !== newConfig[i].type) {
        // Create / replace all mappings with different type
        // TODO: run unlink() on old mapping if it exists
        const mapping = createMapping(i, newConfig[i].type);
        group.addChild(mapping.component);
        mappings[i] = mapping;
      }
    }

    mappings.length = newConfig.length;

    mappings.forEach((mapping) => group.addChild(mapping.component));
  });

  return {
    group,
  };
};
