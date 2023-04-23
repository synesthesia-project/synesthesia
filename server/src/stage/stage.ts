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

  // List of outputs
  const outputsGroup = new ld.Group();
  deskRoot.addChild(outputsGroup);

  let config = CONFIG;

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
  const updateConfig = async (newConfig: Config) => {
    console.log(updateConfig, JSON.stringify(newConfig, null, '  '));
    // const _oldConfig = config;
    config = newConfig;
    // TODO: compare old with new config, for changed configs:
    // - validate config type
    // - deepfreeze values
    // - update outputs
  };

  const createOutput = <ConfigT>(
    key: string,
    kind: OutputKind<ConfigT>
  ): ActiveOutput<ConfigT> => {
    const saveConfig: OutputContext<ConfigT>['saveConfig'] = (newConfig) =>
      updateConfig({
        outputs: {
          ...config.outputs,
          [key]: {
            kind: kind.kind,
            config: newConfig,
          },
        },
      });
    const render: OutputContext<ConfigT>['render'] = () => {
      throw new Error('TODO');
    };
    const output = kind.create({
      saveConfig,
      render,
    });
    output.setConfig(kind.initialConfig);
    return {
      kind: kind.kind,
      output,
      ldComponent: output.getLightDeskComponent(),
    };
  };

  /**
   * Given a change to the config.outputs array,
   * initialize or tear-down each output as neccesary.
   */
  const updateOutputsFromConfig = () => {
    Object.entries(config.outputs).map(([key, c]) => {
      let existing = outputs.get(key);
      if (existing && existing.kind !== c.kind) {
        // TODO: shutdown output
        outputs.delete(key);
        // TODO: remove child from group
        existing = undefined;
      }
      if (!existing) {
        const kind = outputKinds.get(c.kind);
        if (!kind) {
          throw new Error(`Unknown output kind: ${c.kind}`);
        }
        const newOutput = createOutput(key, kind);
        outputs.set(key, newOutput);
        outputsGroup.addChild(newOutput.ldComponent);
      }
    });
  };

  PLUGINS.map(initializePlugin);

  updateOutputsFromConfig();

  desk.start({
    mode: 'automatic',
    port: 1338,
  });
};

Stage();
