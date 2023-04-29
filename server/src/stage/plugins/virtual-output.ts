import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';

import { Output, OutputContext, OutputKind, Plugin } from '.';

const VIRTUAL_OUTPUT_CONFIG = t.type({
  pixels: t.number,
});

type Config = t.TypeOf<typeof VIRTUAL_OUTPUT_CONFIG>;

const createVirtualOutput = (
  _context: OutputContext<Config>
): Output<Config> => {
  const group = new ld.Group();
  const label = new ld.Label(`virtual!`);
  group.addChild(label);

  return {
    setConfig: (config) => {
      label.setText(`virtual: ${config.pixels} pixel(s)`);
    },
    getLightDeskComponent: () => group,
  };
};

export const VIRTUAL_OUTPUT_KIND: OutputKind<Config> = {
  kind: 'virtual',
  config: VIRTUAL_OUTPUT_CONFIG,
  initialConfig: {
    pixels: 1,
  },
  create: createVirtualOutput,
};

export const VIRTUAL_OUTPUT_PLUGIN: Plugin = {
  init: (context) => {
    context.registerOutputKind(VIRTUAL_OUTPUT_KIND);
  },
};
