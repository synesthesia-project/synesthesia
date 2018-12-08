import {join} from 'path';

import {Display} from './behaviour/display';
import {DmxProxy} from './dmx/proxy';
import {SynesthesiaListener} from './listener/listener';
import {getConfig} from './config/home';

export {Display, SynesthesiaListener, getConfig};

const PYTHON_PROXY = join(__dirname, 'proxy.py');

export function getProxy() {
  return new DmxProxy(PYTHON_PROXY);
}
