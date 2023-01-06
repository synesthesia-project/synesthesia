declare module 'midi' {
  import { Stream } from 'stream';
  class Input {
    public getPortCount(): number;
    public getPortName(port: number): string;
    public on(
      event: 'message',
      callback: (deltaTime: number, message: number[]) => void
    ): void;
    public openPort(port: number): void;
    public openVirtualPort(name: string): void;
    /**
     * sysex, timing, and active sensing messages are ignored
     * by default. To enable these message types, pass false for
     * the appropriate type into this function.
     *
     * For example if you want to receive only MIDI Clock beats
     * you should use:
     *
     * @example input.ignoreTypes(true, false, true)
     */
    public ignoreTypes(
      sysex: boolean,
      timing: boolean,
      activeSensing: boolean
    ): void;
    public closePort(): void;
  }

  class Output {
    public getPortCount(): number;
    public getPortName(port: number): string;
    public openPort(port: number): void;
    public sendMessage(message: number[]): void;
    public closePort(): void;
  }

  function createReadStream(input: Input): Stream;
  function createWriteStream(output: Output): Stream;
}
