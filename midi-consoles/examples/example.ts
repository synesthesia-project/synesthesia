import * as consoles from '@synesthesia-project/midi-consoles';
import XTouchExtender from '@synesthesia-project/midi-consoles/lib/devices/behringer-x-touch-extender-mcu';

console.log(consoles.getMIDIDevices());

const b = new XTouchExtender('X-Touch-Ext:X-Touch-Ext MIDI 1 32:0');

b.addEventListener('fader', e => {
  console.log('fader', e);
});

// b.close();
