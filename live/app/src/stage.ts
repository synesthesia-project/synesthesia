import * as ld from '@synesthesia-project/light-desk';
import { throttle } from 'lodash';
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
} from '@synesthesia-project/live-core/lib/plugins';
import { isDefined } from '@synesthesia-project/live-core/lib/util';
import { v4 as uuidv4 } from 'uuid';

import { Config, loadConfig, saveConfig } from './config';
import { createDesk } from './desk/desk';
import { InputSocket, createInputManager } from './inputs';
import { INIT_SEQUENCES_CONFIG, Sequences } from './sequences';

type ActiveOutput<ConfigT> = {
  kind: string;
  output?: Output<ConfigT>;
  ldComponent?: ld.Component;
  channels: Record<string, Channel>;
};

export const Stage = async (plugins: Plugin[], configPath: string) => {
  const desk = createDesk();

  const sequences = Sequences();
  desk.sequencesGroup.addChild(sequences.configGroup);

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

  const outputKinds = new Map<string, OutputKind<unknown>>();

  const inputManager = createInputManager();

  const compositor: {
    root: TransitionModule<unknown>;
    current: null | number;
    inputs: InputSocket[];
  } = {
    root: new TransitionModule(new FillModule(RGBA_TRANSPARENT)),
    current: null,
    inputs: [],
  };

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
    updateInputsFromConfig();
    if (newConfig.sequences !== prevConfig.sequences) {
      sequences.setConfig(newConfig.sequences || INIT_SEQUENCES_CONFIG);
    }
    if (save) {
      saveCurrentConfig();
    }
  };

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
    outputs.set(key, activeOutput);
    const saveConfig: OutputContext<ConfigT>['saveConfig'] = async (
      newConfig
    ) => {
      const currentOutputConfig = config.outputs?.[key];
      if (currentOutputConfig) {
        await updateConfig((current) => ({
          ...current,
          outputs: {
            ...current.outputs,
            [key]: {
              ...currentOutputConfig,
              config: newConfig,
            },
          },
        }));
      }
    };
    const render: OutputContext<ConfigT>['render'] = (map, pixels) =>
      compositor.root.render(map, pixels, null);
    const setChannels: OutputContext<ConfigT>['setChannels'] = (channels) => {
      activeOutput.channels = channels;
      sendChannelsToSequences();
    };
    activeOutput.output = kind.create({
      saveConfig,
      render,
      setChannels,
    });
    if (kind.config.is(initialConfig)) {
      activeOutput.output.setConfig(initialConfig);
    } else {
      console.error(
        `output ${key} given invalid config: ${JSON.stringify(
          initialConfig,
          null,
          '  '
        )}`
      );
      activeOutput.output.setConfig(kind.initialConfig);
    }
    const ldComponent = new ld.Group(
      {
        direction: 'vertical',
      },
      {
        editableTitle: true,
      }
    );
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

    const deleteButton = ldComponent.addHeaderButton(
      new ld.Button('Delete', 'delete')
    );

    deleteButton.addListener(() =>
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
        if (Object.entries(output.channels).length > 0) {
          // Channels must be unregistered in sequences
          channelsNeedUpdating = true;
        }
        output = undefined;
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
            output.output?.setConfig(newOutputConfig.config);
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

  const updateInputsFromConfig = () => {
    const cues = config.compositor?.cues || [];
    for (let i = 0; i < cues.length; i++) {
      let existing = compositor.inputs[i];
      if (!existing) {
        existing = compositor.inputs[i] = inputManager.createSocket({
          saveConfig: (inputConfig) =>
            updateConfig((current) => {
              const newCues = [...(current.compositor?.cues || [])];
              newCues[i] = inputConfig;
              return {
                ...current,
                compositor: {
                  current: current.compositor?.current ?? null,
                  cues: newCues,
                },
              };
            }),
        });
        desk.compositorCuesGroup.addChild(existing.getLightDeskComponent());
      }
      existing.setConfig(cues[i]);
    }
    // Remove any deleted inputs
    compositor.inputs.splice(cues.length).map((i) => i.destroy());
    // Update cue triggers
    desk.compositorCueTriggers.removeAllChildren();
    for (let i = 0; i < cues.length; i++) {
      desk.compositorCueTriggers
        .addChild(new ld.Button(`Cue ${i}`, 'play_arrow'))
        .addListener(() =>
          updateConfig((config) => ({
            ...config,
            compositor: {
              current: i,
              cues: config.compositor?.cues || [],
            },
          }))
        );
    }
    // Transition to new cue if changed
    if (config.compositor?.current !== compositor.current) {
      compositor.current = config.compositor?.current ?? null;
      const module =
        compositor.current !== null
          ? compositor.inputs[compositor.current]?.getModlue()
          : null;
      if (module) {
        compositor.root.transition(module, 1);
      } else {
        compositor.root.transition(new FillModule(RGBA_TRANSPARENT), 1);
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
          current: config.compositor?.current ?? 0,
          cues: [...(config.compositor?.cues || []), null],
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

  sequences.init({
    updateConfig: (update) =>
      updateConfig((config) => ({
        ...config,
        sequences: update(config.sequences || INIT_SEQUENCES_CONFIG),
      })),
  });

  desk.desk.start({
    mode: 'automatic',
    port: 1338,
  });
};
