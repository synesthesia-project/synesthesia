import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import type {
  Input,
  InputContext,
  InputKind,
  Plugin,
} from '@synesthesia-project/live-core/lib/plugins';
import { ChaseModule } from '@synesthesia-project/compositor/lib/modules/chase';
import { RGBA_TRANSPARENT } from '@synesthesia-project/compositor/lib/color';
import FillModule from '@synesthesia-project/compositor/lib/modules/fill';
import {
  OPTIONAL_KIND_AND_CONFIG,
  OptionalKindAndConfig,
} from '@synesthesia-project/live-core/lib/config';
import { TransitionModule } from '@synesthesia-project/compositor/lib/modules/transition';

const CHASE_INPUT_CONFIG = t.type({
  advanceAmountPerSecond: t.number,
  sequence: t.array(OPTIONAL_KIND_AND_CONFIG),
});

type Config = t.TypeOf<typeof CHASE_INPUT_CONFIG>;

const createAddInput = (context: InputContext<Config>): Input<Config> => {
  const state: {
    config: Config;
  } = {
    config: {
      advanceAmountPerSecond: 0.3,
      sequence: [],
    },
  };

  const group = new ld.Group({ direction: 'vertical', noBorder: true });
  const module = new TransitionModule(new FillModule(RGBA_TRANSPARENT));
  let chaseModule: ChaseModule<unknown> | null = null;

  const layers: Array<Input<OptionalKindAndConfig>> = [];

  const header = group.addChild(new ld.Group({ noBorder: true }));

  const addLayer = header.addChild(new ld.Button('Add Stop', 'add'));
  addLayer.addListener(() => {
    context.saveConfig({
      ...state.config,
      sequence: [...state.config.sequence, null],
    });
  });

  header.addChild(new ld.Label('Speed:'));

  const speedSlider = header.addChild(
    new ld.SliderButton(state.config.advanceAmountPerSecond, 0, 10, 0.01)
  );
  speedSlider.addListener((advanceAmountPerSecond) => {
    context.saveConfig({ ...state.config, advanceAmountPerSecond });
  });

  const layersGroup = group.addChild(
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  return {
    setConfig: (newConfig) => {
      const prevConfig = state.config ?? [];
      state.config = newConfig;
      // Update settings
      speedSlider.setValue(state.config.advanceAmountPerSecond);
      chaseModule?.setAdvanceAmountPerSecond(
        state.config.advanceAmountPerSecond
      );
      // Add any missing layers
      for (
        let i = prevConfig.sequence.length;
        i < newConfig.sequence.length;
        i++
      ) {
        const input = context.createInputSocket({
          saveConfig: async (singleConfig) => {
            if (state.config) {
              context.saveConfig({
                ...state.config,
                sequence: [
                  ...state.config.sequence.slice(0, i),
                  singleConfig,
                  ...state.config.sequence.slice(i + 1),
                ],
              });
            }
          },
          groupConfig: {
            additionalButtons: [
              new ld.Button(null, 'delete').addListener(() => {
                const newSequence = [...state.config.sequence];
                newSequence.splice(i, 1);
                context.saveConfig({ ...state.config, sequence: newSequence });
              }),
            ],
          },
        });
        layers[i] = input;
        input.setConfig(newConfig.sequence[i]);
        layersGroup.addChild(input.getLightDeskComponent());
      }
      // Remove any extra layers
      layers.splice(newConfig.sequence.length).map((layer) => {
        layer.destroy();
        layersGroup.removeChild(layer.getLightDeskComponent());
      });
      // Update each layers' config
      for (let i = 0; i < newConfig.sequence.length; i++) {
        layers[i].setConfig(newConfig.sequence[i]);
      }
      // If the number of layers has changed, transition to new module
      if (prevConfig.sequence.length !== layers.length) {
        chaseModule =
          layers.length === 0
            ? null
            : new ChaseModule(
                layers.map((l) => l.getModlue()),
                {
                  advanceAmountPerSecond: state.config.advanceAmountPerSecond,
                }
              );
        module.transition(chaseModule || new FillModule(RGBA_TRANSPARENT), 1);
      }
    },
    getLightDeskComponent: () => group,
    destroy: () => {
      layers.map((layer) => layer.destroy());
    },
    getModlue: () => module,
  };
};

export const CHASE_INPUT_KIND: InputKind<Config> = {
  kind: 'chase',
  config: CHASE_INPUT_CONFIG,
  initialConfig: {
    advanceAmountPerSecond: 0.3,
    sequence: [],
  },
  create: createAddInput,
};

export const CHASE_INPUT_PLUGIN: Plugin = {
  init: (context) => {
    context.registerInputKind(CHASE_INPUT_KIND);
  },
};
