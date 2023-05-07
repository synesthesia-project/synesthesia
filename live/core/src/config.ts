import * as t from 'io-ts';

const KIND_AND_CONFIG = t.type({
  kind: t.string,
  config: t.unknown,
});

export type KindAndConfig = t.TypeOf<typeof KIND_AND_CONFIG>;

const OPTIONAL_KIND_AND_CONFIG = t.union([t.undefined, KIND_AND_CONFIG]);

export type OptionalKindAndConfig = t.TypeOf<typeof OPTIONAL_KIND_AND_CONFIG>;

export const CONFIG = t.partial({
  outputs: t.record(t.string, OPTIONAL_KIND_AND_CONFIG),
  inputs: t.partial({
    current: KIND_AND_CONFIG,
  }),
});

export type Config = t.TypeOf<typeof CONFIG>;
