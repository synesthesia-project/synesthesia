import * as t from 'io-ts';

export const KIND_AND_CONFIG = t.type({
  kind: t.string,
  config: t.unknown,
});

export type KindAndConfig = t.TypeOf<typeof KIND_AND_CONFIG>;

export const OPTIONAL_KIND_AND_CONFIG = t.union([
  t.undefined,
  t.null,
  KIND_AND_CONFIG,
]);

export type OptionalKindAndConfig = t.TypeOf<typeof OPTIONAL_KIND_AND_CONFIG>;
