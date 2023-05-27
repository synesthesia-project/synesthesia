import { Stage } from './stage';
import { VIRTUAL_OUTPUT_PLUGIN } from './plugins/virtual-output';
import { FILL_INPUT_PLUGIN } from './plugins/fill-input';
import { ADD_INPUT_PLUGIN } from './plugins/add-input';
import { DMX_PLUGIN } from '@synesthesia-project/live-dmx';

const configPath = process.argv[2];

if (!configPath) {
  throw new Error(`Missing config path argument`);
}

Stage(
  [VIRTUAL_OUTPUT_PLUGIN, FILL_INPUT_PLUGIN, ADD_INPUT_PLUGIN, DMX_PLUGIN],
  configPath
);
