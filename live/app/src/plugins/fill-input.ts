import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import type {
  Input,
  InputContext,
  InputKind,
  Plugin,
} from '@synesthesia-project/live-core/lib/plugins';
import FillModule from '@synesthesia-project/compositor/lib/modules/fill';
import {
  RGBAColor,
  RGBA_BLACK,
} from '@synesthesia-project/compositor/lib/color';

const FILL_INPUT_CONFIG = t.type({
  r: t.number,
  g: t.number,
  b: t.number,
  alpha: t.number,
});

type Config = t.TypeOf<typeof FILL_INPUT_CONFIG>;

const createFillInput = (context: InputContext<Config>): Input<Config> => {
  let color = RGBA_BLACK;
  const group = new ld.Group({ noBorder: true, wrap: true });
  const module = new FillModule(() => color);

  const rect = group.addChild(new ld.Rect());

  const sliders = {
    r: new ld.SliderButton({
      value: 0,
      min: 0,
      max: 255,
      step: 1,
      mode: 'writeThrough',
    }),
    g: new ld.SliderButton({
      value: 0,
      min: 0,
      max: 255,
      step: 1,
      mode: 'writeThrough',
    }),
    b: new ld.SliderButton({
      value: 0,
      min: 0,
      max: 255,
      step: 1,
      mode: 'writeThrough',
    }),
    alpha: new ld.SliderButton({
      value: 1,
      min: 0,
      max: 1,
      step: 0.01,
      mode: 'writeThrough',
    }),
  } as const;

  group.addChildren(
    new ld.Label({ text: 'Color:' }),
    sliders.r,
    sliders.g,
    sliders.b,
    new ld.Label({ text: 'Alpha:' }),
    sliders.alpha
  );

  const updateConfig = (config: Partial<Config>) =>
    context.updateConfig((current) => ({ ...current, ...config }));

  sliders.r.addListener((r) => updateConfig({ r }));
  sliders.g.addListener((g) => updateConfig({ g }));
  sliders.b.addListener((b) => updateConfig({ b }));
  sliders.alpha.addListener((alpha) => updateConfig({ alpha }));

  return {
    applyConfig: (c) => {
      const { r, g, b, alpha } = c;
      sliders.r.setValue(r);
      sliders.g.setValue(g);
      sliders.b.setValue(b);
      sliders.alpha.setValue(alpha);
      color = new RGBAColor(r, g, b, alpha);
      rect.setColor(color);
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
