import * as util from '../util';

import { CueFile } from '.';

export function validateFile(obj: unknown) {
  // TODO: actually validate, for now assume it's fine
  return util.deepFreeze(obj) as CueFile;
}
