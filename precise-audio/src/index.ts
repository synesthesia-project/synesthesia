import PitchShift = require('soundbank-pitch-shift');
import getMetadata, {Metadata} from '@synesthesia-project/gapless-meta';

/* tslint:disable:unified-signatures */

type PlayStatePlaying = {
  state: 'playing';
  source: AudioBufferSourceNode;
  suppressEndedEvent: boolean;
  /**
   * Millisecond timestamp (based on the AudioContext clock) that the song
   * started playing at the current playback rate
   */
  effectiveStartTimeMillis: number;
  /**
   * The exact time (in the AudioBuffer's time coordinate system) that the song
   * will stop playing,
   * taking into account gapless padding at the song.
   *
   * (Used for accurately scheduling follow-up tracks).
   *
   * Note: this will change if the track is paused,
   * or if the track position of playback speed changes.
   *
   * If no gapless metadata is available,
   * the padding is assumed to be `0`.
   */
  stopTime: number;
};

type PlayState =
  {
    state: 'paused';
    positionMillis: number;
  } | PlayStatePlaying;

type Listener = EventListener | EventListenerObject | null;

type ErrorListener = (err: ErrorEvent) => void;

type EventTypes =
    'canplay'
  | 'canplaythrough'
  | 'ended'
  | 'error'
  | 'loadeddata'
  // The next track has started playing
  | 'next'
  | 'play'
  | 'pause'
  | 'ratechange'
  | 'seeked'
  | 'timeupdate'
  | 'volumechange';

type TrackSource = string | File | Blob;

type TrackDataReady = {
  /**
   * The audio file has been decoded and is ready for immediate playback.
   */
  state: 'ready';
  /**
   * The metadata of the file, parsed by `@synesthesia-project/gapless-meta`
   */
  meta: Metadata | null;
  /**
   * The decoded audio
   */
  buffer: AudioBuffer;
  playState: PlayState;
};

type Track = {
  source: TrackSource;
  /**
   * If set, we need to start playing as soon as the track has loaded,
   * and call the given callback.
   */
  playOnLoad?: {
    callback: () => void;
    promise: Promise<void>;
  }
  data?:
  {
    /**
     * The file is downloading / being loaded
     */
    state: 'downloading';
  } |
  {
    /**
     * The file has been downloaded, and metadata parsed,
     * but not decoded
     */
    state: 'downloaded';
    /**
     * The raw contents of the audio file
     */
    bytes: ArrayBuffer;
    /**
     * The metadata of the file, parsed by `@synesthesia-project/gapless-meta`
     */
    meta: Metadata | null;
  } |
  {
    /**
     * The audio file is in the process of having it's audio decoded.
     */
    state: 'decoding';
    /**
     * The metadata of the file, parsed by `@synesthesia-project/gapless-meta`
     */
    meta: Metadata | null;
  } |
  TrackDataReady |
  {
    /**
     * An error ocurred with downloading or decoding the track.
     */
    state: 'error';
    error: Error;
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

function strictArrayGet<T>(arr: T[], i: number): T | undefined {
  return arr[i];
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

  private readonly context: AudioContext;
  private readonly gainNode: GainNode;
  private _animationFrameRequest: null | number = null;
  private _playbackRate = 1;
  private _adjustPitchWithPlaybackRate = true;
  private readonly _volume = {
    volume: 1,
    muted: false
  };
  private _tracks: Track[] = [];

  public constructor() {
    super();
    this.context = new AudioContext();
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
  }

  private currentTrack() {
    return strictArrayGet(this._tracks, 0);
  }

  private updateGain() {
    this.gainNode.gain.value = this._volume.muted ? 0 : this._volume.volume;
  }

  private sendEvent(eventType: EventTypes) {
    const event = new PreciseAudioEvent(eventType, this);
    this.dispatchEvent(event);
  }

  private dispatchError(error: Error) {
    const event = new ErrorEvent('error', {
      error
    });
    this.dispatchEvent(event);
  }

  private stopWithoutEnding(state: PlayStatePlaying) {
    state.suppressEndedEvent = true;
    state.source.stop();
  }

  /**
   * Used with requestAnimationFrame to dispatch timeupdate events
   */
  private timeUpdated = () => {
    this.sendEvent('timeupdate');
    const track = this.currentTrack();
    if (track?.data?.state === 'ready' &&
        track.data.playState.state === 'playing') {
      this.scheduleTimeUpdated();
    }
  }

  private scheduleTimeUpdated() {
    if (this._animationFrameRequest !== null)
      cancelAnimationFrame(this._animationFrameRequest);
    this._animationFrameRequest = requestAnimationFrame(this.timeUpdated);
  }

  /**
   * Create a listener that should get called when the currently playing track
   * has ended
   *
   * @param track - the track that should be playing
   */
  private createTrackEndedListener(state: PlayStatePlaying) {
    return () => {
      const track = this.currentTrack();
      // Check if current track is loaded and expected track
      if (track?.data?.state !== 'ready' || track.data.playState !== state)
        return;
      if (state.state === 'playing' && !state.suppressEndedEvent) {
        if (this._tracks.length === 1) {
          // If there are no following tracks,
          // keep the last track, and moe the cursor to the beginning
          track.data.playState = {
            state: 'paused',
            positionMillis: 0
          };
          this.sendEvent('ended');
        } else {
          this._tracks = this._tracks.slice(1);
          this.sendEvent('next');
        }
      }
    };
  }

  /**
   * Read and load a new audio file.
   *
   * The loaded audio file will be paused once it's loaded,
   * and will not play automatically.
   *
   * @param source A [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File),
   *               [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
   *               or `string` URL representing the audio file to be played.
   *
   *               If a `string` is used, the class will attempt to load the
   *               file using the fetch API.
   * @returns A [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
   *          that resolves once the audio file has been successfully loaded.
   */
  public loadTrack(source: File | Blob | string) {
    const currentTrack = this.currentTrack();
    if (currentTrack?.data?.state === 'ready' &&
      currentTrack.data.playState.state === 'playing') {
      this.stopWithoutEnding(currentTrack.data.playState);
    }
    if (source === '') {
      this._tracks = [];
      return;
    }
    const track: Track = { source };
    this._tracks = [track];
    this.prepareUpcomingTracks();
  }

  /**
   * Change the currently playing song,
   * and the list of songs that will play afterward.
   */
  public updateTracks(...tracks: Array<File | Blob | string>) {
    const firstTrack = tracks.length > 0 ? tracks[0] : null;
    const currentTrack = this.currentTrack();
    if (!firstTrack || currentTrack?.source !== firstTrack) {
      // Currently playing track needs updating
      if (currentTrack?.data?.state === 'ready' &&
          currentTrack.data.playState.state === 'playing') {
        this.stopWithoutEnding(currentTrack.data.playState);
      }
      this._tracks = [];
      if (firstTrack)
        this._tracks.push({
          source: firstTrack
        });
    }
    this.updateUpcomingTracks(...tracks.slice(1));
  }

  /**
   * Update the list of songs that will play after the current song.
   */
  public updateUpcomingTracks(...followingSongs: Array<File | Blob | string>) {
    /* Update the list of tracks without changing the songs at the start of the
     * list that are unchanged,to avoid uneccesary loading and potential delays.
     */
    /**
     * The iteration variable & partition point.
     * At the end of the loop, it will be equal to the number of tracks in
     */
    let m: number;
    for (m = 0; m < followingSongs.length && m < this._tracks.length - 1; m++) {
      if (this._tracks[m + 1].source !== followingSongs[m])
        break;
    }
    this._tracks.splice(
      m + 1,
      this._tracks.length - m - 1,
      ...followingSongs.map(source => ({ source }))
      );
    this.prepareUpcomingTracks();
  }

  /**
   * Get the list of tracks, including the currently playing track
   * and all tracks that are queued up to play afterward.
   */
  public tracks(): Array<File | Blob | string> {
    return this._tracks.map(t => t.source);
  }

  /**
   * Called whenever we may need to download, decode or schedule any upcoming
   * tracks
   */
  private prepareUpcomingTracks() {
    // TODO: only load tracks within specific timeframe of required playback
    let trackPlayingState: PlayStatePlaying | null = null;
    for (let i = 0; i < this._tracks.length; i++) {
      const previousTrackPlayingState = trackPlayingState;
      trackPlayingState = null;
      const track = this._tracks[i];

      // TODO: set to true only when within thresholds
      const withinDownloadThreashold = true;
      const withinDecodeThreshold = true;

      if (!track.data) {

        // Track is not downloaded, do we need to download it?

        if (i === 0 || withinDownloadThreashold) {
          let download: Promise<Blob | File>;
          // Fetch the file if neccesary
          if (typeof track.source === 'string') {
            download = fetch(track.source).then(r => r.blob());
          } else {
            download = Promise.resolve(track.source);
          }
          const promise = download.then(file =>
            new Promise<ArrayBuffer>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = ev => {
                resolve(ev.target?.result as ArrayBuffer);
              };
              reader.onerror = () => {
                reader.abort();
                reject(reader.error);
              };
              reader.readAsArrayBuffer(file);
            })
          );
          track.data = {
            state: 'downloading'
          };
          promise.then(bytes => {
            track.data = {
              state: 'downloaded',
              bytes,
              meta: getMetadata(bytes)
            };
            this.prepareUpcomingTracks();
          }).catch(error => {
            track.data = {
              state: 'error',
              error
            };
            this.dispatchError(error);
          });
        }

      } else if(track.data.state === 'downloaded') {

        // Track is not decoded, do we need to decode it?

        if (i === 0 || withinDecodeThreshold) {
          const bytes = track.data.bytes;
          const meta = track.data.meta;
          track.data = {
            state: 'decoding',
            meta: meta
          };
          this.context.decodeAudioData(bytes).then(buffer => {
            track.data = {
              state: 'ready',
              buffer,
              meta,
              playState: {
                state: 'paused', positionMillis: 0
              }
            }
            if (this._tracks[0] === track) {
              // If this is the current track,
              // Trigger relevant events
              this.sendEvent('loadeddata');
              this.sendEvent('canplay');
              this.sendEvent('canplaythrough');
              this.sendEvent('timeupdate');
            }
            this.prepareUpcomingTracks();
          }).catch(error => {
            track.data = {
              state: 'error',
              error
            };
            this.dispatchError(error);
          });;
        }
      } else if(track.data.state === 'ready') {

        if (track.data.playState.state === 'paused') {
          // Track is ready and paused, do we need to schedule it to play?

          if (i === 0 && track.playOnLoad) {
            this.playFrom(0, true);
            this.sendEvent('play');
            track.playOnLoad.callback();
          }

          if (i > 0 && previousTrackPlayingState) {
            // previous track is playing, let's enqueue  next track
            this.scheduleTrack(
              previousTrackPlayingState.stopTime,
              track.data,
              0
            );
          }
        }

        // If the track is currently playing, or has been changed to playing
        // update previousTrackPlayingState
        if (track.data.playState.state === 'playing') {
          trackPlayingState = track.data.playState;
        }
      }
    }
  }

  /**
   * @returns a double indicating the audio volume,
   * from 0.0 (silent) to 1.0 (loudest).
   */
  public get volume() {
    return this._volume.volume;
  }

  public set volume(volume: number) {
    const v = Math.max(0, Math.min(1, volume));
    if (v !== this._volume.volume) {
      this._volume.volume = v;
      this.updateGain();
      this.sendEvent('volumechange');
    }
  }

  /**
   * @returns A Boolean that determines whether audio is muted.
   * `true` if the audio is muted and `false` otherwise.
   */
  public get muted() {
    return this._volume.muted;
  }

  public set muted(muted: boolean) {
    if (muted !== this._volume.muted) {
      this._volume.muted = muted;
      this.updateGain();
      this.sendEvent('volumechange');
    }
  }

  /**
   * @returns the URL of the track to play
   */
  public get src(): string {
    const track = this.currentTrack()
    return typeof track?.source === 'string' && track.source || '';
  }

  public set src(source: string) {
    this.loadTrack(source);
  }

  /**
   * Play the current song from the given timestamp.
   * And cancel the scheduling of any upcoming songs.
   *
   * @param dontPrepareUpcomingTracks Set to `true` when being called from
   * `this.prepareUpcomingTracks()`, to avoid calling the callee uneccesarily.
   */
  private playFrom(positionMillis: number, dontPrepareUpcomingTracks?: true) {
    // Play with a little delay
    const track = this.currentTrack();
    if (track && track.data?.state === 'ready') {
      const startTime = this.context.currentTime + 0.05;
      this.scheduleTrack(startTime, track.data, positionMillis);
      // Deschedule any following tracks
      for (let i = 1; i < this._tracks.length; i++) {
        const track = this._tracks[i];
        if (track?.data?.state === 'ready' &&
          track.data.playState.state === 'playing') {
          this.stopWithoutEnding(track.data.playState);
          track.data.playState = {
            state: 'paused', positionMillis: 0
          };
        }
      }
    }
    if (!dontPrepareUpcomingTracks) {
      this.prepareUpcomingTracks();
    }
  }

  /**
   * Schedule the given track to play at a specific time
   * in the time coordinate system of the audio context (`this.context`).
   *
   * **TODO:**
   * This function takes into account gapless timing information,
   * and skips the encoder delay so that the original audio begins playing at
   * the specified time.
   *
   * @param startTime the time, in seconds, relative to the time coordinate
   *                  system of the audio context,
   *                  that the audio should begin to play.
   * @param trackData the `data` property of the track that needs to be played.
   * @param positionMillis the position within the track that playback should
   *                       begin from, in milliseconds.
   *                       `0` is the start of the track.
   */
  private scheduleTrack(startTime: number, trackData: TrackDataReady, positionMillis: number) {
    const source = this.context.createBufferSource();
    source.playbackRate.value = this._playbackRate;
    if (this._playbackRate !== 1 && this._adjustPitchWithPlaybackRate) {
      const pitchShift = PitchShift(this.context);
      pitchShift.connect(this.gainNode);
      // Calculate the notes (in 100 cents) to shift the pitch by
      // based on the frequency ration
      pitchShift.transpose = 12 * Math.log2(1 / this._playbackRate);
      source.connect(pitchShift);
    } else {
      source.connect(this.gainNode);
    }
    source.buffer = trackData.buffer;
    const gaps = {
      paddingStartSeconds: 0,
      paddingEndSeconds: 0
    };
    // Get gapless information if available
    if (trackData.meta?.vbrInfo?.numberOfFrames && trackData.meta.lameInfo) {
      const samples = trackData.meta.samplesPerFrame *
        trackData.meta.vbrInfo.numberOfFrames;
      const realSamples =
        samples -
        trackData.meta.lameInfo.paddingStart -
        trackData.meta.lameInfo.paddingEnd;
      if (trackData.buffer.length === realSamples) {
        console.log('Loaded track already gapless');
      } else if (trackData.buffer.length === samples) {
        gaps.paddingStartSeconds =
          1 / trackData.meta.sampleRate * trackData.meta.lameInfo.paddingStart;
        gaps.paddingEndSeconds =
          1 / trackData.meta.sampleRate * trackData.meta.lameInfo.paddingEnd;
        console.log('Adjusting for gapless playback');
      } else {
        console.log('Mismatch between gapless metadata and loaded audio');
      }
    } else {
      console.log('Unable to get gapless metadata from track', trackData.meta);
    }
    const stopTime =
      startTime +
      trackData.buffer.duration -
      gaps.paddingStartSeconds -
      gaps.paddingEndSeconds;
    source.start(startTime, positionMillis / 1000 + gaps.paddingStartSeconds);
    trackData.playState = {
      state: 'playing',
      suppressEndedEvent: false,
      source,
      effectiveStartTimeMillis:
        startTime * 1000 - positionMillis / this._playbackRate,
      stopTime
    };
    source.addEventListener('ended',
      this.createTrackEndedListener(trackData.playState));
  }

  /**
   * Begin playback of the audio.
   */
  public async play(suppressEvent?: boolean) {
    if (this.context.state === 'suspended')
      this.context.resume();
    const track = this.currentTrack();
    if (track) {
      if (track.data?.state === 'ready') {
        if(track.data.playState.state === 'paused') {
          this.playFrom(track.data.playState.positionMillis);
          if (!suppressEvent)
            this.sendEvent('play');
        }
      } else {
        // Track hasn't loaded yet
        // Create a promise and callback if neccesary
        if (track.playOnLoad) {
          return track.playOnLoad.promise;
        } else {
          let callback: (() => void) | null = null;
          const promise = new Promise<void>(resolve => {
            callback = resolve;
          });
          if (callback) {
            track.playOnLoad = {
              callback, promise
            };
          }
          return promise;
        }
      }
    }
  }

  /**
   * Pauses the audio playback.
   */
  public pause(suppressEvent?: boolean) {
    if (this.context.state === 'suspended')
      this.context.resume();
    const track = this.currentTrack();
    if (track?.data?.state === 'ready' &&
        track.data.playState.state === 'playing') {
      const nowMillis = this.context.currentTime * 1000;
      this.stopWithoutEnding(track.data.playState);
      track.data.playState = {
        state: 'paused',
        positionMillis:
          (nowMillis - track.data.playState.effectiveStartTimeMillis) *
          this._playbackRate
      };
      if (!suppressEvent)
        this.sendEvent('pause');
    }
  }

  /**
   * @returns a boolean that indicates whether the audio element is paused.
   */
  public get paused() {
    const track = this.currentTrack();
    return track?.data?.state !== 'ready' ||
      track.data.playState.state !== 'playing';
  }

  /**
   * Similar to
   * {@link @synesthesia-project/precise-audio.PreciseAudio.currentTime},
   * but returns the time in milliseconds rather than seconds.
   *
   * @returns The current playback time in milliseconds
   */
  public get currentTimeMillis() {
    const track = this.currentTrack();
    if (track?.data?.state === 'ready') {
      if (track.data.playState.state === 'paused') {
        return track.data.playState.positionMillis;
      } else {
        const nowMillis = this.context.currentTime * 1000;
        return (nowMillis - track.data.playState.effectiveStartTimeMillis) *
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
    const track = this.currentTrack();
    if (track?.data?.state === 'ready') {
      const positionMillis = positionSeconds * 1000;
      if (track.data.playState.state === 'paused') {
        track.data.playState.positionMillis = positionMillis;
        this.sendEvent('timeupdate');
      } else {
        this.stopWithoutEnding(track.data.playState);
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
    if (!this.paused) {
      this.pause(true);
      resume = true;
    }
    callback();
    if (resume) {
      this.play(true);
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
    this.sendEvent('ratechange');
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
    const track = this.currentTrack();
    if (track?.data?.state === 'ready') {
      return track.data.buffer.duration;
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
   * Sets the ID of the audio device to use for output and returns a `Promise`.
   * This only works when the application is authorized to use
   * the specified device.
   *
   * *Note: this is currently not implemented in PreciseAudio*
   *
   * @param sinkId The
   * [`MediaDeviceInfo.deviceId`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo/deviceId)
   * of the audio output device.
   */
  public async setSinkId(sinkId: string) {
    throw new Error('Not implemented: ' + sinkId);
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
   * Fired when playback stops when end of the track is reached
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'ended', listener: Listener): void;

  /**
   * Fired when the track could not be loaded due to an error.
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'error', listener: ErrorListener): void;

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
   * Fired when the the next song has started playing (gaplessly).
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'next', listener: Listener): void;

  /**
   * Fired when the audio starts playing
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'play', listener: Listener): void;

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

  /**
   * Fired when the time indicated by the currentTime attribute has been updated
   *
   * Note: this happens continuously, so instead this class will just call this
   * at the framerate of the browser using requestAnimationFrame.
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'timeupdate', listener: Listener): void;

  /**
   * Fired when the volume has changed.
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'volumechange', listener: Listener): void;

  public addEventListener(event: EventTypes, listener: Listener | ErrorListener) {
    super.addEventListener(event, listener as any);
  }

  public removeEventListener(event: EventTypes, listener: Listener | ErrorListener) {
    super.removeEventListener(event, listener as any);
  }

}
