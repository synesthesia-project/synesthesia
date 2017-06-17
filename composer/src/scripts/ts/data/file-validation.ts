import * as util from '../util/util';
import {CueFile} from './file';

export function validateFile(obj: any) {
  // TODO: actually validate, for now assume it's fine
  return util.deepFreeze(obj) as CueFile;
}
