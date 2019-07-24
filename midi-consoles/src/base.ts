import * as midi from 'midi';

export class Base {

  private readonly input: midi.Input;
  private readonly output: midi.Output;

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
  }

  public close() {
    this.output.closePort();
    this.input.closePort();
  }

}
