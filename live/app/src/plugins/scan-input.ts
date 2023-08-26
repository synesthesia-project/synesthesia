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

  group.addChild(new ld.Label('Color:'));
  const sliders = {
    r: group.addChild(new ld.SliderButton(0, 0, 255, 1, 'writeThrough')),
    g: group.addChild(new ld.SliderButton(0, 0, 255, 1, 'writeThrough')),
    b: group.addChild(new ld.SliderButton(0, 0, 255, 1, 'writeThrough')),
    alpha: group.addChild(new ld.SliderButton(1, 0, 1, 0.01, 'writeThrough')),
  } as const;

  group.addChild(new ld.Label('Beam Width:'));
  const beamWidth = group.addChild(
    new ld.SliderButton(DEFAULT_CONFIG.beamWidth, 0, 1, 0.01, 'writeThrough')
  );

  group.addChild(new ld.Label('Delay:'));
  const delay = group.addChild(
    new ld.SliderButton(DEFAULT_CONFIG.delay, 0, 40, 0.01, 'writeThrough')
  );

  group.addChild(new ld.Label('Speed:'));
  const speed = group.addChild(
    new ld.SliderButton(DEFAULT_CONFIG.speed, -10, 10, 0.01, 'writeThrough')
  );

  const updateConfig = (config: Partial<Config>) =>
    context.updateConfig((current) => ({ ...current, ...config }));

  sliders.r.addListener((r) => updateConfig({ r }));
  sliders.g.addListener((g) => updateConfig({ g }));
  sliders.b.addListener((b) => updateConfig({ b }));
  sliders.alpha.addListener((alpha) => updateConfig({ alpha }));

  beamWidth.addListener((beamWidth) => updateConfig({ beamWidth }));
  delay.addListener((delay) => updateConfig({ delay }));
  speed.addListener((speed) => updateConfig({ speed }));

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
