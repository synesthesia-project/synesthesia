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

const DEFAULT_CONFIG: Config = {
  advanceAmountPerSecond: 0.3,
  sequence: [],
};

const createAddInput = (context: InputContext<Config>): Input<Config> => {
  const group = new ld.Group({ direction: 'vertical', noBorder: true });
  const module = new TransitionModule(new FillModule(RGBA_TRANSPARENT));
  let chaseModule: ChaseModule | null = null;

  const layers: Array<Input<OptionalKindAndConfig>> = [];

  const header = group.addChild(new ld.Group({ noBorder: true, wrap: true }));

  const addLayer = header.addChild(
    new ld.Button({ text: 'Add Stop', icon: 'add' })
  );
  addLayer.addListener(() =>
    context.updateConfig((current) => ({
      ...current,
      sequence: [...current.sequence, null],
    }))
  );

  header.addChild(new ld.Label({ text: 'Speed:' }));

  const speedSlider = header.addChild(
    new ld.SliderButton({
      value: DEFAULT_CONFIG.advanceAmountPerSecond,
      min: 0,
      max: 10,
      step: 0.01,
    })
  );
  speedSlider.addListener((advanceAmountPerSecond) => {
    context.updateConfig((c) => ({ ...c, advanceAmountPerSecond }));
  });

  const layersGroup = group.addChild(
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  return {
    applyConfig: (config, prevConfig) => {
      // Update settings
      speedSlider.setValue(config.advanceAmountPerSecond);
      chaseModule?.setAdvanceAmountPerSecond(config.advanceAmountPerSecond);
      // Add any missing layers
      for (
        let i = prevConfig?.sequence.length ?? 0;
        i < config.sequence.length;
        i++
      ) {
        const input = context.createInputSocket({
          updateConfig: async (update) =>
            context.updateConfig((current) => ({
              ...current,
              sequence: [
                ...current.sequence.slice(0, i),
                update(current.sequence[i]),
                ...current.sequence.slice(i + 1),
              ],
            })),
          groupConfig: {
            additionalButtons: [
              new ld.Button({ icon: 'delete' }).addListener(() =>
                context.updateConfig((current) => ({
                  ...current,
                  sequence: [
                    ...current.sequence.slice(0, i),
                    ...current.sequence.slice(i + 1),
                  ],
                }))
              ),
            ],
          },
        });
        layers[i] = input;
        input.applyConfig(config.sequence[i], prevConfig?.sequence[i]);
        layersGroup.addChild(input.getLightDeskComponent());
      }
      // Remove any extra layers
      layers.splice(config.sequence.length).map((layer) => {
        layer.destroy();
        layersGroup.removeChild(layer.getLightDeskComponent());
      });
      // Update each layers' config
      for (let i = 0; i < config.sequence.length; i++) {
        layers[i].applyConfig(config.sequence[i], prevConfig?.sequence[i]);
      }
      // If the number of layers has changed, transition to new module
      if (prevConfig?.sequence.length !== layers.length) {
        chaseModule =
          layers.length === 0
            ? null
            : new ChaseModule(
                layers.map((l) => l.getModlue()),
                {
                  advanceAmountPerSecond: config.advanceAmountPerSecond,
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
  initialConfig: DEFAULT_CONFIG,
  create: createAddInput,
};

export const CHASE_INPUT_PLUGIN: Plugin = {
  init: (context) => {
    context.registerInputKind(CHASE_INPUT_KIND);
  },
};
