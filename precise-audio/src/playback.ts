import PitchShift = require('soundbank-pitch-shift');

import { Track, PlayStatePlaying, TrackDataReady, PlayStateBasic, TrackDataModeBasic } from './data';
import { prepareUpcomingTracks } from './scheduling';
import { State } from './state';

export function getPlayState(state: State, data: TrackDataReady): PlayStateBasic & { mode: 'full' | 'basic' } {
  if (data.mode === 'full') {
    return {
      mode: 'full',
      ...data.playState
    };
  } else {
    if (data.audio.paused) {
      if (data.scheduled) {
        return {
          mode: 'basic',
          state: 'playing',
          effectiveStartTimeMillis: data.scheduled.startTime * 1000,
          stopTime: data.scheduled.startTime + data.audio.duration
        };
      } else {
        return {
          mode: 'basic',
          state: 'paused',
          positionMillis: data.audio.currentTime * 1000
        };
      }
    } else {
      const effectiveStartTimeMillis =
        (state.context.currentTime -
          data.audio.currentTime / data.audio.playbackRate)
        * 1000;
      return {
        mode: 'basic',
        state: 'playing',
        effectiveStartTimeMillis,
        stopTime: effectiveStartTimeMillis / 1000 + data.audio.duration
      };
    }
  }
}

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
  if (trackData.mode === 'full') {
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
      startTime +
      (trackData.buffer.duration -
      gaps.paddingStartSeconds -
      gaps.paddingEndSeconds -
      positionMillis / 1000) / state.playbackRate;
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
      createTrackEndedListenerFull(state, trackData.playState));
  } else {
    // TODO: begin playback for basic audio
    const effectiveStartTimeSeconds = startTime - positionMillis / 1000;
    const now = state.context.currentTime;
    const play = () => {
      trackData.scheduled = undefined;
      const now = state.context.currentTime;
      trackData.suppressEndedEvent = undefined;
      trackData.audio.playbackRate = state.playbackRate;
      trackData.audio.currentTime = Math.max(0, now - effectiveStartTimeSeconds),
      trackData.audio.play();
    };
    if (effectiveStartTimeSeconds <= now) {
      play();
    } else {
      const timeoutMillis = (effectiveStartTimeSeconds - now) * 1000;
      trackData.scheduled = {
        timeout: setTimeout(play, timeoutMillis),
        startTime: effectiveStartTimeSeconds
      };
    }
    /*
     * Setup listeners (user properties rather than addEventListener as we
     * don't want multiple listeners per event)
     */
    trackData.audio.onended = createTrackEndedListenerBasic(state, trackData);
  }
}


/**
 * Create a listener that should get called when the currently playing track
 * has ended (used only for tracks in "full" mode)
 *
 * @param track - the track that should be playing
 */
function createTrackEndedListenerFull(state: State, playState: PlayStatePlaying) {
  return () => {
    const track = state.currentTrack();
    // Check if current track is loaded and expected track
    if (track?.data?.state !== 'ready' ||
        track.data.mode !== 'full' ||
        track.data.playState !== playState)
      return;
    if (playState.state === 'playing' && !playState.suppressEndedEvent) {
      if (state.tracks.length === 1) {
        // If there are no following tracks,
        // keep the last track, and move the cursor to the beginning
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

function createTrackEndedListenerBasic(state: State, data: TrackDataModeBasic) {
  return () => {
    const track = state.currentTrack();
    // Check if current track is loaded and expected track
    if (track?.data?.state !== 'ready' || track.data !== data)
      return;
    if (!data.suppressEndedEvent) {
      if (state.tracks.length === 1) {
        // If there are no following tracks,
        // keep the last track, and moe the cursor to the beginning
        track.data.audio.currentTime = 0;
        state.sendEvent('ended');
      } else {
        state.tracks = state.tracks.slice(1);
        playCurrentTrackFrom(state, 0);
        state.sendEvent('next');
      }
    }
  };
}

/**
 * Skip a certain number of tracks ahead.
 */
export function skip(state: State, count: number) {
  if (count < 1)
    throw new Error('Invalid number of tracks to skip: ' + count);
  const track = state.currentTrack();
  let ended = false;
  if (track) {
    /** Begin playback of next track automatically? */
    const beginPlayback = !!(
      track.data?.state === 'ready' && getPlayState(state, track.data).state === 'playing'
      || track.data?.state !== 'ready' && track?.playOnLoad);
    stopAllTracksWithoutEnding(state.tracks);
    count = Math.min(count, state.tracks.length);
    state.tracks = state.tracks.slice(count);
    if (state.tracks.length > 0) {
      if (beginPlayback) {
        const track = state.tracks[0];
        if (track.data?.state === 'ready') {
          playCurrentTrackFrom(state, 0);
        } else {
          playTrackWhenLoaded(track);
        }
      }
      prepareUpcomingTracks(state);
    } else {
      ended = true;
    }
  }
  // Send Events
  for (let i = 0; i < count ; i++)
    state.sendEvent('next');
  if (ended)
    state.sendEvent('ended');
}

export function playTrackWhenLoaded(track: Track) {
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

/**
 * Stop all the tracks in the given array
 * (including tracks that have been scheduled to play in the future,
 * but have not yet started),
 * while ignoring the 'ended' event that will
 * be dispatched by the `AudioBufferSourceNode`.
 *
 * @param positionMillis the value to set for the positionMillis of the first
 *                       track in the array once paused.
 */
export function stopAllTracksWithoutEnding(tracks: Track[], positionMillis = 0) {
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    console.log(track.data?.state);
    if (track.data?.state === 'ready') {
      console.log('ready!!!');
      if (track.data.mode === 'full' &&
          track.data.playState.state === 'playing') {
        track.data.playState.suppressEndedEvent = true;
        track.data.playState.source.stop();
        track.data.playState = {
          state: 'paused',
          positionMillis: i === 0 ? positionMillis : 0
        };
      } else if (track.data.mode === 'basic') {
        if (!track.data.audio.paused) {
          track.data.suppressEndedEvent = true;
          track.data.audio.pause();
          track.data.audio.currentTime = i === 0 ? (positionMillis / 1000) : 0;
        } else if (track.data.scheduled) {
          clearTimeout(track.data.scheduled.timeout);
          track.data.scheduled = undefined;
        }
      }
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
      getPlayState(state, track.data).state === 'playing') {
    scheduleTimeUpdated(state);
  }
}

function scheduleTimeUpdated(state: State) {
  if (state.animationFrameRequest !== null)
    cancelAnimationFrame(state.animationFrameRequest);
  state.animationFrameRequest = requestAnimationFrame(() => timeUpdated(state));
}
