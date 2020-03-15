import { Track } from './data';
import { EventTypes } from './events';
import { Thresholds } from './tresholds';
import { getPlayState } from './playback';

function strictArrayGet<T>(arr: T[], i: number): T | undefined {
  return arr[i];
}

export class State {
  public readonly context: AudioContext;
  public readonly gainNode: GainNode;
  public animationFrameRequest: null | number = null;
  /**
   * Playback rate for the current queue of tracks
   */
  public playbackRate = 1;
  public defaultPlaybackRate = 1;
  public adjustPitchWithPlaybackRate = true;
  public readonly volume = {
    volume: 1,
    muted: false
  };
  public tracks: Track[] = [];
  public readonly thresholds: Thresholds = {
    basicModeThresholdSeconds: 1,
    downloadThresholdSeconds: 10,
    decodeThresholdSeconds: 2
  };
  /**
   * Dispatch the given event to listeners
   */
  public readonly sendEvent: (event: EventTypes) => void;
  public readonly dispatchError: (error: Error) => void;

  public constructor(
      sendEvent: (event: EventTypes) => void,
      dispatchError: (error: Error) => void) {
    this.context = new AudioContext();
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
    this.sendEvent = sendEvent;
    this.dispatchError = dispatchError;
  }

  public currentTrack() {
    return strictArrayGet(this.tracks, 0);
  }

  public paused() {
    const track = this.currentTrack();
    return track?.data?.state !== 'ready' ||
      getPlayState(this, track.data).state === 'paused';
  }
}
