import { Stage } from '@synesthesia-project/live-core/lib/stage';
import { VIRTUAL_OUTPUT_PLUGIN } from '@synesthesia-project/live-core/lib/plugins/virtual-output';
import { FILL_INPUT_PLUGIN } from '@synesthesia-project/live-core/lib/plugins/fill-input';

Stage([VIRTUAL_OUTPUT_PLUGIN, FILL_INPUT_PLUGIN]);
