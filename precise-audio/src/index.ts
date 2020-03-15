import { TrackState } from './data';
import { ErrorListener, EventTypes, Listener} from './events';
import * as playback from './playback';
import * as scheduling from './scheduling';
import { State } from './state';

/* tslint:disable:unified-signatures */

export { TrackState };

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

  private readonly state = new State(
    (eventType: EventTypes) => {
      const event = new PreciseAudioEvent(eventType, this);
      this.dispatchEvent(event);
    },
    (error: Error) => {
      const event = new ErrorEvent('error', {
        error
      });
      this.dispatchEvent(event);
    });

  /**
   * Change the currently playing track,
   * and the list of tracks that will play afterward.
   */
  public updateTracks(...tracks: Array<File | Blob | string>) {
    const [firstTrack, ...remaining] = tracks;
    const currentTrack = this.state.currentTrack();
    if (!firstTrack || currentTrack?.source !== firstTrack) {
      // Currently playing track needs updating
      playback.stopAllTracksWithoutEnding(this.state.tracks);
      this.state.tracks = [];
      if (firstTrack)
        this.state.tracks.push({
          source: firstTrack
        });
    }
    this.updateUpcomingTracks(...remaining);
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
    for (m = 0; m < followingSongs.length && m < this.state.tracks.length - 1; m++) {
      if (this.state.tracks[m + 1].source !== followingSongs[m])
        break;
    }
    const removed = this.state.tracks.splice(
      m + 1,
      this.state.tracks.length - m - 1,
      ...followingSongs.slice(m).map(source => ({ source }))
      );
    playback.stopAllTracksWithoutEnding(removed);
    scheduling.prepareUpcomingTracks(this.state);
  }

  /**
   * Get the list of tracks, including the currently playing track
   * and all tracks that are queued up to play afterward.
   */
  public tracks(): Array<File | Blob | string> {
    return this.state.tracks.map(t => t.source);
  }

  /**
   * Get the download and decode status of every track that is to be played,
   * including the current one.
   */
  public trackStates() {
    return this.state.tracks.map<TrackState>(track => {
      const src = track.source;
      if (!track.data) {
        if (track.timeouts?.downloadScheduledAt) {
          return {
            src,
            state: 'download-scheduled',
            downloadingAt: track.timeouts.downloadScheduledAt
          };
        } else {
          return { src, state: 'none' };
        }
      } else {
        if (track.data.state === 'downloaded' &&
            track.timeouts?.decodeScheduledAt) {
          return {
            src,
            state: 'decoding-scheduled',
            decodingAt: track.timeouts.decodeScheduledAt
          };
        } else if(track.data.state === 'error') {
          return {
            src,
            state: 'error',
            error: track.data.error
          };
        } else {
          return {
            src,
            state: track.data.state
          };
        }
      }
    })
  }

  /**
   * Configuration options for different thresholds for gapless playback,
   * this property can't be reassigned, but the properties of the object
   * it returns can be.
   *
   * @readonly
   */
  public get thresholds() {
    return this.state.thresholds;
  }

  private updateGain() {
    this.state.gainNode.gain.value =
      this.state.volume.muted ? 0 : this.state.volume.volume;
  }

  /**
   * @returns a double indicating the audio volume,
   * from 0.0 (silent) to 1.0 (loudest).
   */
  public get volume() {
    return this.state.volume.volume;
  }

  public set volume(volume: number) {
    const v = Math.max(0, Math.min(1, volume));
    if (v !== this.state.volume.volume) {
      this.state.volume.volume = v;
      this.updateGain();
      this.state.sendEvent('volumechange');
    }
  }

  /**
   * @returns A Boolean that determines whether audio is muted.
   * `true` if the audio is muted and `false` otherwise.
   */
  public get muted() {
    return this.state.volume.muted;
  }

  public set muted(muted: boolean) {
    if (muted !== this.state.volume.muted) {
      this.state.volume.muted = muted;
      this.updateGain();
      this.state.sendEvent('volumechange');
    }
  }

  /**
   * @returns the URL of the track to play
   */
  public get src(): string {
    const track = this.state.currentTrack()
    return typeof track?.source === 'string' && track.source || '';
  }

  public set src(source: string) {
    this.updateTracks(source);
  }

  /**
   * Begin playback of the audio.
   */
  public async play(suppressEvent?: boolean) {
    if (this.state.context.state === 'suspended')
      this.state.context.resume();
    const track = this.state.currentTrack();
    if (track) {
      if (track.data?.state === 'ready') {
        if(track.data.playState.state === 'paused') {
          playback.playCurrentTrackFrom(
            this.state, track.data.playState.positionMillis);
          if (!suppressEvent)
            this.state.sendEvent('play');
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
    if (this.state.context.state === 'suspended')
      this.state.context.resume();
    const track = this.state.currentTrack();
    if (track?.data?.state === 'ready' &&
        track.data.playState.state === 'playing') {
      const nowMillis = this.state.context.currentTime * 1000;
      const positionMillis =
      (nowMillis - track.data.playState.effectiveStartTimeMillis) *
        this.state.playbackRate
      playback.stopAllTracksWithoutEnding(this.state.tracks, positionMillis);
      if (!suppressEvent)
        this.state.sendEvent('pause');
    }
    scheduling.prepareUpcomingTracks(this.state);
  }

  /**
   * @returns a boolean that indicates whether the audio element is paused.
   */
  public get paused() {
    return this.state.paused();
  }

  /**
   * Similar to
   * {@link @synesthesia-project/precise-audio.PreciseAudio.currentTime},
   * but returns the time in milliseconds rather than seconds.
   *
   * @returns The current playback time in milliseconds
   */
  public get currentTimeMillis() {
    const track = this.state.currentTrack();
    if (track?.data?.state === 'ready') {
      if (track.data.playState.state === 'paused') {
        return track.data.playState.positionMillis;
      } else {
        const nowMillis = this.state.context.currentTime * 1000;
        return (nowMillis - track.data.playState.effectiveStartTimeMillis) *
          this.state.playbackRate;
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
    const track = this.state.currentTrack();
    if (track?.data?.state === 'ready') {
      const positionMillis = positionSeconds * 1000;
      if (track.data.playState.state === 'paused') {
        track.data.playState.positionMillis = positionMillis;
        this.state.sendEvent('timeupdate');
      } else {
        playback.playCurrentTrackFrom(this.state, positionMillis);
      }
      this.state.sendEvent('seeked');
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
      this.state.adjustPitchWithPlaybackRate = adjust;
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
    return this.state.adjustPitchWithPlaybackRate;
  }

  public set playbackRate(playbackRate: number) {
    this.changeConfiguration(() => {
      this.state.playbackRate = playbackRate;
    });
    this.state.sendEvent('ratechange');
  }

  /**
   * @returns a number indicating the rate at which the media is being played back.
   */
  public get playbackRate() {
    return this.state.playbackRate;
  }

  /**
   * @returns The length of the currently loaded audio track in seconds
   */
  public get duration() {
    const track = this.state.currentTrack();
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

  /**
   * Fired when the state of any of the enqueued tracks has changed.
   *
   * I.E: called whenever the returned value from `trackStatuses()`
   * will be different.
   *
   * @param listener an [EventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
   *                 that expects a {@link @synesthesia-project/precise-audio.PreciseAudioEvent}
   *                 as a parameter
   */
  public addEventListener(event: 'trackstateupdate', listener: Listener): void;

  public addEventListener(event: EventTypes, listener: Listener | ErrorListener) {
    super.addEventListener(event, listener as any);
  }

  public removeEventListener(event: EventTypes, listener: Listener | ErrorListener) {
    super.removeEventListener(event, listener as any);
  }

}
