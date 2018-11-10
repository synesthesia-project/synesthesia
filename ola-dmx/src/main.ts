import {join} from 'path';
import * as lightDesk from '@samlanning/synesthesia-light-desk';

import {Display} from './behaviour/display';
import {DmxProxy} from './dmx/proxy';
import {SynesthesiaListener} from './listener/listener';
import {getConfig} from './config/home';

const PYTHON_PROXY = join(__dirname, '/proxy.py');

const proxy = new DmxProxy(PYTHON_PROXY);

const display = new Display(getConfig(), proxy);

const consumer = new SynesthesiaListener(display.newSynesthesiaPlayState);

display.run();

const desk = new lightDesk.LightDesk();

const g = new lightDesk.Group();
desk.setRoot(g);

const s = new lightDesk.Slider(0);
g.addChild(s);

const s2 = new lightDesk.Slider(10);
g.addChild(s2);
