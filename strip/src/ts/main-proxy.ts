import {LEDStripBackend} from './backends/backends';
import {AdafruitDotstarsProxyBackend} from './backends/adafruit-dotstars-proxy';
import {StripBehavior} from './behavior/behavior';
import {Frontend} from './frontend/frontend';

const sockfile = '/tmp/led-socket';
const leds = 60 * 6;

const backend: LEDStripBackend = new AdafruitDotstarsProxyBackend(leds, sockfile);

const behaviour = new StripBehavior(leds, backend);

const frontend = new Frontend(behaviour);

backend.connect();
frontend.start();
