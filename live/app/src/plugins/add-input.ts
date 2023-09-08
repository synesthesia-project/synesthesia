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
  const group = new ld.Group({ direction: 'vertical', noBorder: true });
  const module = new AddModule([new FillModule(RGBA_TRANSPARENT)]);

  const layers: Array<Input<OptionalKindAndConfig>> = [];

  const header = group.addChild(new ld.Group({ noBorder: true, wrap: true }));

  const addLayer = header.addChild(
    new ld.Button({ text: 'Add Layer', icon: 'add' })
  );
  addLayer.addListener(() => {
    context.updateConfig((current) => [...(current || []), null]);
  });

  const layersGroup = group.addChild(
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  return {
    applyConfig: (config, lastConfig) => {
      // Add any missing layers
      for (let i = lastConfig?.length ?? 0; i < config.length; i++) {
        const input = context.createInputSocket({
          updateConfig: async (update) =>
            context.updateConfig((current) => [
              ...current.slice(0, i),
              update(current[i]),
              ...current.slice(i + 1),
            ]),
          groupConfig: {
            additionalButtons: [
              new ld.Button({ icon: 'delete' }).addListener(() =>
                context.updateConfig((current) => [
                  ...current.slice(0, i),
                  ...current.slice(i + 1),
                ])
              ),
            ],
          },
        });
        layers[i] = input;
        input.applyConfig(config[i], null);
        layersGroup.addChild(input.getLightDeskComponent());
      }
      // Remove any extra layers
      layers.splice(config.length).map((layer) => {
        layer.destroy();
        layersGroup.removeChild(layer.getLightDeskComponent());
      });
      // Update each layers' config
      for (let i = 0; i < config.length; i++) {
        layers[i].applyConfig(config[i], lastConfig?.[i]);
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
