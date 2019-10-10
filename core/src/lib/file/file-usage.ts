import * as file from '.';
import {deepFreeze} from '../util';

export type PreparedFile = file.CueFile;

/**
 * Take a CueFile, and prepare it for easy consumption by a consumer.
 */
export function prepareFile(f: file.CueFile): PreparedFile {
  return deepFreeze({
    lengthMillis: f.lengthMillis,
    layers: f.layers.map(prepareLayer),
  });
}

function prepareLayer(layer: file.AnyLayer) {
  return file.switchLayer<file.AnyLayer>(layer, {
    percussion: preparePercussionLayerEvent,
    tones: l => l,
  });
}

function preparePercussionLayerEvent(layer: file.PercussionLayer): file.PercussionLayer {
  const defaultPercussionStates: Array<file.CueFileEventState<file.BasicEventStateValues>> = [
    {millisDelta: 0, values: {amplitude: 1}},
    {millisDelta: layer.settings.defaultLengthMillis, values: {amplitude: 0}},
  ];
  return {
    kind: layer.kind,
    settings: layer.settings,
    events: layer.events
      .map(event => {
        return {
          timestampMillis: event.timestampMillis,
          states: event.states.length > 0 ? event.states : defaultPercussionStates,
        };
      })
      .sort((a, b) => a.timestampMillis - b.timestampMillis),
  };
}

export function getActiveEvents<T>(
  events: Array<file.CueFileEvent<T>>, positionMillis: number): Array<file.CueFileEvent<T>> {
  const active: Array<file.CueFileEvent<T>> = [];
  for (const event of events) {
    if (event.timestampMillis > positionMillis)
      break;
    const lastTimestamp = event.timestampMillis + event.states[event.states.length - 1].millisDelta;
    if (lastTimestamp > positionMillis)
      active.push(event);
  }
  return active;
}

/**
 * Given a particular event and way to extract a numeric value from a state of
 * the event, find out what that value should be for the given positionMillis.
 *
 * TODO: Change this to a sample period rather than the current point in time
 */
export function getCurrentEventStateValue<T>(
    event: file.CueFileEvent<T>,
    positionMillis: number,
    extract: (state: T) => number): number {
  // Find the segment we are currently in
  for (let j = 1; j < event.states.length; j++) {
    const s1 = event.states[j - 1];
    const s2 = event.states[j];
    const s1time = event.timestampMillis + s1.millisDelta;
    if (s1time > positionMillis)
      continue;
    const s2time = event.timestampMillis + s2.millisDelta;
    if (s2time < positionMillis)
      break;
    // Position within this segment
    const position = (positionMillis - s1time) / (s2time - s1time);
    return extract(s1.values) * (1 - position) + extract(s2.values) * position;
  }
  throw new Error('getCurrentState() called for inactive event');
}
