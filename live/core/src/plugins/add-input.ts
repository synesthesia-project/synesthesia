import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import { Input, InputContext, InputKind, Plugin } from '.';
import AddModule from '@synesthesia-project/compositor/lib/modules/add';
import {
  RGBA_TRANSPARENT,
} from '@synesthesia-project/compositor/lib/color';
import FillModule from '@synesthesia-project/compositor/lib/modules/fill';
import { OPTIONAL_KIND_AND_CONFIG, OptionalKindAndConfig } from '../config';

const ADD_INPUT_CONFIG = t.array(OPTIONAL_KIND_AND_CONFIG);

type Config = t.TypeOf<typeof ADD_INPUT_CONFIG>;

const createAddInput = (context: InputContext<Config>): Input<Config> => {
  const state: {
    config: Config | null;
  } = {
    config: null,
  };

  const group = new ld.Group({ direction: 'vertical' });
  const module = new AddModule([
    new FillModule(RGBA_TRANSPARENT)
  ]);

  const layers: Array<Input<OptionalKindAndConfig>> = [];

  const header = new ld.Group({ noBorder: true });
  group.addChild(header);

  const addLayer = new ld.Button('Add Layer');
  header.addChild(addLayer);
  addLayer.addListener(() => {
    context.saveConfig([
      ...state.config || [],
      null
    ]);
  });

  const removeLayer = new ld.Button('Remove Layer');
  header.addChild(removeLayer);
  removeLayer.addListener(() => {
    context.saveConfig(state.config?.slice(0, state.config.length - 1) || []);
  });

  const layersGroup = new ld.Group({ direction: 'vertical', noBorder: true });
  group.addChild(layersGroup);

  return {
    setConfig: (newConfig) => {
      const prevConfig = state.config ?? [];
      state.config = newConfig;
      // Add any missing layers
      for (let i = prevConfig.length; i < newConfig.length; i++) {
        const input = context.createInputSocket({
          saveConfig: async singleConfig => {
            if (state.config) {
              context.saveConfig([
                ...state.config.slice(0, i),
                singleConfig,
                ...state.config.slice(i + 1)
              ])
            }
          }
        });
        layers[i] = input;
        input.setConfig(newConfig[i]);
        layersGroup.addChild(input.getLightDeskComponent());
      }
      // Remove any extra layers
      layers.splice(newConfig.length).map(layer => {
        layer.destroy();
        layersGroup.removeChild(layer.getLightDeskComponent())
      })
      // Update each layers' config
      for (let i = 0; i < newConfig.length; i++) {
        layers[i].setConfig(newConfig[i]);
      }
      // Update the module
      if (layers.length === 0) {
        module.setLayers([new FillModule(RGBA_TRANSPARENT)]);
      } else {
        module.setLayers(layers.map(l => l.getModlue()));
      }
    },
    getLightDeskComponent: () => group,
    destroy: () => {
      layers.map(layer => layer.destroy());
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
