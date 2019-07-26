import * as consoles from '@synesthesia-project/midi-consoles';

console.log(consoles.getMIDIDevices());

const b = new consoles.XTouchExtenderMCU('X-Touch-Ext:X-Touch-Ext MIDI 1 32:0');

b.setLCDText(0x7, 'Hello  World  ');

b.addEventListener('fader', e => {
  console.log('fader', e);
  const c = (e.channel + 4) % 8;
  b.setFader(c as any, e.value);
  if (e.channel !== 8) {
    b.setChannelLCD(e.channel, 'bottom', e.value.toString());
  }
});

const on = new Set<string>();

b.addEventListener('channel-button', e => {
  if (e.state === 'pressed') {
    const k = e.channel + e.button;
    b.setChannelLCD(e.channel, 'top', e.button);
    if (on.has(k)) {
      on.delete(k);
      b.setChannelLED(e.channel, e.button, false);
    } else {
      on.add(k);
      b.setChannelLED(e.channel, e.button, true);
    }
  } else {
    b.setChannelLCD(e.channel, 'top', '');
  }
});
