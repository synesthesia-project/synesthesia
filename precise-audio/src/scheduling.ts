import getMetadata from '@synesthesia-project/gapless-meta';

import { State } from './state';
import * as playback from './playback';

type ExpectedPlayingState = {
  stopTime: number;
  mode: 'full' | 'basic';
} | null;

/**
 * Download, decode or schedule the playback for any
 * upcoming tracks that require it.
 */
export function prepareUpcomingTracks(state: State) {
  const self = () => prepareUpcomingTracks(state);
  let changesMade = false;
  const now = state.context.currentTime;
  let trackExpectedPlayingState: ExpectedPlayingState = null;
  for (let i = 0; i < state.tracks.length; i++) {
    // Type annotation fix for: https://github.com/microsoft/TypeScript/issues/33191
    const previousTrackExpectedPlayingState: ExpectedPlayingState =
      trackExpectedPlayingState;
    trackExpectedPlayingState = null;
    const track = state.tracks[i];

    // Clear any previous timeouts for this track
    if (track.timeouts?.download) {
      clearTimeout(track.timeouts.download);
      changesMade = true;
    }
    if (track.timeouts?.decode) {
      clearTimeout(track.timeouts?.decode);
      changesMade = true;
    }
    track.timeouts = {};

    /**
     * How long is the previous track playing until,
     * if we don't yet know, this will be undefined.
     *
     * Type annotations are fix for:
     * https://github.com/microsoft/TypeScript/issues/33191
     */
    const playingUntil: number | undefined =
      i === 0
        ? now
        : (previousTrackExpectedPlayingState as ExpectedPlayingState)?.stopTime;

    // If we don't know when the previous song will be playing until,
    // there's nothing more we can do for this track.
    if (playingUntil === undefined) continue;

    const timeRemaining = playingUntil - now;
    const withinDownloadThreshold =
      i === 0 || timeRemaining < state.thresholds.downloadThresholdSeconds;
    const withinDecodeThreshold =
      i === 0 || timeRemaining < state.thresholds.decodeThresholdSeconds;

    // Schedule timers for preparing next tracks at thresholds
    // (with a few extra milliseconds)
    // (if playing)
    if (!state.paused()) {
      if (!withinDownloadThreshold) {
        const diff = timeRemaining - state.thresholds.downloadThresholdSeconds;
        const millis = Math.max(0, diff * 1000) + 10;
        track.timeouts.downloadScheduledAt = performance.now() + millis;
        track.timeouts.download = setTimeout(self, millis);
        changesMade = true;
      }
      if (!withinDecodeThreshold) {
        const diff = timeRemaining - state.thresholds.decodeThresholdSeconds;
        const millis = Math.max(0, diff * 1000) + 10;
        track.timeouts.decodeScheduledAt = performance.now() + millis;
        track.timeouts.decode = setTimeout(self, millis);
        changesMade = true;
      }
    }

    if (!track.data) {
      // Track is not downloaded, do we need to download it?

      if (withinDownloadThreshold) {
        track.data = {
          state: 'preparing-download',
        };
        changesMade = true;
        // Firstly, use an HTMLAudioElement to get the approximate duration
        // of the track
        type PlaybackMode =
          | {
              mode: 'basic';
              audio: HTMLAudioElement;
            }
          | {
              mode: 'full';
              duration: number;
            };
        const durationPromise = new Promise<PlaybackMode>((resolve, reject) => {
          const audio = new Audio();
          const src =
            typeof track.source === 'string'
              ? track.source
              : URL.createObjectURL(track.source);
          audio.src = src;
          audio.addEventListener('loadedmetadata', () => {
            const duration = audio.duration;
            const threshold = state.thresholds.basicModeThresholdSeconds;
            const useBasic =
              threshold === 'always' ||
              (threshold !== 'never' && threshold < duration);
            if (useBasic) {
              const node = state.context.createMediaElementSource(audio);
              node.connect(state.gainNode);
              resolve({ mode: 'basic', audio });
            } else {
              audio.src = '';
              if (typeof track.source !== 'string') URL.revokeObjectURL(src);
              resolve({ mode: 'full', duration });
            }
          });
          audio.addEventListener('error', (e) => {
            if (typeof track.source !== 'string') URL.revokeObjectURL(src);
            reject(e.error);
          });
        });
        durationPromise
          .then((playbackMode) => {
            if (playbackMode.mode === 'basic') {
              track.data = {
                state: 'ready',
                mode: 'basic',
                audio: playbackMode.audio,
              };
              state.sendEvent('trackstateupdate');
              self();
            } else {
              const { duration } = playbackMode;
              let download: Promise<Blob | File>;
              // Fetch the file if neccesary
              if (typeof track.source === 'string') {
                download = fetch(track.source).then((r) => r.blob());
              } else {
                download = Promise.resolve(track.source);
              }
              track.data = {
                state: 'downloading',
                duration,
              };
              state.sendEvent('trackstateupdate');
              return download.then((file) =>
                new Promise<ArrayBuffer>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    resolve(ev.target?.result as ArrayBuffer);
                  };
                  reader.onerror = () => {
                    reader.abort();
                    reject(reader.error);
                  };
                  reader.readAsArrayBuffer(file);
                }).then((bytes) => {
                  track.data = {
                    state: 'downloaded',
                    duration,
                    bytes,
                    meta: getMetadata(bytes),
                  };
                  state.sendEvent('trackstateupdate');
                  self();
                })
              );
            }
          })
          .catch((error) => {
            track.data = {
              state: 'error',
              error,
            };
            state.dispatchError(error);
            state.sendEvent('trackstateupdate');
          });
      }
    } else if (track.data.state === 'downloading') {
      // Set the current expected time to play until
      trackExpectedPlayingState = {
        mode: 'full',
        stopTime: playingUntil + track.data.duration,
      };
    } else if (track.data.state === 'downloaded') {
      // Set the current expected time to play until
      trackExpectedPlayingState = {
        mode: 'full',
        stopTime: playingUntil + track.data.duration,
      };

      // Track is not decoded, do we need to decode it?

      if (withinDecodeThreshold) {
        const bytes = track.data.bytes;
        const meta = track.data.meta;
        track.data = {
          state: 'decoding',
          duration: track.data.duration,
          meta,
        };
        changesMade = true;
        state.context
          .decodeAudioData(bytes)
          .then((buffer) => {
            track.data = {
              state: 'ready',
              mode: 'full',
              buffer,
              meta,
              playState: {
                state: 'paused',
                positionMillis: 0,
              },
            };
            state.sendEvent('trackstateupdate');
            if (state.tracks[0] === track) {
              // If this is the current track,
              // Trigger relevant events
              state.sendEvent('loadeddata');
              state.sendEvent('canplay');
              state.sendEvent('canplaythrough');
              state.sendEvent('timeupdate');
            }
            self();
          })
          .catch((error) => {
            track.data = {
              state: 'error',
              error,
            };
            state.dispatchError(error);
            state.sendEvent('trackstateupdate');
          });
      }
    } else if (track.data.state === 'ready') {
      /** Play state *before* possibly playing */
      const playState1 = playback.getPlayState(state, track.data);
      if (playState1.state === 'paused') {
        // Track is ready and paused, do we need to schedule it to play?

        if (i === 0 && track.playOnLoad) {
          playback.playCurrentTrackFrom(state, 0, true);
          state.sendEvent('play');
          track.playOnLoad.callback();
          track.playOnLoad = undefined;
        }

        if (
          i > 0 &&
          previousTrackExpectedPlayingState &&
          previousTrackExpectedPlayingState.mode === 'full'
        ) {
          // previous track is playing, let's enqueue next track
          // (but only if it's in full mode)
          playback.playTrack(
            state,
            previousTrackExpectedPlayingState.stopTime,
            track.data,
            0
          );
        }
      }

      // If the track is currently playing, or has been changed to playing
      // update previousTrackPlayingState
      /** Play state *after* possibly begining playback */
      const playState2 = playback.getPlayState(state, track.data);
      if (playState2.state === 'playing') {
        trackExpectedPlayingState = playState2;
      }
    }
  }

  if (changesMade) state.sendEvent('trackstateupdate');
}
