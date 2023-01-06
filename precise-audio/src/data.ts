import { Metadata } from '@synesthesia-project/gapless-meta';

type PlayStatePlayingBase = {
  state: 'playing';
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

export type PlayStatePlaying = PlayStatePlayingBase & {
  source: AudioBufferSourceNode;
  suppressEndedEvent: boolean;
};

type PlayStatePaused = {
  state: 'paused';
  positionMillis: number;
};

type PlayState = PlayStatePaused | PlayStatePlaying;

export type PlayStateBasic = Readonly<PlayStatePaused | PlayStatePlayingBase>;

export type TrackSource = string | File | Blob;

export type TrackDataModeFull = {
  /**
   * The audio file has been decoded and is ready for immediate playback.
   */
  mode: 'full';
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

export type TrackDataModeBasic = {
  /**
   * The audio file was too big to download and decode fully,
   * so an HTMLAudioElement is being used instead.
   *
   * Gapless playback and precise timing is unavailable for this track.
   */
  mode: 'basic';
  audio: HTMLAudioElement;
  suppressEndedEvent?: true;
  /**
   * If set, the current audio track is scheduled to start playing.
   */
  scheduled?: {
    /** The timeout returned by setTimeout */
    timeout: number;
    /**
     * The time (in the AudioContext's time coordinate system) that the timeout
     * will approximately execute, and playback begin.
     */
    startTime: number;
  };
};

export type TrackDataReady = {
  /**
   * The track has either been fully loaded,
   * or it is ready using an HTMLAudioELement
   */
  state: 'ready';
} & (TrackDataModeFull | TrackDataModeBasic);

export type Track = {
  source: TrackSource;
  /**
   * Timers scheduled to trigger downloads or decoding for this track
   */
  timeouts?: {
    download?: number;
    downloadScheduledAt?: number;
    decode?: number;
    decodeScheduledAt?: number;
  };
  /**
   * If set, we need to start playing as soon as the track has loaded,
   * and call the given callback.
   */
  playOnLoad?: {
    callback: () => void;
    promise: Promise<void>;
  };
  data?:
    | {
        /**
         * We are determining the playtime of the track using an Audio element
         * before fully downloading / loading all bytes into memory.
         */
        state: 'preparing-download';
      }
    | {
        /**
         * The file is downloading / being loaded
         */
        state: 'downloading';
        /**
         * Total duration of the track in seconds
         */
        duration: number;
      }
    | {
        /**
         * The file has been downloaded, and metadata parsed,
         * but not decoded
         */
        state: 'downloaded';
        /**
         * Total duration of the track in seconds
         */
        duration: number;
        /**
         * The raw contents of the audio file
         */
        bytes: ArrayBuffer;
        /**
         * The metadata of the file, parsed by `@synesthesia-project/gapless-meta`
         */
        meta: Metadata | null;
      }
    | {
        /**
         * The audio file is in the process of having it's audio decoded.
         */
        state: 'decoding';
        /**
         * Total duration of the track in seconds
         */
        duration: number;
        /**
         * The metadata of the file, parsed by `@synesthesia-project/gapless-meta`
         */
        meta: Metadata | null;
      }
    | TrackDataReady
    | {
        /**
         * An error ocurred with downloading or decoding the track.
         */
        state: 'error';
        error: Error;
      };
};

/**
 * Status representing the current load state of various tracks
 */
export type TrackState = {
  src: string | File | Blob;
} & (
  | {
      state:
        | 'none'
        | 'idle'
        | 'preparing-download'
        | 'downloading'
        | 'downloaded'
        | 'decoding';
    }
  | {
      state: 'download-scheduled';
      /**
       * The timestamp (in the same time coordinate system as `performance.now()`)
       * at which downloading will begin for this file
       */
      downloadingAt: number;
    }
  | {
      state: 'decoding-scheduled';
      /**
       * The timestamp (in the same time coordinate system as `performance.now()`)
       * at which this file will be decoded
       */
      decodingAt: number;
    }
  | {
      state: 'ready';
      /**
       * Property detailing whether the track has been fully decoded and loaded
       * into memory (`"full"` mode),
       * or if an HTMLAudioElement is being used instead (`"basic"` mode).
       * Precise scrubbing, and gapless playback is only available for tracks
       * that have been loaded in `full` mode.
       * Tracks that are longer than the `basicModeThresholdSeconds` threshold
       * will be loaded in `basic` mode.
       */
      mode: 'basic' | 'full';
    }
  | {
      state: 'error';
      error: Error;
    }
);
