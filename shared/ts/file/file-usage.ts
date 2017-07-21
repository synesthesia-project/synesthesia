import * as file from './file';
import {deepFreeze} from '../util/util';

export type PreparedFile = file.CueFile;

/**
 * Take a CueFile, and prepare it for easy consumption by a consumer.
 */
export function prepareFile(file: file.CueFile): PreparedFile {
  return deepFreeze({
    lengthMillis: file.lengthMillis,
    layers: file.layers.map(prepareLayer)
  });
}

function prepareLayer(layer: file.AnyLayer) {
  return file.switchLayer<file.AnyLayer>(layer, {
    percussion: preparePercussionLayerEvent,
    tones: layer => layer
  });
}

function preparePercussionLayerEvent(layer: file.PercussionLayer): file.PercussionLayer {
  const defaultPercussionStates: file.CueFileEventState<file.BasicEventStateValues>[] = [
    {millisDelta: 0, values: {amplitude: 1}},
    {millisDelta: layer.settings.defaultLengthMillis, values: {amplitude: 0}}
  ];
  return {
    kind: layer.kind,
    settings: layer.settings,
    events: layer.events
      .map(event => {
        return {
          timestampMillis: event.timestampMillis,
          states: event.states.length > 0 ? event.states : defaultPercussionStates
        };
      })
      .sort((a, b) => a.timestampMillis - b.timestampMillis)
  };
}

export function getActiveEvents<T>(
    events: file.CueFileEvent<T>[], positionMillis: number): file.CueFileEvent<T>[] {
  const active: file.CueFileEvent<T>[] = [];
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.timestampMillis > positionMillis)
      break;
    const lastTimestamp = event.timestampMillis + event.states[event.states.length - 1].millisDelta;
    if (lastTimestamp > positionMillis)
      active.push(event);
  }
  return active;
}
