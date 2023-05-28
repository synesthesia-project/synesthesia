import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import type {
  Input,
  InputContext,
  InputKind,
  Plugin,
} from '@synesthesia-project/live-core/lib/plugins';
import AddModule from '@synesthesia-project/compositor/lib/modules/add';
import { RGBA_TRANSPARENT } from '@synesthesia-project/compositor/lib/color';
import FillModule from '@synesthesia-project/compositor/lib/modules/fill';
import {
  OPTIONAL_KIND_AND_CONFIG,
  OptionalKindAndConfig,
} from '@synesthesia-project/live-core/lib/config';

const ADD_INPUT_CONFIG = t.array(OPTIONAL_KIND_AND_CONFIG);

type Config = t.TypeOf<typeof ADD_INPUT_CONFIG>;

const createAddInput = (context: InputContext<Config>): Input<Config> => {
  const state: {
    config: Config | null;
  } = {
    config: null,
  };

  const group = new ld.Group({ direction: 'vertical', noBorder: true });
  const module = new AddModule([new FillModule(RGBA_TRANSPARENT)]);

  const layers: Array<Input<OptionalKindAndConfig>> = [];

  const header = group.addChild(new ld.Group({ noBorder: true }));

  const addLayer = header.addChild(new ld.Button('Add Layer', 'add'));
  addLayer.addListener(() => {
    context.saveConfig([...(state.config || []), null]);
  });

  const layersGroup = group.addChild(
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  return {
    setConfig: (newConfig) => {
      const prevConfig = state.config ?? [];
      state.config = newConfig;
      // Add any missing layers
      for (let i = prevConfig.length; i < newConfig.length; i++) {
        const input = context.createInputSocket({
          saveConfig: async (singleConfig) => {
            if (state.config) {
              context.saveConfig([
                ...state.config.slice(0, i),
                singleConfig,
                ...state.config.slice(i + 1),
              ]);
            }
          },
          groupConfig: {
            additionalButtons: [
              new ld.Button(null, 'delete').addListener(() => {
                const newConfig = [...(state.config || [])];
                newConfig.splice(i, 1);
                context.saveConfig(newConfig);
              }),
            ],
          },
        });
        layers[i] = input;
        input.setConfig(newConfig[i]);
        layersGroup.addChild(input.getLightDeskComponent());
      }
      // Remove any extra layers
      layers.splice(newConfig.length).map((layer) => {
        layer.destroy();
        layersGroup.removeChild(layer.getLightDeskComponent());
      });
      // Update each layers' config
      for (let i = 0; i < newConfig.length; i++) {
        layers[i].setConfig(newConfig[i]);
      }
      // Update the module
      if (layers.length === 0) {
        module.setLayers([new FillModule(RGBA_TRANSPARENT)]);
      } else {
        module.setLayers(layers.map((l) => l.getModlue()));
      }
    },
    getLightDeskComponent: () => group,
    destroy: () => {
      layers.map((layer) => layer.destroy());
    },
    getModlue: () => module,
  };
};

export const ADD_INPUT_KIND: InputKind<Config> = {
  kind: 'add',
  config: ADD_INPUT_CONFIG,
  initialConfig: [],
  create: createAddInput,
};

export const ADD_INPUT_PLUGIN: Plugin = {
  init: (context) => {
    context.registerInputKind(ADD_INPUT_KIND);
  },
};
