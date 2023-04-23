import {AudioFile, AUDIO_FILES} from '../../shared/static';

/**
 * The root URL used for this light desk
 */
const ROOT_URL = window.location.pathname;

/**
 * A fixed-number collection of Audio elements for a single sound file, to allow for multi-playback of a single sound file
 */
class AudioPool {

  private readonly startTime: number;
  private readonly pool: HTMLAudioElement[] = [];
  private next = 0;

  constructor(sample: AudioFile) {
    this.startTime = sample.startTime;
    for (let i = 0; i < sample.poolSize; i++) {
      const audio = new Audio(`${ROOT_URL}audio/${sample.file}`);
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

export type SampleKey = keyof typeof AUDIO_FILES;

const SAMPLES = new Map<SampleKey, AudioPool>();

for (const key of Object.keys(AUDIO_FILES)) {
  const audioFile: AudioFile = AUDIO_FILES[key];
  SAMPLES.set(key as keyof typeof AUDIO_FILES, new AudioPool(audioFile));
}

export function play(key: SampleKey) {
  const sample = SAMPLES.get(key);
  if (sample) sample.play();
}
