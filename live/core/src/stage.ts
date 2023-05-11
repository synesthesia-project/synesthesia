import * as ld from '@synesthesia-project/light-desk';
import { throttle } from 'lodash';

import { Config, loadConfig, saveConfig } from './config';
import { InputKind, Output, OutputContext, Plugin } from './plugins';
import { OutputKind } from './plugins';
import { createDesk } from './desk/desk';
import { TransitionModule } from '@synesthesia-project/compositor/lib/modules/transition';
import FillModule from '@synesthesia-project/compositor/lib/modules/fill';
import { RGBA_BLACK } from '@synesthesia-project/compositor/lib/color';
import { createInputManager } from './inputs';

type ActiveOutput<ConfigT> = {
  kind: string;
  output: Output<ConfigT>;
  ldComponent: ld.Component;
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

  const outputKinds = new Map<string, OutputKind<unknown>>();

  const inputManager = createInputManager();

  const rootModule = new TransitionModule(new FillModule(RGBA_BLACK));

  /**
   * Map from output key to active instance of the output
   */
  const outputs = new Map<string, ActiveOutput<unknown>>();

  const inputs = {
    current: inputManager.createSocket({
      saveConfig: (config) =>
        updateConfig((original) => ({
          ...original,
          inputs: {
            current: config,
          },
        })),
    }),
  };

  rootModule.transition(inputs.current.getModlue(), 0);

  desk.setInput(inputs.current.getLightDeskComponent());

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
    updateInputsFromConfig(prevConfig);
    if (save) {
      saveCurrentConfig();
    }
  };

  const createOutput = <ConfigT>(
    key: string,
    kind: OutputKind<ConfigT>,
    initialConfig: unknown
  ): ActiveOutput<ConfigT> => {
    console.log('createOutput', key);
    const saveConfig: OutputContext<ConfigT>['saveConfig'] = (newConfig) =>
      updateConfig((current) => ({
        ...current,
        outputs: {
          ...current.outputs,
          [key]: {
            kind: kind.kind,
            config: newConfig,
          },
        },
      }));
    const render: OutputContext<ConfigT>['render'] = (map, pixels) =>
      rootModule.render(map, pixels, null);
    const output = kind.create({
      saveConfig,
      render,
    });
    if (kind.config.is(initialConfig)) {
      output.setConfig(initialConfig);
    } else {
      console.error(
        `output ${key} given invalid config: ${JSON.stringify(
          initialConfig,
          null,
          '  '
        )}`
      );
      output.setConfig(kind.initialConfig);
    }
    const ldComponent = new ld.Group({
      direction: 'vertical',
    });

    // Output Header
    const header = new ld.Group({ noBorder: true });
    ldComponent.addChild(header);

    header.addChild(new ld.Label(`${kind.kind}: ${key}`));

    const deleteButton = new ld.Button(`Delete`);
    header.addChild(deleteButton);

    deleteButton.addListener(() =>
      updateConfig((current) => ({
        ...current,
        outputs: Object.fromEntries(
          Object.entries(current.outputs ?? []).filter(([k]) => k !== key)
        ),
      }))
    );

    ldComponent.addChild(output.getLightDeskComponent());
    return {
      kind: kind.kind,
      output,
      ldComponent,
    };
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
    for (const key of allOutputKeys) {
      let output = outputs.get(key);
      const oldOutputConfig = prev.outputs?.[key];
      const newOutputConfig = config.outputs?.[key];
      // Check if output already exists, and needs to be deleted of change kind
      if (output && output.kind !== newOutputConfig?.kind) {
        output.output.destroy();
        outputs.delete(key);
        desk.outputsGroup.removeChild(output.ldComponent);
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
          outputs.set(key, output);
          desk.outputsGroup.addChild(output.ldComponent);
        } else if (oldOutputConfig?.config !== newOutputConfig?.config) {
          if (kind.config.is(newOutputConfig.config)) {
            output.output.setConfig(newOutputConfig.config);
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
  };

  const updateInputsFromConfig = (prev: Config) => {
    if (prev.inputs?.current !== config.inputs?.current) {
      inputs.current.setConfig(config.inputs?.current);
    }
  };

  plugins.map(initializePlugin);

  // Initialize with config
  await loadConfig(configPath).then((c) => updateConfig(() => c, false));

  // Initialize Desk
  desk.init({
    addOutput: (key) =>
      updateConfig((current) => {
        if (!key) {
          throw new Error(`You must specify an output name`);
        }
        if (current.outputs?.[key]) {
          throw new Error(`The output ${key} already exists`);
        }
        return {
          ...current,
          outputs: {
            ...current.outputs,
            [key]: {
              kind: 'virtual',
              config: {
                pixels: 2,
              },
            },
          },
        };
      }),
  });
  desk.desk.start({
    mode: 'automatic',
    port: 1338,
  });
};
