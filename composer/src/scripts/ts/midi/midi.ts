
// Type Check Functions

function isMidiInput(port: WebMidi.MIDIPort): port is WebMidi.MIDIInput {
  return port.type === 'input';
}

interface MidiListener {
  inputRemoved: (id: string) => void;
  noteOn: (inputId: string, note: number, velocity: number) => void;
  noteOff: (inputId: string, note: number) => void;
}

export class Midi {

  private initialised = false;
  private readonly listeners = new Set<MidiListener>();

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

  public addListener(listener: MidiListener) {
    this.listeners.add(listener);
  }

  public removeListener(listener: MidiListener) {
    this.listeners.delete(listener);
  }

  private onMidiAccessReady(midiAccess: WebMidi.MIDIAccess) {
    midiAccess.inputs.forEach(input => {
      this.setupOrTeardownMidiInput(input);
    });
    midiAccess.onstatechange = this.onMidiStateChange;
  }

  private onMidiStateChange(change: WebMidi.MIDIConnectionEvent) {
    if (isMidiInput(change.port)) {
      this.setupOrTeardownMidiInput(change.port);
    }
  }

  private setupOrTeardownMidiInput(input: WebMidi.MIDIInput) {
    if (input.state === 'connected') {
      console.log('setting up midi input', input.id);
      input.onmidimessage = this.onMidiMessageClosure(input);
    } else {
      console.log('tearing down midi input', input.id);
      this.listeners.forEach(l => l.inputRemoved(input.id));
    }
  }

  private onMidiMessageClosure(input: WebMidi.MIDIInput) {
    return (msg: WebMidi.MIDIMessageEvent) => {
      const data = msg.data,
            // cmd = data[0] >> 4,
            // channel = data[0] & 0xf,
            type = data[0] & 0xf0, // channel agnostic message type. Thanks, Phil Burk.
            note = data[1],
            velocity = data[2];
      switch (type) {
        case 144: // noteOn message
           if (velocity > 0) {
             this.listeners.forEach(l => l.noteOn(input.id, note, velocity));
           } else {
             this.listeners.forEach(l => l.noteOff(input.id, note));
           }
           break;
        case 128: // noteOff message
          this.listeners.forEach(l => l.noteOff(input.id, note));
          break;
      }
    };
  }
}
