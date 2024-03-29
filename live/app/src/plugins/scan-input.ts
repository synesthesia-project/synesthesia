import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import type {
  Input,
  InputContext,
  InputKind,
  Plugin,
} from '@synesthesia-project/live-core/lib/plugins';
import ScanModule from '@synesthesia-project/compositor/lib/modules/scan';
import {
  RGBAColor,
  RGBA_BLACK,
} from '@synesthesia-project/compositor/lib/color';

const SCAN_INPUT_CONFIG = t.type({
  r: t.number,
  g: t.number,
  b: t.number,
  alpha: t.number,
  beamWidth: t.number,
  delay: t.number,
  speed: t.number,
});

type Config = t.TypeOf<typeof SCAN_INPUT_CONFIG>;

const DEFAULT_CONFIG: Config = {
  r: 255,
  g: 255,
  b: 255,
  alpha: 0.1,
  beamWidth: 0.2,
  delay: 0.5,
  speed: 0.5,
};

const createScanInput = (context: InputContext<Config>): Input<Config> => {
  let color = RGBA_BLACK;
  const group = new ld.Group({ noBorder: true, wrap: true });
  const module = new ScanModule(() => color);

  const rect = group.addChild(new ld.Rect());

  group.addChild(new ld.Label({ text: 'Color:' }));
  const sliders = {
    r: group.addChild(
      new ld.SliderButton({
        value: 0,
        min: 0,
        max: 255,
        step: 1,
        mode: 'writeThrough',
      })
    ),
    g: group.addChild(
      new ld.SliderButton({
        value: 0,
        min: 0,
        max: 255,
        step: 1,
        mode: 'writeThrough',
      })
    ),
    b: group.addChild(
      new ld.SliderButton({
        value: 0,
        min: 0,
        max: 255,
        step: 1,
        mode: 'writeThrough',
      })
    ),
    alpha: group.addChild(
      new ld.SliderButton({
        value: 1,
        min: 0,
        max: 1,
        step: 0.01,
        mode: 'writeThrough',
      })
    ),
  } as const;

  group.addChild(new ld.Label({ text: 'Beam Width:' }));
  const beamWidth = group.addChild(
    new ld.SliderButton({
      value: DEFAULT_CONFIG.beamWidth,
      min: 0,
      max: 1,
      step: 0.01,
      mode: 'writeThrough',
    })
  );

  group.addChild(new ld.Label({ text: 'Delay:' }));
  const delay = group.addChild(
    new ld.SliderButton({
      value: DEFAULT_CONFIG.delay,
      min: 0,
      max: 40,
      step: 0.01,
      mode: 'writeThrough',
    })
  );

  group.addChild(new ld.Label({ text: 'Speed:' }));
  const speed = group.addChild(
    new ld.SliderButton({
      value: DEFAULT_CONFIG.speed,
      min: -10,
      max: 10,
      step: 0.01,
      mode: 'writeThrough',
    })
  );

  const updateConfig = (config: Partial<Config>) =>
    context.updateConfig((current) => ({ ...current, ...config }));

  sliders.r.addListener('change', (r) => updateConfig({ r }));
  sliders.g.addListener('change', (g) => updateConfig({ g }));
  sliders.b.addListener('change', (b) => updateConfig({ b }));
  sliders.alpha.addListener('change', (alpha) => updateConfig({ alpha }));

  beamWidth.addListener('change', (beamWidth) => updateConfig({ beamWidth }));
  delay.addListener('change', (delay) => updateConfig({ delay }));
  speed.addListener('change', (speed) => updateConfig({ speed }));

  return {
    applyConfig: (config, prevConfig) => {
      if (prevConfig === config) {
        return;
      }
      const { r, g, b, alpha } = config;
      sliders.r.setValue(r);
      sliders.g.setValue(g);
      sliders.b.setValue(b);
      sliders.alpha.setValue(alpha);
      beamWidth.setValue(config.beamWidth);
      delay.setValue(config.delay);
      speed.setValue(config.speed);
      color = new RGBAColor(r, g, b, alpha);
      rect.setColor(color);
      module.setOptions({
        beamWidth: config.beamWidth,
        delay: config.delay,
        speed: config.speed,
      });
    },
    getLightDeskComponent: () => group,
    destroy: () => {
      // no-op
    },
    getModlue: () => module,
  };
};

export const SCAN_INPUT_KIND: InputKind<Config> = {
  kind: 'scan',
  config: SCAN_INPUT_CONFIG,
  initialConfig: DEFAULT_CONFIG,
  create: createScanInput,
};

export const SCAN_INPUT_PLUGIN: Plugin = {
  init: (context) => {
    context.registerInputKind(SCAN_INPUT_KIND);
  },
};
