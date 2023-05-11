import * as t from 'io-ts';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { isRight } from 'fp-ts/lib/Either';

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

export const CONFIG = t.partial({
  outputs: t.record(t.string, OPTIONAL_KIND_AND_CONFIG),
  inputs: t.partial({
    current: OPTIONAL_KIND_AND_CONFIG,
  }),
});

export type Config = t.TypeOf<typeof CONFIG>;

export const loadConfig = async (path: string): Promise<Config> => {
  const json = await readFile(path)
    .then((buffer) => JSON.parse(buffer.toString()))
    .catch((err) => {
      console.error(err);
      console.info(`Defaulting to empty config`);
      return {};
    });
  const decode = CONFIG.decode(json);
  if (isRight(decode)) {
    return decode.right;
  } else {
    console.error(`Invalid config file: ${path}`);
    return {};
  }
};

export const saveConfig = async (path: string, config: Config) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(config, null, '  '));
};
