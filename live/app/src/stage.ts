import * as ld from '@synesthesia-project/light-desk';
import { throttle } from 'lodash';
import { ModulateModule } from '@synesthesia-project/compositor/lib/modules/modulate';
import { TransitionModule } from '@synesthesia-project/compositor/lib/modules/transition';
import FillModule from '@synesthesia-project/compositor/lib/modules/fill';
import { RGBA_TRANSPARENT } from '@synesthesia-project/compositor/lib/color';
import type {
  InputKind,
  Output,
  OutputContext,
  Plugin,
  OutputKind,
  Channel,
  InputSocket,
} from '@synesthesia-project/live-core/lib/plugins';
import {
  ConfigUpdate,
  ConfigUpdater,
  isDefined,
} from '@synesthesia-project/live-core/lib/util';
import { v4 as uuidv4 } from 'uuid';

import { Config, CueConfig, loadConfig, saveConfig } from './config';
import { createDesk } from './desk/desk';
import { createInputManager } from './inputs';
import { INIT_SEQUENCES_CONFIG, Sequences } from './sequences';
import { createPluginConfigManager } from './config/plugins';

type ActiveOutput<ConfigT> = {
  kind: string;
  output?: Output<ConfigT>;
  ldComponent?: ld.Component;
  channels: Record<string, Channel>;
};

export const Stage = async (plugins: Plugin[], configPath: string) => {
  const desk = createDesk();

  let config: Config = {};

  const saveCurrentConfig = throttle(
    () => {
      saveConfig(configPath, config);
    },
    1000,
    {
      leading: true,
      trailing: true,
    }
  );

  const pluginConfigManager = createPluginConfigManager((update) =>
    updateConfig((current) => ({
      ...current,
      plugins: update(current.plugins),
    }))
  );

  const outputKinds = new Map<string, OutputKind<unknown>>();

  const inputManager = createInputManager();

  const compositor: {
    transition: TransitionModule;
    modulate: ModulateModule;
    current: null | string;
    cues: Map<string, InputSocket>;
  } = (() => {
    const transition = new TransitionModule(new FillModule(RGBA_TRANSPARENT));
    return {
      transition,
      modulate: new ModulateModule(transition),
      current: null,
      cues: new Map(),
    };
  })();

  /**
   * Map from output key to active instance of the output
   */
  const outputs = new Map<string, ActiveOutput<unknown>>();

  const initializePlugin = (plugin: Plugin) => {
    plugin.init({
      registerOutputKind: (kind) =>
        outputKinds.set(kind.kind, kind as OutputKind<unknown>),
      registerInputKind: (kind) =>
        inputManager.addInputKind(kind as InputKind<unknown>),
      registerDeskComponent: (component) =>
        desk.pluginComponentsGroup.addChild(component),
      registerEvent: (event) =>
        console.log(`New event registered: ${event.getName()}`),
      registerAction: (action) =>
        console.log(`New action registered: ${action.getName()}`),
      createConfigSection: pluginConfigManager.createConfigSection,
    });
  };

  /**
   * Save the config with a new value,
   * and update any outputs, inputs, etc... with their changed config
   */
  const updateConfig = async (
    update: (originalConfig: Config) => Config,
    save = true
  ) => {
    const prevConfig = config;
    const newConfig = update(config);
    // const _oldConfig = config;
    config = newConfig;
    // TODO: compare old with new config, for changed configs:
    // - validate config type
    // - deepfreeze values
    // - update outputs
    updateOutputsFromConfig(prevConfig);
    updateInputsFromConfig(prevConfig);
    pluginConfigManager.applyConfig(newConfig.plugins, prevConfig.plugins);
    if (newConfig.sequences !== prevConfig.sequences) {
      sequences.setConfig(newConfig.sequences || INIT_SEQUENCES_CONFIG);
    }
    if (save) {
      saveCurrentConfig();
    }
  };

  // Setup Dimmer
  desk.compositorDimmer.addListener('change', (value) =>
    updateConfig((config) => ({
      ...config,
      compositor: {
        current: config.compositor?.current ?? null,
        dimmer: value,
        cues: config.compositor?.cues || {},
      },
    }))
  );

  // Setup Sequences

  const sequences = Sequences({
    updateConfig: (update) =>
      updateConfig((config) => ({
        ...config,
        sequences: update(config.sequences || INIT_SEQUENCES_CONFIG),
      })),
  });

  desk.sequencesGroup.addChild(sequences.configGroup);
  desk.sequencesDesk.addChild(sequences.deskGroup);

  const sendChannelsToSequences = () => {
    const preparedChannels: Record<string, Channel> = {};
    [...outputs.entries()].map(([outputId, output], outputIndex) => {
      const name = config.outputs?.[outputId]?.name || `Output ${outputIndex}`;
      for (const [chId, ch] of Object.entries(output.channels)) {
        preparedChannels[chId] = {
          ...ch,
          name: [name, ...ch.name],
        };
      }
    });
    sequences.setChannels(preparedChannels);
  };

  const createOutput = <ConfigT>(
    key: string,
    kind: OutputKind<ConfigT>,
    initialConfig: unknown
  ): ActiveOutput<ConfigT> => {
    const activeOutput: ActiveOutput<ConfigT> = {
      kind: kind.kind,
      channels: {},
    };
    outputs.set(key, activeOutput as ActiveOutput<unknown>);
    const updateOutputConfig: ConfigUpdater<ConfigT> = async (update) => {
      const currentOutputConfig = config.outputs?.[key];
      if (currentOutputConfig) {
        await updateConfig((current) => ({
          ...current,
          outputs: {
            ...current.outputs,
            [key]: {
              ...currentOutputConfig,
              // TODO: validate prior to calling update
              config: update(currentOutputConfig.config as ConfigT),
            },
          },
        }));
      }
    };
    const render: OutputContext<ConfigT>['render'] = (map, pixels) =>
      compositor.modulate.render(map, pixels);
    const setChannels: OutputContext<ConfigT>['setChannels'] = (channels) => {
      activeOutput.channels = channels;
      sendChannelsToSequences();
    };
    activeOutput.output = kind.create({
      updateConfig: updateOutputConfig,
      render,
      setChannels,
      getChannelValues: sequences.getSequenceValues,
    });
    if (kind.config.is(initialConfig)) {
      activeOutput.output.applyConfig(initialConfig, null);
    } else {
      console.error(
        `output ${key} given invalid config: ${JSON.stringify(
          initialConfig,
          null,
          '  '
        )}`
      );
      activeOutput.output.applyConfig(kind.initialConfig, null);
    }
    const ldComponent = new ld.Group({
      direction: 'vertical',
      editableTitle: true,
      defaultCollapsibleState: 'auto',
    });
    activeOutput.ldComponent = ldComponent;
    ldComponent.addLabel({ text: kind.kind });
    ldComponent.setTitle(config.outputs?.[key].name ?? '');

    ldComponent.addListener('title-changed', (name) =>
      updateConfig((current) => ({
        ...current,
        outputs: current.outputs?.[key]
          ? {
              ...current.outputs,
              [key]: {
                ...current.outputs[key],
                name,
              },
            }
          : current.outputs,
      }))
    );

    const deleteButton = ldComponent.addHeaderChild(
      new ld.Button({ text: 'Delete', icon: 'delete' })
    );

    deleteButton.addListener('click', () =>
      updateConfig((current) => ({
        ...current,
        outputs: Object.fromEntries(
          Object.entries(current.outputs ?? []).filter(([k]) => k !== key)
        ),
      }))
    );

    ldComponent.addChild(activeOutput.output.getLightDeskComponent());
    return activeOutput;
  };

  /**
   * Given a change to the config.outputs array,
   * initialize or tear-down each output as neccesary.
   */
  const updateOutputsFromConfig = (prev: Config) => {
    const allOutputKeys = new Set([
      ...Object.keys(prev.outputs ?? []),
      ...Object.keys(config.outputs ?? []),
    ]);
    let channelsNeedUpdating = false;
    for (const key of allOutputKeys) {
      let output = outputs.get(key);
      const oldOutputConfig = prev.outputs?.[key];
      const newOutputConfig = config.outputs?.[key];
      // Check if output already exists, and needs to be deleted of change kind
      if (output && output.kind !== newOutputConfig?.kind) {
        output.output?.destroy();
        outputs.delete(key);
        if (output.ldComponent) {
          desk.outputsGroup.removeChild(output.ldComponent);
        }
        output = undefined;
      }
      // If output has channels registered
      if (output && Object.entries(output.channels).length > 0) {
        // Channels must be updated if kind has changed (or output deleted)
        channelsNeedUpdating ||= output.kind !== newOutputConfig?.kind;
        // Channels must be updated if output name has changed
        channelsNeedUpdating ||=
          oldOutputConfig?.name !== newOutputConfig?.name;
      }
      if (newOutputConfig) {
        const kind = outputKinds.get(newOutputConfig.kind);
        if (!kind) {
          throw new Error(`Unknown output kind: ${newOutputConfig.kind}`);
        }
        // Check if output does not exist and needs to
        if (!output) {
          output = createOutput(key, kind, newOutputConfig.config);
          if (output.ldComponent) {
            desk.outputsGroup.addChild(output.ldComponent);
          }
        } else if (oldOutputConfig?.config !== newOutputConfig?.config) {
          if (kind.config.is(newOutputConfig.config)) {
            output.output?.applyConfig(
              newOutputConfig.config,
              oldOutputConfig?.config
            );
          } else {
            console.error(
              `output ${key} given invalid config: ${JSON.stringify(
                newOutputConfig.config,
                null,
                '  '
              )}`
            );
          }
        }
      }
    }
    if (channelsNeedUpdating) {
      sendChannelsToSequences();
    }
    // Remove all outputs and re-add them in name order
    desk.outputsGroup.removeAllChildren();
    desk.outputsGroup.addChildren(
      ...Object.keys(config.outputs ?? [])
        .sort()
        .map((k) => outputs.get(k)?.ldComponent)
        .filter(isDefined)
    );
  };

  const updateInputsFromConfig = (prev: Config) => {
    const cues = config.compositor?.cues || {};
    compositor.modulate.setAlpha(config.compositor?.dimmer ?? 1);
    desk.compositorDimmer.setValue(config.compositor?.dimmer ?? 1);
    desk.compositorCueTriggers.removeAllChildren();
    for (const [cueId, cueConfig] of Object.entries(cues)) {
      if (cueConfig === undefined) continue;
      const prevCueConfig = prev.compositor?.cues?.[cueId];

      const updateCueConfig = (update: ConfigUpdate<CueConfig>) =>
        updateConfig((current) => {
          const existing = current.compositor?.cues[cueId];
          return {
            ...current,
            compositor: {
              current: current.compositor?.current ?? null,
              dimmer: current.compositor?.dimmer ?? 1,
              cues: {
                ...current.compositor?.cues,
                [cueId]: existing && update(existing),
              },
            },
          };
        });

      let existing = compositor.cues.get(cueId);
      if (!existing) {
        const deleteButton = new ld.Button({ icon: 'delete' });
        deleteButton.addListener('click', () =>
          updateConfig((current) => {
            return {
              ...current,
              compositor: {
                current: current.compositor?.current ?? null,
                dimmer: current.compositor?.dimmer ?? 1,
                cues: {
                  ...current.compositor?.cues,
                  [cueId]: undefined,
                },
              },
            };
          })
        );
        existing = inputManager.createSocket({
          updateConfig: (update) =>
            updateCueConfig((current) => ({
              ...current,
              module: update(current.module),
            })),
          groupConfig: {
            additionalButtons: [deleteButton],
            title: {
              text: cueConfig?.name || '',
              update: (name) =>
                updateCueConfig((current) => ({
                  ...current,
                  name,
                })),
            },
          },
        });
        compositor.cues.set(cueId, existing);
        desk.compositorCuesGroup.addChild(existing.getLightDeskComponent());
      }
      existing.applyConfig(cueConfig.module, prevCueConfig?.module);
      // Add button for cue
      desk.compositorCueTriggers
        .addChild(
          new ld.Button({
            text: cueConfig.name || `Cue`,
            icon: 'play_arrow',
            mode: cueId === config.compositor?.current ? 'pressed' : 'normal',
          })
        )
        .addListener('click', () =>
          updateConfig((config) => ({
            ...config,
            compositor: {
              current: cueId,
              dimmer: config.compositor?.dimmer ?? 1,
              cues: config.compositor?.cues || {},
            },
          }))
        );
    }
    // Remove any deleted inputs
    for (const [cueId, cue] of compositor.cues.entries()) {
      if (config.compositor?.cues[cueId] === undefined) {
        cue.destroy();
        desk.compositorCuesGroup.removeChild(cue.getLightDeskComponent());
        compositor.cues.delete(cueId);
      }
    }
    // Transition to new cue if changed
    if (config.compositor?.current !== compositor.current) {
      compositor.current = config.compositor?.current ?? null;
      const module =
        compositor.current !== null
          ? compositor.cues.get(compositor.current)?.getModlue()
          : null;
      if (module) {
        compositor.transition.transition(module, 1);
      } else {
        compositor.transition.transition(new FillModule(RGBA_TRANSPARENT), 1);
      }
    }
  };

  plugins.map(initializePlugin);

  // Initialize with config
  await loadConfig(configPath).then((c) => updateConfig(() => c, false));

  // Initialize Modules

  desk.init({
    addCompositorCue: () =>
      updateConfig((config) => ({
        ...config,
        compositor: {
          current: config.compositor?.current ?? null,
          dimmer: config.compositor?.dimmer ?? 1,
          cues: { ...config.compositor?.cues, [uuidv4()]: {} },
        },
      })),
    addOutput: (kind, name) =>
      updateConfig((current) => {
        if (!name) {
          throw new Error(`You must specify an output name`);
        }
        return {
          ...current,
          outputs: Object.fromEntries(
            Object.entries({
              ...current.outputs,
              [uuidv4()]: {
                name,
                kind: kind.kind,
                config: kind.initialConfig,
              },
            }).sort(([a], [b]) => a.localeCompare(b))
          ),
        };
      }),
    outputKinds: [...outputKinds.values()],
  });

  desk.desk.start({
    mode: 'automatic',
    port: 1338,
  });
};
