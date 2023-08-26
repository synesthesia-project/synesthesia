import * as ld from '@synesthesia-project/light-desk/';
import {
  ConfigApplyer,
  ConfigUpdater,
} from '@synesthesia-project/live-core/lib/util';

import { LightMapping, LightsConfig } from '../config';

type Mapping = {
  type: LightMapping['type'];
  component: ld.Component;
  destroy: () => void;
  applyConfig: ConfigApplyer<LightMapping>;
};

export const initializeLights = (updateConfig: ConfigUpdater<LightsConfig>) => {
  const group = new ld.Group(
    { direction: 'vertical' },
    { defaultCollapsibleState: 'closed' }
  );
  group.setTitle('Light Mappings');

  group.addHeaderButton(new ld.Button('BPM Link', 'add')).addListener(() => {
    updateConfig((config) => [...config, { type: 'bpm', lights: [] }]);
  });

  const mappings: Mapping[] = [];

  const createMapping = (lId: number, type: LightMapping['type']): Mapping => {
    const group = new ld.Group(
      { direction: 'vertical' },
      { defaultCollapsibleState: 'auto' }
    );

    group.addHeaderButton(new ld.Button('Remove', 'remove')).addListener(() =>
      updateConfig((config) => {
        const newConfig = [...config];
        newConfig.splice(lId, 1);
        return newConfig;
      })
    );

    const applyConfig: ConfigApplyer<LightMapping> = (
      _newConfig,
      _oldConfig
    ) => {
      // TODO
    };

    const destroy = () => {
      // TODO
    };

    return {
      type,
      component: group,
      destroy,
      applyConfig,
    };
  };

  const applyConfig: ConfigApplyer<LightsConfig> = (newConfig, oldConfig) => {
    group.removeAllChildren();

    // Update all mappings to match new config
    for (let i = 0; i < newConfig.length; i++) {
      const existingMapping = mappings[i];
      if (!existingMapping || existingMapping.type !== newConfig[i].type) {
        // Create / replace all mappings with different type
        existingMapping?.destroy();
        const mapping = createMapping(i, newConfig[i].type);
        group.addChild(mapping.component);
        mappings[i] = mapping;
      }
      // Update config
      mappings[i].applyConfig(newConfig[i], oldConfig?.[i] ?? null);
    }

    // Remove mappings that don't exist anymore
    for (let i = newConfig.length; i < mappings.length; i++) {
      mappings[i].destroy();
    }

    mappings.length = newConfig.length;

    mappings.forEach((mapping) => group.addChild(mapping.component));
  };

  return {
    group,
    applyConfig,
  };
};
