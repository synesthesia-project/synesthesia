import {LEDStripBackend} from "./backends/backends";
import {AdafruitDotstarsProxyBackend} from "./backends/adafruit-dotstars-proxy";
import {StripBehavior} from "./behavior/behavior";

const sockfile = '/tmp/led-socket';
const leds = 60;

const backend: LEDStripBackend = new AdafruitDotstarsProxyBackend(leds, sockfile);

const behaviour = new StripBehavior(leds, backend);

backend.connect();
