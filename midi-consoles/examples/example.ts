import * as consoles from '@synesthesia-project/midi-consoles';

const devices = consoles.getMIDIDevices();

console.log(devices);

const deviceId = devices.filter(name => name.indexOf('X-Touch-Ext') !== -1)[0];

if (!deviceId) {
  console.error('No matching device');
  process.exit(1);
}

console.log('chosing Device: ' + deviceId);

const b = new consoles.XTouchExtenderMCU(deviceId);

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
