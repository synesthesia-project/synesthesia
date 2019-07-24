import * as consoles from '@synesthesia-project/midi-consoles';
import {Base} from '@synesthesia-project/midi-consoles/lib/base';

console.log(consoles.getMIDIDevices());

const b = new Base('X-Touch-Ext:X-Touch-Ext MIDI 1 32:0');
b.close();
