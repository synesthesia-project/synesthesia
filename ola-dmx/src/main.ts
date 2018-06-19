import {join} from 'path';

import {Display} from './behaviour/display';
import {DmxProxy} from './dmx/proxy';
import {SynesthesiaListener} from './listener/listener';
import {getConfig} from './config/home';

const PYTHON_PROXY = join(__dirname, '/proxy.py');

const proxy = new DmxProxy(PYTHON_PROXY);

const display = new Display(getConfig(), proxy);

const consumer = new SynesthesiaListener(display.newSynesthesiaPlayState);

display.run();
