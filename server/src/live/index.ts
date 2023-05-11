import { Stage } from '@synesthesia-project/live-core/lib/stage';
import { VIRTUAL_OUTPUT_PLUGIN } from '@synesthesia-project/live-core/lib/plugins/virtual-output';
import { FILL_INPUT_PLUGIN } from '@synesthesia-project/live-core/lib/plugins/fill-input';
import { ADD_INPUT_PLUGIN } from '@synesthesia-project/live-core/lib/plugins/add-input';

const configPath = process.argv[2];

if (!configPath) {
  throw new Error(`Missing config path argument`);
}

Stage([VIRTUAL_OUTPUT_PLUGIN, FILL_INPUT_PLUGIN, ADD_INPUT_PLUGIN], configPath);
