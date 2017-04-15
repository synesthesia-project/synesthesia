import {LEDStripBackend} from "./backends/backends";
import {DemoBackend} from "./backends/demo";
import {StripBehavior} from "./behavior/behavior";

const leds = 60;

const backend: LEDStripBackend = new DemoBackend(leds);

const behaviour = new StripBehavior(leds, backend);

backend.connect();
