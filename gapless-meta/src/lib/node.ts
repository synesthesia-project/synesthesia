import * as fs from 'fs';
import {promisify} from 'util';

import { getMetadata } from '..';

const readFile = promisify(fs.readFile);

export async function getMetadataFromFile(path: string) {
  const buffer = await readFile(path);
  return getMetadata(buffer.buffer);
}
