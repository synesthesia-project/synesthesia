import * as consoles from '@synesthesia-project/midi-consoles';
import XTouchExtender from '@synesthesia-project/midi-consoles/lib/devices/behringer-x-touch-extender-mcu';

console.log(consoles.getMIDIDevices());

const b = new XTouchExtender('X-Touch-Ext:X-Touch-Ext MIDI 1 32:0');

b.addEventListener('fader', e => {
  console.log('fader', e);
  const c = (e.channel + 4) % 8;
  b.setFader(c as any, e.value);
});

const on = new Set<string>();

b.addEventListener('channel-button', e => {
  if (e.state === 'pressed') {
    const k = e.channel + e.button;
    if (on.has(k)) {
      on.delete(k);
      b.setChannelLED(e.channel, e.button, false);
    } else {
      on.add(k);
      b.setChannelLED(e.channel, e.button, true);
    }
  }
});

b.setLCDText(0x6f, 'Qend some text');

// b.close();
