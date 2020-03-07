import PitchShift = require('soundbank-pitch-shift');

/* tslint:disable:unified-signatures */

type PlayState =
  {
    state: 'paused';
    positionMillis: number;
  } |
  {
    state: 'playing';
    source: AudioBufferSourceNode;
    /**
     * Millisecond timestamp (based on the AudioContext clock) that the song
     * started playing at the current playback rate
     */
    effectiveStartTimeMillis: number;
  };

type Listener = EventListener | EventListenerObject | null;

type EventTypes = 'playing' | 'pause' | 'seeked' | 'canplay' | 'canplaythrough' | 'loadeddata';

type TrackSource = {
  type: 'src';
  src: string;
} | {
  type: 'file';
  file: File | Blob;
}

type Track = {
  source: TrackSource;
  /**
   * Set once successfully loaded
   */
  data?: {
    buffer: AudioBuffer;
    state: PlayState;
  }
};

/**
 * An event triggered by a
 * {@link @synesthesia-project/precise-audio.PreciseAudio} object.
 */
export class PreciseAudioEvent extends Event {

  private readonly _target: PreciseAudio;

  public constructor(eventType: EventTypes, target: PreciseAudio) {
    super(eventType);
    this._target = target;
  }

  /**
   * @inheritdoc
   */
  public get target() {
    return this._target;
  }

  /**
   * @inheritdoc
   */
  public get currentTarget() {
    return this._target;
  }
}

/**
 * An audio player that can seek and provide timestamps with millisecond
 * accuracy.
 *
 * In contrast to the `<audio>` tag, this class will load an entire track
 * into memory as a raw waveform, as otherwise, with most codecs,
 * it's impossible to seek to accurate locations in songs.
 *
 * **ExampleUsage:**
 *
 * ```ts
 * import PreciseAudio from '@synesthesia-project/precise-audio';
 *
 * const audio = new PreciseAudio();
 * audio.loadAudioFile(...);
 * ```
 *
 * Motivation, more usage instructions, and other details can be found
 * [in the project GitHub repository](https://github.com/synesthesia-project/synesthesia/tree/master/precise-audio)
 */
export default class PreciseAudio extends EventTarget {

  private readonly context = new AudioContext();
  private _playbackRate = 1;
  private _adjustPitchWithPlaybackRate = true;
  private track: Track | null = null;

  private async loadFile(track: Track, file: File | Blob) {
    const fileBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => {
        resolve(ev.target?.result as ArrayBuffer);
      };
      reader.onerror = () => {
        reader.abort();
        reject(reader.error);
      };
      reader.readAsArrayBuffer(file);
    });
    const buffer = await this.context.decodeAudioData(fileBuffer);
    if (track === this.track) {
      track.data = {
        buffer,
        state: {
          state: 'paused', positionMillis: 0
        }
      };
      this.sendEvent('loadeddata');
      this.sendEvent('canplay');
      this.sendEvent('canplaythrough');
    }
  }

  private sendEvent(eventType: EventTypes) {
    const event = new PreciseAudioEvent(eventType, this);
    this.dispatchEvent(event);
  }

  /**
   * Read and load a new audio file.
   *
   * The loaded audio file will be paused once it's loaded,
   * and will not play automatically.
   *
   * @param file A [File](https://developer.mozilla.org/en-US/docs/Web/API/File)
   *             or [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
   *             object representing the audio file to be played.
   * @returns A [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
   *          that resolves once the audio file has been successfully loaded.
   */
  public async loadAudioFile(file: File | Blob) {
    if (this.track?.data?.state.state === 'playing') {
      this.track.data.state.source.stop();
    }
    const track: Track = this.track = {
      source: {
        type: 'file', file
      }
    }
    await this.loadFile(track, file);
  }

  /**
   * @returns the URL of the track to play
   */
  public get src(): string {
    return this.track?.source.type === 'src' && this.track.source.src || '';
  }

  public set src(src: string) {
    if (this.track?.data?.state.state === 'playing') {
      this.track.data.state.source.stop();
    }
    const track: Track = this.track = {
      source: {
        type: 'src', src
      }
    }
    fetch(src).then(async r => {
      const blob = await r.blob();
      await this.loadFile(track, blob);
    });
  }

  private playFrom(positionMillis: number) {
    if (this.track?.data) {
      const nowMillis = this.context.currentTime * 1000;
      const source = this.context.createBufferSource();
      source.playbackRate.value = this._playbackRate;
      if (this._playbackRate !== 1 && this._adjustPitchWithPlaybackRate) {
        const pitchShift = PitchShift(this.context);
        pitchShift.connect(this.context.destination);
        // Calculate the notes (in 100 cents) to shift the pitch by
        // based on the frequency ration
        pitchShift.transpose = 12 * Math.log2(1 / this._playbackRate);
        source.connect(pitchShift);
      } else {
        source.connect(this.context.destination);
      }
      source.buffer = this.track.data.buffer;
      source.start(0, positionMillis / 1000);
      this.track.data.state = {
        state: 'playing',
        source,
        effectiveStartTimeMillis:
          nowMillis - positionMillis / this._playbackRate
      };
    }
  }

  /**
   * Begins playback of the audio.
   */
  public play() {
    if (this.context.state === 'suspended')
      this.context.resume();
    if (this.track?.data && this.track.data.state.state === 'paused') {
      this.playFrom(this.track.data.state.positionMillis);
      this.sendEvent('playing');
    }
  }

  /**
   * Pauses the audio playback.
   */
  public pause() {
    if (this.context.state === 'suspended')
      this.context.resume();
    if (this.track?.data?.state?.state === 'playing') {
      const nowMillis = this.context.currentTime * 1000;
      this.track.data.state.source.stop();
      this.track.data.state = {
        state: 'paused',
        positionMillis:
          (nowMillis - this.track.data.state.effectiveStartTimeMillis) *
          this._playbackRate
      };
      this.sendEvent('pause');
    }
  }

  /**
   * @returns a boolean that indicates whether the audio element is paused.
   */
  public get paused() {
    return this.track?.data?.state.state !== 'playing';
  }

  /**
   * Similar to
   * {@link @synesthesia-project/precise-audio.PreciseAudio.currentTime},
   * but returns the time in milliseconds rather than seconds.
   *
   * @returns The current playback time in milliseconds
   */
  public get currentTimeMillis() {
    if (this.track?.data) {
      if (this.track.data.state.state === 'paused') {
        return this.track.data.state.positionMillis;
      } else {
        const nowMillis = this.context.currentTime * 1000;
        return (nowMillis - this.track.data.state.effectiveStartTimeMillis) *
          this._playbackRate;
      }
    }
    return 0;
  }

  /**
   * The current playback time in seconds
   *
   * If the media is not yet playing,
   * the value of `currentTime` indicates the time position within the track
   * at which playback will begin once the
   * {@link @synesthesia-project/precise-audio.PreciseAudio.play}
   * method is called.
   *
   * @returns The current playback time in seconds
   */
  public get currentTime() {
    return this.currentTimeMillis / 1000;
  }

  public set currentTime(positionSeconds: number) {
    if (this.track?.data) {
      const positionMillis = positionSeconds * 1000;
      if (this.track.data.state.state === 'paused') {
        this.track.data.state.positionMillis = positionMillis;
      } else {
        this.track.data.state.source.stop();
        this.playFrom(positionMillis);
      }
      this.sendEvent('seeked');
    }
  }

  /*
   * Pause playback if neccesary,
   * make some adjustments to the configuration,
   * and then resume (if previously playing).
   *
   * This should be used when making a change to how you initialize the
   * web audio pipeline (e.g. changing the pitch).
   */
  private changeConfiguration(callback: () => void) {
    let resume = false;
    if (this.track?.data?.state.state === 'playing') {
      this.pause();
      resume = true;
    }
    callback();
    if (resume) {
      this.play();
    }
  }

  public set adjustPitchWithPlaybackRate(adjust: boolean) {
    this.changeConfiguration(() => {
      this._adjustPitchWithPlaybackRate = adjust;
    });
  }

  /**
   * Should this class attempt to adjust the pitch of the audio when changing
   * playback rate to compensate.
   *
   * This is the usual behaviour for `HTMLAudioElement`
   *
   * @default true
   *
   */
  public get adjustPitchWithPlaybackRate() {
    return this._adjustPitchWithPlaybackRate;
  }

  public set playbackRate(playbackRate: number) {
    this.changeConfiguration(() => {
      this._playbackRate = playbackRate;
    });
  }

  /**
   * @returns a number indicating the rate at which the media is being played back.
   */
  public get playbackRate() {
    return this._playbackRate;
  }

  /**
   * @returns The length of the currently loaded audio track in seconds
   */
  public get duration() {
    if (this.track?.data) {
      return this.track.data.buffer.duration;
    }
    return 0;
  }

  /**
   * @returns The length of the currently loaded audio track in milliseconds
   */
  public get durationMillis() {
    return this.duration * 1000;
  }

  /**
   * Fired when the user agent can play the media, and estimates that enough
   * data has been loaded to play the media up to its end without having to stop
   * for further buffering of content.
   *
   * Note: in contrast to `HTMLAudioElement`, `PreciseAudio` will always fire
   * this event at the same time as `canplaythrough` and `loadeddata`,
   * as all tracks are always fully preloaded.
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'canplay', listener: Listener): void;

  /**
   * Fired when the user agent can play the media, and estimates that enough
   * data has been loaded to play the media up to its end without having to stop
   * for further buffering of content.
   *
   * Note: in contrast to `HTMLAudioElement`, `PreciseAudio` will always fire
   * this event at the same time as `canplay` and `loadeddata`,
   * as all tracks are always fully preloaded.
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'canplaythrough', listener: Listener): void;

  /**
   * Fired when the first frame of the media has finished loading.
   *
   * Note: in contrast to `HTMLAudioElement`, `PreciseAudio` will always fire
   * this event at the same time as `canplay` and `canplaythrough`,
   * as all tracks are always fully preloaded.
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'loadeddata', listener: Listener): void;

  /**
   * Fired when the audio starts playing
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'playing', listener: Listener): void;

  /**
   * Fired when the audio is paused
   *
   * (Notably not fired when the audio is stopped
   * when a new file is being loaded)
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'pause', listener: Listener): void;

  /**
   * Fired when a seek operation completes
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'seeked', listener: Listener): void;

  public addEventListener(event: EventTypes, listener: Listener) {
    super.addEventListener(event, listener);
  }

  public removeEventListener(event: EventTypes, listener: Listener) {
    super.removeEventListener(event, listener);
  }

}
