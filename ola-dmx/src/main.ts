import {join} from 'path';

import {Proxy} from './dmx/proxy';

const PYTHON_PROXY = join(__dirname, '/proxy.py');

const proxy = new Proxy(PYTHON_PROXY);

let c = 0;
let buffer = new Int8Array(512);
buffer[2] = 128;
buffer[5] = 255;
setInterval(
  () => {
    if (c === 0) {
      c = 1;
      buffer[7] = 100;
      buffer[8] = 100;
      buffer[9] = 25;
      buffer[10] = 25;
    } else if (c === 1) {
      c = 2;
      buffer[7] = 0;
      buffer[8] = 100;
      buffer[9] = 205;
      buffer[10] = 25;
    } else {
      c = 0;
      buffer[7] = 80;
      buffer[8] = 200;
      buffer[9] = 25;
      buffer[10] = 25;
    }
    proxy.writeDmx(0, buffer);
  },
  300);
