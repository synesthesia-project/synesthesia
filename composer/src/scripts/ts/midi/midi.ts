export function init() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(
      midiAccessReady,
      error => {
        console.error(error);
      }
    )
  }
}

function midiAccessReady(midiAccess: WebMidi.MIDIAccess) {
  midiAccess.inputs.forEach(input => {
    setupOrTeardownMidiInput(input);
  });
  midiAccess.onstatechange = onMidiStateChange;
}

function isMidiInput(port: WebMidi.MIDIPort): port is WebMidi.MIDIInput {
  return port.type === 'input';
}

function onMidiStateChange(change: WebMidi.MIDIConnectionEvent) {
  if (isMidiInput(change.port)){
    setupOrTeardownMidiInput(change.port);
  }
}

function setupOrTeardownMidiInput(input: WebMidi.MIDIInput) {
  if (input.state === 'connected') {
    console.log('setting up midi input', input.id);
    input.onmidimessage = onMidiMessageClosure(input);
  } else {
    console.log('tearing down midi input', input.id);
  }
}

function onMidiMessageClosure(input: WebMidi.MIDIInput) {
  return (msg: WebMidi.MIDIMessageEvent) => {
    const data = msg.data,
          cmd = data[0] >> 4,
          channel = data[0] & 0xf,
          type = data[0] & 0xf0, // channel agnostic message type. Thanks, Phil Burk.
          note = data[1],
          velocity = data[2];
    switch (type) {
      case 144: // noteOn message
         console.log('noteOn', note, velocity);
         break;
      case 128: // noteOff message
        console.log('noteOn', note, velocity);
        break;
    }
  }
}
