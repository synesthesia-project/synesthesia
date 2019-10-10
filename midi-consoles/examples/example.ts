import * as consoles from '@synesthesia-project/midi-consoles';

import { CHANNELS, Channel, VPotLEDMode } from '@synesthesia-project/midi-consoles/lib/protocols/mcu';

const devices = consoles.getMIDIDevices();

console.log(devices);

const deviceId = devices.filter(name => name.indexOf('X-Touch-Ext') !== -1)[0];

const vpotStates: {value: number, mode: VPotLEDMode}[] = [
  {
    value: 1, mode: 'single'
  },
  {
    value: 1, mode: 'boost-cut'
  },
  {
    value: 1, mode: 'wrap'
  },
  {
    value: 1, mode: 'spread'
  },
  {
    value: 1, mode: 'single'
  },
  {
    value: 1, mode: 'boost-cut'
  },
  {
    value: 1, mode: 'wrap'
  },
  {
    value: 1, mode: 'spread'
  }
];

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
    if (e.button === 'v-select') {
      // change vpot display mode
      const state = vpotStates[e.channel];
      state.mode = (
        state.mode === 'single' ? 'boost-cut' :
        state.mode === 'boost-cut' ? 'wrap' :
        state.mode === 'wrap' ? 'spread' : 'single'
      );
      sendVPotState(e.channel);
    }
    b.setVUMeterLevel(e.channel, 0xe);
  } else {
    b.setChannelLCD(e.channel, 'top', '');
    b.setVUMeterLevel(e.channel, 0);
  }
});

b.addEventListener('v-pot', e => {
  console.log('v-pot', e);
  b.setChannelLCD(e.channel, 'bottom', (e.direction === 'cw' ? '>' : '<') + ' ' + e.ticks);
  // Update vPot State
  const state = vpotStates[e.channel];
  if (e.direction === 'cw') {
    state.value += e.ticks;
    if (state.value > 0x0b) state.value = 0x0b;
  } else {
    state.value -= e.ticks;
    if (state.value < 0x01) state.value = 0x01;
  }
  sendVPotState(e.channel);
  b.setVUMeterLevel(e.channel, e.ticks);
});

function sendVPotState(channel: Channel) {
  b.setVPotRing(channel, 'off', vpotStates[channel].mode, vpotStates[channel].value);
}

CHANNELS.forEach(c => sendVPotState(c));

