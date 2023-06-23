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
  configComponent: ld.Group;
  deskButton: ld.Button;
};

type Group = {
  lastConfig?: SequencesGroupConfig;
  configComponent: ld.Group;
  deskComponent: ld.Group;
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

  const deskGroup = new ld.Group({ direction: 'vertical', noBorder: true });

  const header = configGroup.addChild(new ld.Group({ noBorder: true }));

  header.addChild(new ld.Button('Add Group', 'add')).addListener(() =>
    updateConfig((c) => ({
      ...c,
      groups: {
        ...c.groups,
        [uuidv4()]: {
          name: '',
          selectedSequence: undefined,
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
    const configComponent = configGroup.addChild(
      new ld.Group(
        { direction: 'vertical' },
        {
          editableTitle: true,
        }
      )
    );

    const deskComponent = deskGroup.addChild(new ld.Group({ direction: 'vertical' }));

    configComponent.addListener('title-changed', (title) =>
      updateGroupConfig(gId, (c) => ({ ...c, name: title }))
    );

    const adderContainer = configComponent.addChild(
      new ld.Group({ noBorder: true })
    );

    const channelsList = configComponent.addChild(
      new ld.Group({ direction: 'vertical' })
    );
    channelsList.setTitle('Channels');

    const addChannel = configComponent.addHeaderButton(
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

    configComponent
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

    configComponent
      .addHeaderButton(new ld.Button(null, 'delete'))
      .addListener(() => updateGroupConfig(gId, () => undefined));

    return {
      lastConfig: undefined,
      configComponent: configComponent,
      deskComponent,
      channelsList,
      sequences: new Map(),
      closeAdder,
    };
  };

  const createSequence = (gId: string, sqId: string): Sequence => {
    const configComponent = new ld.Group(
      { direction: 'vertical' },
      {
        editableTitle: true,
      }
    );

    configComponent.addListener('title-changed', (title) =>
      updateSequenceConfig(gId, sqId, (c) => ({ ...c, name: title }))
    );

    const deskButton = new ld.Button(null);

    deskButton.addListener(() => {
      updateGroupConfig(gId, c => ({
      ...c,
      selectedSequence: sqId,
    }))});

    configComponent
      .addHeaderButton(new ld.Button(null, 'delete'))
      .addListener(() => updateSequenceConfig(gId, sqId, () => undefined));

    return {
      configComponent,
      deskButton,
    };
  };

  const updateGroupSequences = (gId: string) => {
    const group = groups.get(gId);
    const groupConfig = config.groups[gId];
    if (!group || !groupConfig) return;

    Object.entries(groupConfig.sequences).map(([sqId, sq], i) => {
      let sequence = group.sequences.get(sqId);
      if (!sequence) {
        group.sequences.set(sqId, (sequence = createSequence(gId, sqId)));
        group.configComponent.addChild(sequence.configComponent);
        group.deskComponent.addChild(sequence.deskButton);
      }
      if (sq !== sequence.lastConfig) {
        // If sequence config has changed, update it
        sequence.configComponent.setTitle(sq?.name || '');
        sequence.deskButton.setText(sq?.name || `Sequence ${i}`);
      }
      sequence.deskButton.setMode(groupConfig.selectedSequence === sqId ? 'pressed' : 'normal' );
    });
    // Remove deleted sequences
    for (const [sqId, sq] of group.sequences.entries()) {
      if (!groupConfig.sequences[sqId]) {
        group.configComponent.removeChild(sq.configComponent);
        group.deskComponent.removeChild(sq.deskButton);
        group.sequences.delete(sqId);
      }
    }
  };

  const loadConfig = (newConfig: SequencesConfig) => {
    config = newConfig;
    Object.entries(config.groups).map(([gId, g], i) => {
      let group = groups.get(gId);
      if (!group) {
        groups.set(gId, (group = createGroup(gId)));
      }
      if (g !== group.lastConfig) {
        // If the group config has changed, update it
        group.configComponent.setTitle(g?.name || '');
        group.deskComponent.setTitle(g?.name || `Group ${i}`);
        updateGroupSequences(gId);
        updateChannelsDisplay(gId);
        group.lastConfig = g;
      }
    });
    // Remove deleted groups
    for (const [gId, group] of groups.entries()) {
      if (!config.groups[gId]) {
        configGroup.removeChild(group.configComponent);
        deskGroup.removeChild(group.deskComponent);
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
    deskGroup,
    setConfig: loadConfig,
    setChannels,
  };
};
