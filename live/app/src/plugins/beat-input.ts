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
import { BEAT_EVENT } from './bpm';

const BEAT_FLASH_INPUT_CONFIG = OPTIONAL_KIND_AND_CONFIG;

type Config = t.TypeOf<typeof BEAT_FLASH_INPUT_CONFIG>;

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
  let lastBeatInfo: null | {
    beatStartMs: number;
    periodMs: number;
  } = null;

  BEAT_EVENT.addEventListener(({ periodMs }) => {
    lastBeatInfo = {
      beatStartMs: Date.now(),
      periodMs,
    };
  });

  const group = new ld.Group({ direction: 'vertical', noBorder: true });

  const input = context.createInputSocket({
    updateConfig: context.updateConfig,
  });

  group.addChild(input.getLightDeskComponent());

  const getAlpha = (): number => {
    if (!lastBeatInfo) {
      return 0;
    }

    return Math.max(
      0,
      1 - (Date.now() - lastBeatInfo.beatStartMs) / lastBeatInfo.periodMs
    );
  };

  const module = new AlphaModule(input.getModlue(), getAlpha);

  return {
    applyConfig: input.applyConfig,
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
  initialConfig: null,
  create: createBeatFlashInput,
};

export const BEAT_INPUT_PLUGIN: Plugin = {
  init: (context) => {
    context.registerInputKind(BEAT_FLASH_INPUT_KIND);
  },
};
