import * as util from '../shared/util/util';

export interface CueFile {
  lengthMillis: number;
  layers: AnyLayer[];
}

export interface CueFileLayer<LayerKind, LayerSettings, EventStateValues>{
  kind: LayerKind;
  settings: LayerSettings;
  events: CueFileEvent<EventStateValues>[];
}

export interface CueFileEvent<EventStateValues> {
  timestampMillis: number;
  states: CueFileEventState<EventStateValues>[];
}

export interface CueFileEventState<EventStateValues> {
  millisDelta: number;
  values: EventStateValues;
}

// Different Layer Types

export interface BasicEventStateValues {
  amplitude: number;
  pitch?: number;
}

/**
 * Any of the possible layers
 */
export type AnyLayer = PercussionLayer | TonesLayer;

export interface PercussionLayer extends CueFileLayer<
  'percussion',
  {
    /** Default length for a percussion event */
    defaultLengthMillis: number
  },
  BasicEventStateValues> {}

export interface TonesLayer extends CueFileLayer<'tones', {}, BasicEventStateValues> {}

export function isPercussionLayer(layer: AnyLayer): layer is PercussionLayer {
  return layer.kind === 'percussion';
}

export function isTonesLayer(layer: AnyLayer): layer is TonesLayer {
  return layer.kind === 'tones';
}

export function switchLayer<O>(
    layer: AnyLayer,
    cases: {
      percussion: (layer: PercussionLayer) => O,
      tones: (layer: TonesLayer) => O
    }): O {
  if (isPercussionLayer(layer))
    return cases.percussion(layer);
  if (isTonesLayer(layer))
    return cases.tones(layer);
  throw new Error('Unrecognized Layer');
}

/**
 * Create a new file with the given length
 */
export function emptyFile(lengthMillis: number): CueFile {
  return util.deepFreeze({
    lengthMillis,
    layers: []
  });
}
