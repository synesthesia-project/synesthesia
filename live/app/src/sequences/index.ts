import * as ld from '@synesthesia-project/light-desk';
import { v4 as uuidv4 } from 'uuid';

import {
  SequencesConfig,
  SequencesGroupConfig,
  SequencesSequenceConfig,
} from '../config';
import { Channel } from '@synesthesia-project/live-core/lib/plugins';
import { Option, createTreeSelector } from '../desk/tree-selector';

export const INIT_SEQUENCES_CONFIG: SequencesConfig = {
  groups: {},
};

type Sequence = {
  lastConfig?: SequencesSequenceConfig;
  ldComponent: ld.Group;
};

type Group = {
  lastConfig?: SequencesGroupConfig;
  ldComponent: ld.Group;
  channelsList: ld.Group;
  sequences: Map<string, Sequence>;
  /**
   * Reset channel adder to initial state
   */
  closeAdder: () => void;
};

export const Sequences = (options: {
  updateConfig: (
    update: (config: SequencesConfig) => SequencesConfig
  ) => Promise<void>;
}) => {
  const { updateConfig } = options;

  const updateGroupConfig = (
    gId: string,
    update: (current: SequencesGroupConfig) => SequencesGroupConfig | undefined
  ) =>
    updateConfig((c) => {
      const existing = c.groups[gId];
      return existing
        ? {
            ...c,
            groups: {
              ...c.groups,
              [gId]: update(existing),
            },
          }
        : c;
    });

  const updateSequenceConfig = (
    gId: string,
    sqId: string,
    update: (
      current: SequencesSequenceConfig
    ) => SequencesSequenceConfig | undefined
  ) =>
    updateGroupConfig(gId, (c) => {
      const existing = c.sequences[sqId];
      return existing
        ? {
            ...c,
            sequences: {
              ...c.sequences,
              [sqId]: update(existing),
            },
          }
        : c;
    });

  let config: SequencesConfig = INIT_SEQUENCES_CONFIG;

  let channels: Record<string, Channel | undefined> = {};

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
          channels: [],
          sequences: {},
        },
      },
    }))
  );

  const closeAllAdders = () => {
    for (const group of groups.values()) {
      group.closeAdder();
    }
  };

  const updateChannelsDisplay = (gId: string) => {
    const group = groups.get(gId);
    if (group) {
      group.channelsList.removeAllChildren();
      const groupChannels = (config.groups[gId]?.channels || [])
        .map((cId) => ({
          cId,
          channel: channels[cId],
        }))
        .sort((a, b) =>
          `${a.channel?.name}`.localeCompare(`${b.channel?.name}`)
        );
      for (const { cId, channel } of groupChannels) {
        const cGroup = group.channelsList.addChild(
          new ld.Group({ noBorder: true })
        );

        cGroup.addChild(new ld.Button(null, 'delete')).addListener(() =>
          updateGroupConfig(gId, (c) => ({
            ...c,
            channels: c.channels.filter((chId) => chId != cId),
          }))
        );

        cGroup.addChild(
          new ld.Label(channel ? channel.name.join(' > ') : 'Unknown Channel')
        );
      }
    }
  };

  const getUnassignedChannels = (): Option[] => {
    const usedChannels = new Set<string>();
    for (const group of Object.values(config.groups)) {
      group?.channels.forEach((chId) => usedChannels.add(chId));
    }
    return Object.entries(channels)
      .filter(([chId]) => !usedChannels.has(chId))
      .map(([chId, ch]) => ({
        id: chId,
        name: ch?.name ?? [],
      }));
  };

  const createGroup = (gId: string): Group => {
    const ldComponent = configGroup.addChild(
      new ld.Group(
        { direction: 'vertical' },
        {
          editableTitle: true,
        }
      )
    );

    ldComponent.addListener('title-changed', (title) =>
      updateGroupConfig(gId, (c) => ({ ...c, name: title }))
    );

    const adderContainer = ldComponent.addChild(
      new ld.Group({ noBorder: true })
    );

    const channelsList = ldComponent.addChild(
      new ld.Group({ direction: 'vertical' })
    );
    channelsList.setTitle('Channels');

    const addChannel = ldComponent.addHeaderButton(
      new ld.Button('Add Channel', 'add')
    );

    const channelAdder = new ld.Group({ noBorder: true });

    const cancel = new ld.Button('Cancel', 'cancel');
    const label = new ld.Label('Add Channel:');
    const selector = createTreeSelector();

    channelAdder.addChildren(cancel, label, selector.ldComponent);

    const closeAdder = () => {
      adderContainer.removeChild(channelAdder);
    };

    const openAdder = () => {
      adderContainer.addChildren(channelAdder);
    };

    addChannel.addListener(() => {
      closeAllAdders();
      selector.selectFrom(getUnassignedChannels(), (id) => {
        updateGroupConfig(gId, (c) => ({
          ...c,
          channels: [...c.channels, id],
        }));
        closeAllAdders();
        updateChannelsDisplay(gId);
      });
      openAdder();
    });

    cancel.addListener(closeAllAdders);

    ldComponent
      .addHeaderButton(new ld.Button('Add Sequence', 'animation'))
      .addListener(() =>
        updateGroupConfig(gId, (c) => ({
          ...c,
          sequences: {
            ...c.sequences,
            [uuidv4()]: {
              name: '',
              channels: {},
            },
          },
        }))
      );

    ldComponent
      .addHeaderButton(new ld.Button(null, 'delete'))
      .addListener(() => updateGroupConfig(gId, () => undefined));

    return {
      lastConfig: undefined,
      ldComponent,
      channelsList,
      sequences: new Map(),
      closeAdder,
    };
  };

  const createSequence = (gId: string, sqId: string): Sequence => {
    const ldComponent = new ld.Group(
      { direction: 'vertical' },
      {
        editableTitle: true,
      }
    );

    ldComponent.addListener('title-changed', (title) =>
      updateSequenceConfig(gId, sqId, (c) => ({ ...c, name: title }))
    );

    return {
      ldComponent,
    };
  };

  const updateGroupSequences = (gId: string) => {
    const group = groups.get(gId);
    const groupConfig = config.groups[gId];
    if (!group || !groupConfig) return;

    for (const [sqId, sq] of Object.entries(groupConfig.sequences)) {
      let sequence = group.sequences.get(sqId);
      if (!sequence) {
        group.sequences.set(sqId, (sequence = createSequence(gId, sqId)));
        group.ldComponent.addChild(sequence.ldComponent);
      }
      if (sq !== sequence.lastConfig) {
        // If sequence config has changed, update it
        sequence.ldComponent.setTitle(sq?.name || '');
      }
    }
  };

  const loadConfig = (newConfig: SequencesConfig) => {
    config = newConfig;
    for (const [gId, g] of Object.entries(config.groups)) {
      let group = groups.get(gId);
      if (!group) {
        groups.set(gId, (group = createGroup(gId)));
      }
      if (g !== group.lastConfig) {
        // If the group config has changed, update it
        group.ldComponent.setTitle(g?.name || '');
        updateGroupSequences(gId);
        updateChannelsDisplay(gId);
        group.lastConfig = g;
      }
    }
    // Remove deleted groups
    for (const [gId, group] of groups.entries()) {
      if (!config.groups[gId]) {
        configGroup.removeChild(group.ldComponent);
        groups.delete(gId);
      }
    }
  };

  const setChannels = (newChannels: Record<string, Channel>) => {
    channels = newChannels;
    closeAllAdders();
    [...groups.keys()].map(updateChannelsDisplay);
  };

  return {
    configGroup,
    setConfig: loadConfig,
    setChannels,
  };
};
