import * as t from 'io-ts';
import * as util from '../util';

const layer = <Kind extends string, Settings, EventStateProps>({
  kind,
  settings,
  eventStateProps,
}: {
  kind: t.LiteralC<Kind>;
  settings: t.Type<Settings>;
  eventStateProps: t.Type<EventStateProps>;
}) =>
  t.type({
    kind,
    settings,
    events: t.array(cueFileEvent(eventStateProps)),
  });

const cueFileEvent = <EventStateProps>(
  eventStateProps: t.Type<EventStateProps>
) =>
  t.type({
    timestampMillis: t.number,
    states: t.array(cueFileEventState(eventStateProps)),
  });

export type CueFileEvent<EventStateProps> = t.TypeOf<
  ReturnType<typeof cueFileEvent<EventStateProps>>
>;

const cueFileEventState = <EventStateProps>(
  eventStateProps: t.Type<EventStateProps>
) =>
  t.type({
    millisDelta: t.number,
    values: eventStateProps,
  });

export type CueFileEventState<EventStateProps> = t.TypeOf<
  ReturnType<typeof cueFileEventState<EventStateProps>>
>;

// Different Layer Types

export const BASIC_EVENT_STATE_VALUES = t.intersection([
  t.type({
    amplitude: t.number,
  }),
  t.partial({
    pitch: t.number,
  }),
]);

export type BasicEventStateValues = t.TypeOf<typeof BASIC_EVENT_STATE_VALUES>;

export const PERCUSSION_LAYER = layer({
  kind: t.literal('percussion'),
  settings: t.type({
    /** Default length for a percussion event */
    defaultLengthMillis: t.number,
  }),
  eventStateProps: BASIC_EVENT_STATE_VALUES,
});

export type PercussionLayer = t.TypeOf<typeof PERCUSSION_LAYER>;

export const TONES_LAYER = layer({
  kind: t.literal('tones'),
  settings: t.null,
  eventStateProps: BASIC_EVENT_STATE_VALUES,
});

export type TonesLayer = t.TypeOf<typeof TONES_LAYER>;

export const ANY_LAYER = t.union([PERCUSSION_LAYER, TONES_LAYER]);

/**
 * Any of the possible layers
 */
export type AnyLayer = t.TypeOf<typeof ANY_LAYER>;

export const CUE_FILE = t.type({
  lengthMillis: t.number,
  layers: t.array(ANY_LAYER),
});

export type CueFile = t.TypeOf<typeof CUE_FILE>;

export function switchLayer<O>(
  layer: AnyLayer,
  cases: {
    percussion: (layer: PercussionLayer) => O;
    tones: (layer: TonesLayer) => O;
  }
): O {
  if (PERCUSSION_LAYER.is(layer)) return cases.percussion(layer);
  if (TONES_LAYER.is(layer)) return cases.tones(layer);
  throw new Error('Unrecognized Layer');
}

/**
 * Create a new file with the given length
 */
export function emptyFile(lengthMillis: number): CueFile {
  return util.deepFreeze({
    lengthMillis,
    layers: [],
  });
}
