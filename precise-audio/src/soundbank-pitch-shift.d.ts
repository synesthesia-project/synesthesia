declare module 'soundbank-pitch-shift' {
  class PitchShift extends AudioNode {
    public transpose: number;
    public readonly wet: AudioParam;
    public readonly dry: AudioParam;
  }

  function PitchShiftInit(context: AudioContext): PitchShift;

  export = PitchShiftInit;
}
