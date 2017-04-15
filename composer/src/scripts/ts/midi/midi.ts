
// Type Check Functions

function isMidiInput(port: WebMidi.MIDIPort): port is WebMidi.MIDIInput {
  return port.type === 'input';
}

export class Midi {

  private initialised = false;

  public constructor() {

    // Bind Listeners
    this.onMidiAccessReady = this.onMidiAccessReady.bind(this);
    this.onMidiStateChange = this.onMidiStateChange.bind(this);
  }

  public init() {
    if (this.initialised) return;
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(
        this.onMidiAccessReady,
        error => {
          console.error(error);
        }
      );
      this.initialised = true;
    }
  }

  private onMidiAccessReady(midiAccess: WebMidi.MIDIAccess) {
    midiAccess.inputs.forEach(input => {
      this.setupOrTeardownMidiInput(input);
    });
    midiAccess.onstatechange = this.onMidiStateChange;
  }

  private onMidiStateChange(change: WebMidi.MIDIConnectionEvent) {
    if (isMidiInput(change.port)){
      this.setupOrTeardownMidiInput(change.port);
    }
  }

  private setupOrTeardownMidiInput(input: WebMidi.MIDIInput) {
    if (input.state === 'connected') {
      console.log('setting up midi input', input.id);
      input.onmidimessage = this.onMidiMessageClosure(input);
    } else {
      console.log('tearing down midi input', input.id);
    }
  }

  private onMidiMessageClosure(input: WebMidi.MIDIInput) {
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
}
