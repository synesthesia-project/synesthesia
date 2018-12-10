interface Sample {
  file: string;
  /** How many copies of this audio file should be made ready */
  poolSize: number;
  volume: number;
  /** At what time in the file should playback start */
  startTime: number;
}

function sample(file: string, poolSize: number, volume: number, startTime: number) {
  return new AudioPool({file, poolSize, volume, startTime});
}

/**
 * A fixed-number collection of Audio elements for a single sound file, to allow for multi-playback of a single sound file
 */
class AudioPool {

  private readonly startTime: number;
  private readonly pool: HTMLAudioElement[] = [];
  private next = 0;

  constructor(sample: Sample) {
    this.startTime = sample.startTime;
    for (let i = 0; i < sample.poolSize; i++) {
      const audio = new Audio('/audio/' + sample.file);
      audio.volume = sample.volume;
      this.pool.push(audio);
    }
  }

  public play() {
    const audio = this.pool[this.next];
    audio.currentTime = this.startTime;
    audio.play();
    this.next ++;
    if (this.next >= this.pool.length) this.next = 0;
  }
}

const SAMPLES = {
  touch: sample('freesound/123105__dj-chronos__gui-2.wav', 3, 0.2, 0),
  beep2: sample('freesound/123112__dj-chronos__gui-8.wav', 3, 0.2, 0.1),
  beep3: sample('freesound/220206__gameaudio__beep-space-button.wav', 3, 0.6, 0),
  ready1: sample('freesound/220172__gameaudio__flourish-spacey-2.wav', 1, 0.6, 0),
  powerUp: sample('freesound/264762__farpro__guiclick.ogg', 1, 0.6, 0),
  powerDown: sample('freesound/264763__farpro__guiclick2.ogg', 1, 0.6, 0)
};

export type SampleKey = keyof typeof SAMPLES;

export function play(sample: SampleKey) {
  SAMPLES[sample].play();
}
