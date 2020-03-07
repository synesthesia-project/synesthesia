declare module 'soundbank-pitch-shift' {

  class PitchShift extends AudioNode {
    transpose: number;
    readonly wet: AudioParam;
    readonly dry: AudioParam;
  }

  function PitchShiftInit(context: AudioContext): PitchShift;

  export = PitchShiftInit;
}
