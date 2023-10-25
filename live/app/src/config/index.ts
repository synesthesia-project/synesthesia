import * as t from 'io-ts';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { isRight } from 'fp-ts/lib/Either';

import {
  OPTIONAL_KIND_AND_CONFIG,
  OUTPUT,
} from '@synesthesia-project/live-core/lib/config';
import { PLUGIN_CONFIG } from './plugins';

const optionalRecord = <T extends t.Mixed>(type: T) =>
  t.record(t.string, t.union([t.undefined, type]));

export const SEQUENCES_SEQUENCE_CONFIG = t.type({
  name: t.string,
  channels: optionalRecord(t.number),
});

export type SequencesSequenceConfig = t.TypeOf<
  typeof SEQUENCES_SEQUENCE_CONFIG
>;

export const SEQUENCES_GROUP_CONFIG = t.type({
  name: t.string,
  channels: t.array(t.string),
  selectedSequence: t.union([t.undefined, t.string]),
  sequences: optionalRecord(SEQUENCES_SEQUENCE_CONFIG),
});

export type SequencesGroupConfig = t.TypeOf<typeof SEQUENCES_GROUP_CONFIG>;

export const SEQUENCES_CONFIG = t.type({
  groups: optionalRecord(SEQUENCES_GROUP_CONFIG),
});

export type SequencesConfig = t.TypeOf<typeof SEQUENCES_CONFIG>;

export const CUE_CONFIG = t.partial({
  name: t.string,
  module: OPTIONAL_KIND_AND_CONFIG,
});

export type CueConfig = t.TypeOf<typeof CUE_CONFIG>;

export const CONFIG = t.partial({
  outputs: t.record(t.string, OUTPUT),
  compositor: t.type({
    current: t.union([t.null, t.string]),
    cues: optionalRecord(CUE_CONFIG),
  }),
  sequences: SEQUENCES_CONFIG,
  plugins: PLUGIN_CONFIG,
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
