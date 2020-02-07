/* tslint:disable:unified-signatures */

type PlayState =
  {
    state: 'paused',
    positionMillis: number
  } |
  {
    state: 'playing',
    source: AudioBufferSourceNode,
    effectiveStartTimeMillis: number
  };

type Listener = EventListener | EventListenerObject | null;

type EventTypes = 'playing' | 'pause' | 'seeked';

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
 */
export default class PreciseAudio extends EventTarget {

  private readonly context = new AudioContext();
  private song: {
    buffer: AudioBuffer;
    state: PlayState;
  } | null = null;

  private loadFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
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
   *             object representing the audio file to be played,
   *             generally retrieved from a
   *             [FileList](https://developer.mozilla.org/en-US/docs/Web/API/FileList)
   *             object.
   * @returns A [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
   *          that resolves once the audio file has been successfully loaded.
   */
  public async loadAudioFile(file: File) {
    if (this.song?.state.state === 'playing') {
      this.song.state.source.stop();
    }
    const fileBuffer = await this.loadFile(file);
    const buffer = await this.context.decodeAudioData(fileBuffer);
    this.song = {
      buffer,
      state: {
        state: 'paused', positionMillis: 0
      }
    };
  }

  private playFrom(positionMillis: number) {
    if (this.song) {
      const nowMillis = this.context.currentTime * 1000;
      const source = this.context.createBufferSource();
      source.connect(this.context.destination);
      source.buffer = this.song.buffer;
      source.start(0, positionMillis / 1000);
      this.song.state = {
        state: 'playing',
        source,
        effectiveStartTimeMillis: nowMillis - positionMillis
      };
    }
  }

  /**
   * Begins playback of the audio.
   */
  public play() {
    if (this.context.state === 'suspended')
      this.context.resume();
    if (this.song && this.song.state.state === 'paused') {
      this.playFrom(this.song.state.positionMillis);
      this.sendEvent('playing');
    }
  }

  /**
   * Pauses the audio playback.
   */
  public pause() {
    if (this.context.state === 'suspended')
      this.context.resume();
    if (this.song && this.song.state.state === 'playing') {
      const nowMillis = this.context.currentTime * 1000;
      this.song.state.source.stop();
      this.song.state = {
        state: 'paused',
        positionMillis: nowMillis - this.song.state.effectiveStartTimeMillis
      };
      this.sendEvent('pause');
    }
  }

  /**
   * @returns a boolean that indicates whether the audio element is paused.
   */
  public get paused() {
    return this.song?.state.state === 'paused';
  }

  /**
   * Similar to
   * {@link @synesthesia-project/precise-audio.PreciseAudio.currentTime},
   * but returns the time in milliseconds rather than seconds.
   *
   * @returns The current playback time in milliseconds
   */
  public get currentTimeMillis() {
    if (this.song) {
      if (this.song.state.state === 'paused') {
        return this.song.state.positionMillis;
      } else {
        const nowMillis = this.context.currentTime * 1000;
        return nowMillis - this.song.state.effectiveStartTimeMillis;
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
    if (this.song) {
      const positionMillis = positionSeconds * 1000;
      if (this.song.state.state === 'paused') {
        this.song.state.positionMillis = positionMillis;
      } else {
        this.song.state.source.stop();
        this.playFrom(positionMillis);
      }
      this.sendEvent('seeked');
    }
  }

  public set playbackRate(_playbackRate: number) {
    // TODO
  }

  /**
   * @returns a number indicating the rate at which the media is being played back.
   */
  public get playbackRate() {
    // TODO
    return 1;
  }

  /**
   * @returns The length of the currently loaded audio track in seconds
   */
  public get duration() {
    if (this.song) {
      return this.song.buffer.duration;
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
