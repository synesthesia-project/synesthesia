import {Maybe, Either} from './functional';

export interface PlayStateControls {
  /**
   * Toggle Play / Pause
   */
  toggle(): void;
  pause(): void;
  goToTime(timeMillis: number): void;
}

export interface MediaPaused {
  /** Point in the media where we are paused, in milliseconds */
  timeMillis: number;
}

export interface MediaPlaying {
  /** Effective time when the media started playing, in milliseconds */
  effectiveStartTimeMillis: number;
}

export interface PlayStateDataOnly {
  /** Duration of the media in milliseconds */
  durationMillis: number;
  state: Either<MediaPaused, MediaPlaying>;
}

export interface PlayStateData extends PlayStateDataOnly {
  controls: PlayStateControls;
}

export type PlayState = Maybe<PlayStateData>;
