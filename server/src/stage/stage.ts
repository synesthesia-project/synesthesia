import * as ld from '@synesthesia-project/light-desk';

import { Config } from './config';
import { Output, OutputContext, Plugin } from './plugins';
import { VIRTUAL_OUTPUT_PLUGIN } from './plugins/virtual-output';
import { OutputKind } from './plugins';

const CONFIG: Config = {
  outputs: {
    test1: {
      kind: 'virtual',
      config: {
        pixels: 2,
      },
    },
  },
};

const PLUGINS: Plugin[] = [VIRTUAL_OUTPUT_PLUGIN];

type ActiveOutput<ConfigT> = {
  kind: string;
  output: Output<ConfigT>;
  ldComponent: ld.Component;
};

const Stage = () => {
  const desk = new ld.LightDesk();
  const deskRoot = new ld.Group();
  desk.setRoot(deskRoot);

  // Output Controls
  const addButton = new ld.Button('Add Output');
  deskRoot.addChild(addButton);

  // List of outputs
  const outputsGroup = new ld.Group();
  deskRoot.addChild(outputsGroup);

  let config: Config = {
    outputs: {},
  };

  const outputKinds = new Map<string, OutputKind<unknown>>();

  /**
   * Map from output key to active instance of the output
   */
  const outputs = new Map<string, ActiveOutput<unknown>>();

  const initializePlugin = (plugin: Plugin) => {
    plugin.init({
      registerOutputKind: (kind) =>
        outputKinds.set(kind.kind, kind as OutputKind<unknown>),
    });
  };

  /**
   * Save the config with a new value,
   * and update any outputs, inputs, etc... with their changed config
   */
  const updateConfig = async (update: (originalConfig: Config) => Config) => {
    const prevConfig = config;
    const newConfig = update(config);
    console.log('updateConfig', JSON.stringify(newConfig, null, '  '));
    // const _oldConfig = config;
    config = newConfig;
    // TODO: compare old with new config, for changed configs:
    // - validate config type
    // - deepfreeze values
    // - update outputs
    updateOutputsFromConfig(prevConfig);
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
    const render: OutputContext<ConfigT>['render'] = () => {
      throw new Error('TODO');
    };
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
          Object.entries(current.outputs).filter(([k]) => k !== key)
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
      ...Object.keys(prev.outputs),
      ...Object.keys(config.outputs),
    ]);
    for (const key of allOutputKeys) {
      let output = outputs.get(key);
      const oldOutputConfig = prev.outputs[key];
      const newOutputConfig = config.outputs[key];
      // Check if output already exists, and needs to be deleted of change kind
      if (output && output.kind !== newOutputConfig?.kind) {
        // TODO: shutdown output
        outputs.delete(key);
        outputsGroup.removeChild(output.ldComponent);
        // TODO: remove child from group
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
          outputsGroup.addChild(output.ldComponent);
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

  PLUGINS.map(initializePlugin);

  // Initialize with config
  updateConfig(() => CONFIG);

  // Add listeners to button
  addButton.addListener(() => {
    updateConfig((current) => ({
      ...current,
      outputs: {
        ...current.outputs,
        [`test${Object.keys(current.outputs).length + 1}`]: {
          kind: 'virtual',
          config: {
            pixels: 2,
          },
        },
      },
    }));
  });

  desk.start({
    mode: 'automatic',
    port: 1338,
  });
};

Stage();
