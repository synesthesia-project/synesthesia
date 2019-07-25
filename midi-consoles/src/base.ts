import * as midi from 'midi';

type Listener = (data: number[]) => void;

export class Base {

  private readonly input: midi.Input;
  private readonly output: midi.Output;

  private readonly listeners = new Set<Listener>();

  public constructor(deviceName: string) {
    this.input = new midi.Input();
    const iLength = this.input.getPortCount();
    let inputSet = false;
    for (let i = 0; i < iLength; i++) {
      if (this.input.getPortName(i) === deviceName) {
        this.input.openPort(i);
        inputSet = true;
        break;
      }
    }
    this.output = new midi.Output();
    const oLength = this.output.getPortCount();
    let outputSet = false;
    for (let i = 0; i < oLength; i++) {
      if (this.output.getPortName(i) === deviceName) {
        this.output.openPort(i);
        outputSet = true;
        break;
      }
    }
    if (!inputSet) throw new Error('Unknown MIDI Input: ' + deviceName);
    if (!outputSet) throw new Error('Unknown MIDI Output: ' + deviceName);

    this.input.on('message', (delta, message) => this.handleMidi(message));
  }

  public close() {
    this.output.closePort();
    this.input.closePort();
  }

  public addListener(l: Listener) {
    this.listeners.add(l);
  }

  public removeListener(l: Listener) {
    this.listeners.delete(l);
  }

  private handleMidi(message: number[]) {
    this.listeners.forEach(l => l(message));
  }

  public sendMidi(message: number[]) {
    console.log('sending', message.map(n => n.toString(16)));
    this.output.sendMessage(message);
  }

}
