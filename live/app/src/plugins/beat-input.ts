import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import type {
  Input,
  InputContext,
  InputKind,
  Plugin,
} from '@synesthesia-project/live-core/lib/plugins';
import { OPTIONAL_KIND_AND_CONFIG } from '@synesthesia-project/live-core/lib/config';
import {
  CompositorModule,
  PixelInfo,
  PixelMap,
} from '@synesthesia-project/compositor/lib/modules';
import { RGBAColor } from '@synesthesia-project/compositor/lib/color';
import { BEAT_EVENT, BeatEventData } from './bpm';

const BEAT_FLASH_INPUT_CONFIG = t.type({
  mode: t.keyof({
    flash: null,
    hold: null,
  }),
  /**
   * Which beats of the bar to include
   */
  beats: t.array(t.boolean),
  /**
   * What proportion of the beat period should be used for the flash
   */
  flashLength: t.number,
  module: OPTIONAL_KIND_AND_CONFIG,
});

type Config = t.TypeOf<typeof BEAT_FLASH_INPUT_CONFIG>;

const DEFAULT_CONFIG: Config = {
  beats: [false, false, false, false],
  mode: 'flash',
  module: null,
  flashLength: 0.25,
};

export class AlphaModule implements CompositorModule {
  public constructor(
    private readonly child: CompositorModule,
    private readonly getAlpha: () => number
  ) {
    // Set properties only
  }

  public render(map: PixelMap, pixels: PixelInfo<unknown>[]): RGBAColor[] {
    const result = this.child.render(map, pixels);
    const alpha = this.getAlpha();
    if (alpha === 1) return result;
    return result.map(
      (value) => new RGBAColor(value.r, value.g, value.b, value.alpha * alpha)
    );
  }
}

const createBeatFlashInput = (context: InputContext<Config>): Input<Config> => {
  let config: Config | null = null;

  const beatButtons: ld.Button[] = [];

  let lastBeatInfo: null | {
    beatStartMs: number;
    data: BeatEventData;
  } = null;

  const group = new ld.Group({ direction: 'vertical', noBorder: true });

  const input = context.createInputSocket({
    updateConfig: (update) =>
      context.updateConfig((current) => ({
        ...current,
        module: update(current.module),
      })),
  });

  const modeGroup = group.addChild(new ld.Group({ noBorder: true }));

  modeGroup.addChild(new ld.Label({ text: 'Mode:' }));

  const modeFlash = modeGroup.addChild(
    new ld.Button({
      mode: 'pressed',
      text: 'Flash',
    })
  );
  modeFlash.addListener('click', () =>
    context.updateConfig((current) => ({
      ...current,
      mode: 'flash',
    }))
  );

  const modeHold = modeGroup.addChild(
    new ld.Button({
      text: 'Hold',
    })
  );
  modeHold.addListener('click', () =>
    context.updateConfig((current) => ({
      ...current,
      mode: 'hold',
    }))
  );

  modeGroup.addChild(new ld.Label({ text: 'Flash Length:' }));

  const flashLength = modeGroup.addChild(
    new ld.SliderButton({
      value: DEFAULT_CONFIG.flashLength,
      min: 0,
      max: 1,
      mode: 'writeThrough',
      step: 0.05,
    })
  );

  flashLength.addListener('change', (flashLength) =>
    context.updateConfig((current) => ({
      ...current,
      flashLength,
    }))
  );

  const beatsGroup = new ld.Group({ noBorder: true });

  group
    .addChild(new ld.Group({ noBorder: true }))
    .addChildren(new ld.Label({ text: 'Active Beats' }), beatsGroup);

  group.addChild(input.getLightDeskComponent());

  const updateBeatButtons = () => {
    const barSize = config?.beats.length || 0;
    // Update number of buttons
    if (barSize !== beatButtons.length) {
      beatsGroup.removeAllChildren();
      // Add missing children
      for (let i = beatButtons.length; i < barSize; i++) {
        const button = new ld.Button({ text: `${i + 1}` });
        button.addListener('click', () =>
          context.updateConfig((current) => ({
            ...current,
            beats: current.beats.map((c, j) => (i === j ? !c : c)),
          }))
        );
        beatButtons.push(button);
      }
      // Remove extra children
      beatButtons.splice(barSize, beatButtons.length - barSize);
      // Add to light-desk
      beatsGroup.addChildren(...beatButtons);
    }
    // Update buttons selectedness
    beatButtons.map((b, i) =>
      b.setMode(config?.beats[i] ? 'pressed' : 'normal')
    );
  };

  const getAlpha = (): number => {
    if (!lastBeatInfo || !config || !config.beats[lastBeatInfo.data.barIndex]) {
      return 0;
    }

    if (config.mode === 'flash') {
      return Math.max(
        0,
        1 -
          (Date.now() - lastBeatInfo.beatStartMs) /
            lastBeatInfo.data.periodMs /
            config.flashLength
      );
    } else {
      if (Date.now() - lastBeatInfo.beatStartMs < lastBeatInfo.data.periodMs) {
        return 1;
      } else {
        return 0;
      }
    }
  };

  const module = new AlphaModule(input.getModlue(), getAlpha);

  BEAT_EVENT.addEventListener((data) => {
    lastBeatInfo = {
      beatStartMs: Date.now(),
      data,
    };

    // Update booleans in config
    if (config && data.barSize !== config?.beats.length) {
      context.updateConfig((current) => {
        const beats = [...current.beats];
        // Add missing beats
        for (let i = beats.length; i < data.barSize; i++) {
          beats.push(false);
        }
        // Remove extra children
        beats.splice(data.barSize, beats.length - data.barSize);
        return {
          ...current,
          beats,
        };
      });
    }
  });

  return {
    applyConfig: (newConfig, oldConfig) => {
      config = newConfig;
      modeFlash.setMode(config.mode === 'flash' ? 'pressed' : 'normal');
      modeHold.setMode(config.mode === 'hold' ? 'pressed' : 'normal');
      flashLength.setValue(newConfig.flashLength);
      input.applyConfig(config.module, oldConfig?.module);
      updateBeatButtons();
    },
    getLightDeskComponent: () => group,
    destroy: () => {
      input.destroy();
    },
    getModlue: () => module,
  };
};

export const BEAT_FLASH_INPUT_KIND: InputKind<Config> = {
  kind: 'beat-flash',
  config: BEAT_FLASH_INPUT_CONFIG,
  initialConfig: DEFAULT_CONFIG,
  create: createBeatFlashInput,
};

export const BEAT_INPUT_PLUGIN: Plugin = {
  init: (context) => {
    context.registerInputKind(BEAT_FLASH_INPUT_KIND);
  },
};
