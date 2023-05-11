import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import { Input, InputContext, InputKind, Plugin } from '.';
import FillModule from '@synesthesia-project/compositor/lib/modules/fill';
import {
  RGBAColor,
  RGBA_BLACK,
} from '@synesthesia-project/compositor/lib/color';
import { COLOR_RGB_BLACK } from '@synesthesia-project/light-desk/build/backend/util/color';

const FILL_INPUT_CONFIG = t.type({
  r: t.number,
  g: t.number,
  b: t.number,
  alpha: t.number,
});

type Config = t.TypeOf<typeof FILL_INPUT_CONFIG>;

const createFillInput = (context: InputContext<Config>): Input<Config> => {
  const state: {
    config: Config | null;
    color: RGBAColor;
  } = {
    config: null,
    color: RGBA_BLACK,
  };

  const group = new ld.Group({ noBorder: true });
  const module = new FillModule<unknown>(() => state.color);

  const rect = new ld.Rect(COLOR_RGB_BLACK);
  group.addChild(rect);

  const sliders = {
    r: new ld.SliderButton(0, 0, 255, 1, 'writeThrough'),
    g: new ld.SliderButton(0, 0, 255, 1, 'writeThrough'),
    b: new ld.SliderButton(0, 0, 255, 1, 'writeThrough'),
    alpha: new ld.SliderButton(1, 0, 1, 0.01, 'writeThrough'),
  } as const;

  group.addChild(...Object.values(sliders));

  const updateConfig = (config: Partial<Config>) =>
    state.config && context.saveConfig({ ...state.config, ...config });

  sliders.r.addListener((r) => updateConfig({ r }));
  sliders.g.addListener((g) => updateConfig({ g }));
  sliders.b.addListener((b) => updateConfig({ b }));
  sliders.alpha.addListener((alpha) => updateConfig({ alpha }));

  return {
    setConfig: (c) => {
      const { r, g, b, alpha } = (state.config = c);
      sliders.r.setValue(r);
      sliders.g.setValue(g);
      sliders.b.setValue(b);
      sliders.alpha.setValue(alpha);
      rect.setColor(
        new ld.color.RGBColor(c.r * c.alpha, c.g * c.alpha, c.b * c.alpha)
      );
      state.color = new RGBAColor(r, g, b, alpha);
    },
    getLightDeskComponent: () => group,
    destroy: () => {
      // no-op
    },
    getModlue: () => module,
  };
};

export const FILL_INPUT_KIND: InputKind<Config> = {
  kind: 'fill',
  config: FILL_INPUT_CONFIG,
  initialConfig: {
    r: 0,
    g: 0,
    b: 0,
    alpha: 1,
  },
  create: createFillInput,
};

export const FILL_INPUT_PLUGIN: Plugin = {
  init: (context) => {
    context.registerInputKind(FILL_INPUT_KIND);
  },
};
