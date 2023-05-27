import artnet = require('artnet');
import * as t from 'io-ts';
import {
  Output,
  OutputContext,
  OutputKind,
  Plugin,
} from '@synesthesia-project/live-core/lib/plugins';
import * as ld from '@synesthesia-project/light-desk';

const DMX_OUTPUT_CONFIG = t.type({
  artnetUniverse: t.union([t.number, t.null]),
  fixtures: t.array(t.type({})),
});

type Config = t.TypeOf<typeof DMX_OUTPUT_CONFIG>;

const createDmxOutput = (_context: OutputContext<Config>): Output<Config> => {
  const group = new ld.Group();

  let universe = 0;

  group.addChild(new ld.Label('DMX'));

  const a = artnet({
    sendAll: true,
  });

  return {
    setConfig: (config) => {
      universe = config.artnetUniverse ?? universe;
      a.set(universe, 1, [0, 0, 255, 0, 255, 0, 255, 0, 255, 255, 255, 0]);
    },
    destroy: () => {
      a.close();
    },
    getLightDeskComponent: () => group,
  };
};

export const DMX_OUTPUT_KIND: OutputKind<Config> = {
  kind: 'dmx',
  config: DMX_OUTPUT_CONFIG,
  initialConfig: {
    artnetUniverse: 0,
    fixtures: [],
  },
  create: createDmxOutput,
};

export const DMX_PLUGIN: Plugin = {
  init: (context) => {
    context.registerOutputKind(DMX_OUTPUT_KIND);
  },
};
