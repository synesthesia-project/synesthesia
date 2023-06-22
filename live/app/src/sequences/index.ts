import * as ld from '@synesthesia-project/light-desk';
import { v4 as uuidv4 } from 'uuid';

import { SequencesConfig } from '../config';
import { Channel } from '@synesthesia-project/live-core/lib/plugins';

export const INIT_SEQUENCES_CONFIG: SequencesConfig = {
  groups: {},
};

type Group = {
  ldComponent: ld.Group;
};

export const Sequences = (options: {
  updateConfig: (
    update: (config: SequencesConfig) => SequencesConfig
  ) => Promise<void>;
}) => {
  const { updateConfig } = options;

  const groups = new Map<string, Group>();

  const configGroup = new ld.Group({ direction: 'vertical', noBorder: true });

  const header = configGroup.addChild(new ld.Group({ noBorder: true }));

  header.addChild(new ld.Button('Add Group', 'add')).addListener(() =>
    updateConfig((c) => ({
      ...c,
      groups: {
        ...c.groups,
        [uuidv4()]: {
          name: '',
        },
      },
    }))
  );

  const createGroup = (gId: string): Group => {
    const ldComponent = configGroup.addChild(
      new ld.Group(
        {},
        {
          editableTitle: true,
        }
      )
    );

    ldComponent.addListener('title-changed', (title) =>
      updateConfig((c) => {
        const existing = c.groups[gId];
        return existing
          ? {
              ...c,
              groups: {
                ...c.groups,
                [gId]: {
                  ...existing,
                  name: title,
                },
              },
            }
          : c;
      })
    );

    ldComponent.addHeaderButton(new ld.Button(null, 'delete')).addListener(() =>
      updateConfig((c) => ({
        ...c,
        groups: {
          ...c.groups,
          [gId]: undefined,
        },
      }))
    );

    return {
      ldComponent,
    };
  };

  const loadConfig = (config: SequencesConfig) => {
    for (const [gId, g] of Object.entries(config.groups)) {
      let group = groups.get(gId);
      if (!group) {
        groups.set(gId, (group = createGroup(gId)));
      }
      group.ldComponent.setTitle(g?.name || '');
    }
    // Remove deleted groups
    for (const [gId, group] of groups.entries()) {
      if (!config.groups[gId]) {
        configGroup.removeChild(group.ldComponent);
        groups.delete(gId);
      }
    }
  };

  const setChannels = (channels: Record<string, Channel>) => {
    console.log('setChannels', channels);
  };

  return {
    configGroup,
    setConfig: loadConfig,
    setChannels,
  };
};
