import * as t from 'io-ts';

export const CONFIG = t.type({
  outputs: t.record(
    t.string,
    t.union([
      t.undefined,
      t.type({
        kind: t.string,
        config: t.unknown,
      }),
    ])
  ),
});

export type Config = t.TypeOf<typeof CONFIG>;
