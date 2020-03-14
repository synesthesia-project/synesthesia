import PitchShift = require('soundbank-pitch-shift');

import { Track, PlayStatePlaying, TrackDataReady } from './data';
import { prepareUpcomingTracks } from './scheduling';
import { State } from './state';

/**
 * Play the current song from the given timestamp.
 * And cancel the scheduling of any upcoming songs.
 *
 * @param dontPrepareUpcomingTracks Set to `true` when being called from
 * `this.prepareUpcomingTracks()`, to avoid calling the callee uneccesarily.
 */
export function playCurrentTrackFrom(
    state: State, positionMillis: number, dontPrepareUpcomingTracks ?: true) {
  // Stop / Deschedule all currently playing tracks
  stopAllTracksWithoutEnding(state.tracks);
  // Play with a little delay
  const track = state.currentTrack();
  if (track && track.data?.state === 'ready') {
    const startTime = state.context.currentTime + 0.05;
    playTrack(state, startTime, track.data, positionMillis);
  }
  if (!dontPrepareUpcomingTracks) {
    prepareUpcomingTracks(state);
  }
  scheduleTimeUpdated(state);
}

/**
 * Schedule the given track to play at a specific time
 * in the time coordinate system of the audio context (`this.context`).
 *
 * @param startTime the time, in seconds, relative to the time coordinate
 *                  system of the audio context,
 *                  that the audio should begin to play.
 * @param trackData the `data` property of the track that needs to be played.
 * @param positionMillis the position within the track that playback should
 *                       begin from, in milliseconds.
 *                       `0` is the start of the track.
 */
export function playTrack(state: State, startTime: number, trackData: TrackDataReady, positionMillis: number) {
  const source = state.context.createBufferSource();
  source.playbackRate.value = state.playbackRate;
  if (state.playbackRate !== 1 && state.adjustPitchWithPlaybackRate) {
    const pitchShift = PitchShift(state.context);
    pitchShift.connect(state.gainNode);
    // Calculate the notes (in 100 cents) to shift the pitch by
    // based on the frequency ration
    pitchShift.transpose = 12 * Math.log2(1 / state.playbackRate);
    source.connect(pitchShift);
  } else {
    source.connect(state.gainNode);
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
    const paddingStartSeconds =
      1 / trackData.meta.sampleRate * trackData.meta.lameInfo.paddingStart;
    const paddingEndSeconds =
      1 / trackData.meta.sampleRate * trackData.meta.lameInfo.paddingEnd;
    if (trackData.buffer.length === realSamples) {
      console.log('Loaded track already gapless');
    } else if (trackData.buffer.length === samples) {
      gaps.paddingStartSeconds = paddingStartSeconds;
      gaps.paddingEndSeconds = paddingEndSeconds;
      console.log('Adjusting for gapless playback');
    } else if (trackData.buffer.length === samples + 1152) {
      // For some reason, firefox seems to add an additional 1152 samples of
      // padding to the encoded track.
      gaps.paddingStartSeconds =
        paddingStartSeconds + 1 / trackData.meta.sampleRate * 576;
      gaps.paddingEndSeconds =
        paddingEndSeconds + 1 / trackData.meta.sampleRate * 576;
      console.log('Adjusting for gapless playback, with additional 1152 samples');
    } else {
      console.log(
        'Mismatch between gapless metadata and loaded audio, full:',
        samples,
        'real:',
        realSamples,
        'decoded:',
        trackData.buffer.length
      );
    }
  } else {
    console.log('Unable to get gapless metadata from track', trackData.meta);
  }
  const stopTime =
    startTime -
    positionMillis / 1000 +
    trackData.buffer.duration -
    gaps.paddingStartSeconds -
    gaps.paddingEndSeconds;
  source.start(startTime, positionMillis / 1000 + gaps.paddingStartSeconds);
  trackData.playState = {
    state: 'playing',
    suppressEndedEvent: false,
    source,
    effectiveStartTimeMillis:
      startTime * 1000 - positionMillis / state.playbackRate,
    stopTime
  };
  source.addEventListener('ended',
    createTrackEndedListener(state, trackData.playState));
}


/**
 * Create a listener that should get called when the currently playing track
 * has ended
 *
 * @param track - the track that should be playing
 */
function createTrackEndedListener(state: State, playState: PlayStatePlaying) {
  return () => {
    const track = state.currentTrack();
    // Check if current track is loaded and expected track
    if (track?.data?.state !== 'ready' || track.data.playState !== playState)
      return;
    if (playState.state === 'playing' && !playState.suppressEndedEvent) {
      if (state.tracks.length === 1) {
        // If there are no following tracks,
        // keep the last track, and moe the cursor to the beginning
        track.data.playState = {
          state: 'paused',
          positionMillis: 0
        };
        state.sendEvent('ended');
      } else {
        state.tracks = state.tracks.slice(1);
        state.sendEvent('next');
      }
    }
  };
}

/**
 * Stop the current track, and any other tracks that have already been scheduled
 * to start playing once the current track has ended,
 * while ignoring the 'ended' event that will
 * be dispatched by the `AudioBufferSourceNode`.
 *
 * @param positionMillis the value to use for the positionMillis property of the
 *                       current track (track `0`) once paused.
 */
export function stopAllTracksWithoutEnding(tracks: Track[], positionMillis = 0) {
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    if (track.data?.state === 'ready' &&
        track.data.playState.state === 'playing') {
      track.data.playState.suppressEndedEvent = true;
      track.data.playState.source.stop();
      track.data.playState = {
        state: 'paused',
        positionMillis: i === 0 ? positionMillis : 0
      };
    }
  }
}

/**
 * Used with requestAnimationFrame to dispatch timeupdate events
 */
function timeUpdated(state: State) {
  state.sendEvent('timeupdate');
  const track = state.currentTrack();
  if (track?.data?.state === 'ready' &&
      track.data.playState.state === 'playing') {
    scheduleTimeUpdated(state);
  }
}

function scheduleTimeUpdated(state: State) {
  if (state.animationFrameRequest !== null)
    cancelAnimationFrame(state.animationFrameRequest);
  state.animationFrameRequest = requestAnimationFrame(() => timeUpdated(state));
}