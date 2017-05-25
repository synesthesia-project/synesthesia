import {LEDStripBackend} from './backends/backends';
import {DemoBackend} from './backends/demo';
import {StripBehavior} from './behavior/behavior';
import {Frontend} from './frontend/frontend';

const leds = 60 * 4;

const backend: LEDStripBackend = new DemoBackend(leds);

const behaviour = new StripBehavior(leds, backend);

const frontend = new Frontend(behaviour);

backend.connect();
frontend.start();
