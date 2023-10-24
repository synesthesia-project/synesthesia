import { Stage } from './stage';
import { VIRTUAL_OUTPUT_PLUGIN } from './plugins/virtual-output';
import { FILL_INPUT_PLUGIN } from './plugins/fill-input';
import { ADD_INPUT_PLUGIN } from './plugins/add-input';
import { CHASE_INPUT_PLUGIN } from './plugins/chase-input';
import { DMX_PLUGIN } from '@synesthesia-project/live-dmx';
import { SCAN_INPUT_PLUGIN } from './plugins/scan-input';
import { BPM_PLUGIN } from './plugins/bpm';
import { BEAT_INPUT_PLUGIN } from './plugins/beat-input';
import { FILTER_INPUT_PLUGIN } from './plugins/filter-input';

const configPath = process.argv[2];

if (!configPath) {
  throw new Error(`Missing config path argument`);
}

Stage(
  [
    BEAT_INPUT_PLUGIN,
    BPM_PLUGIN,
    VIRTUAL_OUTPUT_PLUGIN,
    CHASE_INPUT_PLUGIN,
    FILL_INPUT_PLUGIN,
    FILTER_INPUT_PLUGIN,
    SCAN_INPUT_PLUGIN,
    ADD_INPUT_PLUGIN,
    DMX_PLUGIN,
  ],
  configPath
);

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', (err) => {
    console.error(err, 'Uncaught Exception thrown');
  });
