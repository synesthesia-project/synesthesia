import { promises as fs } from 'fs';
import * as path from 'path';

import { CueFile } from '@synesthesia-project/core/lib/file/index';

const CUE_FILES_PATH = 'cue_files';

const trackPath = (dataDir: string, id: string) =>
  path.join(dataDir, CUE_FILES_PATH, id);
const trackRevisionsPath = (dataDir: string, id: string) =>
  path.join(dataDir, CUE_FILES_PATH, id, 'revisions');
const trackCurrentRevisionPath = (dataDir: string, id: string) =>
  path.join(trackPath(dataDir, id), 'current.scue');
const trackRevisionPath = (
  dataDir: string,
  id: string,
  revision: number | string
) => path.join(trackRevisionsPath(dataDir, id), `${revision}.scue`);

/**
 * Class to manage storing CueFiles to persistent storage
 */
export class Storage {
  private readonly dataDir: string;

  public constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  public async getFile(trackId: string): Promise<CueFile> {
    const path = trackCurrentRevisionPath(this.dataDir, trackId);
    const file = await fs.readFile(path).catch((err: Error) => {
      if (err.message.startsWith('ENOENT'))
        throw new Error('file not found: ' + path);
      throw err;
    });
    return JSON.parse(file.toString());
  }

  public async saveFile(trackId: string, file: CueFile): Promise<void> {
    const pathname = trackRevisionPath(
      this.dataDir,
      trackId,
      new Date().getTime()
    );
    const currentPathname = trackCurrentRevisionPath(this.dataDir, trackId);
    const relPath = path.relative(path.dirname(currentPathname), pathname);
    console.log(relPath);
    await fs.mkdir(path.dirname(pathname), { recursive: true });
    await fs.writeFile(pathname, JSON.stringify(file));
    // Make current link
    // TODO: make work on windows
    // Unlink if exists
    await fs.unlink(currentPathname).catch((err: Error) => {
      if (!err.message.startsWith('ENOENT')) throw err;
    });
    await fs.symlink(relPath, currentPathname);
  }

  /**
   * Get a list of all revisions that have been stored for a particular song id
   */
  public async getRevisions(trackId: string): Promise<string[]> {
    const list = await fs
      .readdir(trackRevisionsPath(this.dataDir, trackId))
      .catch((err: Error) => {
        if (err.message.startsWith('ENOENT')) return [] as string[];
        throw err;
      });
    console.log(list);
    return list
      .filter((name) => name.endsWith('.scue'))
      .map((name) => name.substr(0, name.length - 5));
  }

  /**
   * Get a specific revision of a track.
   */
  public async getRevision(
    trackId: string,
    revisionName: string
  ): Promise<CueFile> {
    const path = trackRevisionPath(this.dataDir, trackId, revisionName);
    const file = await fs.readFile(path).catch((err: Error) => {
      if (err.message.startsWith('ENOENT'))
        throw new Error('file not found: ' + path);
      throw err;
    });
    return JSON.parse(file.toString());
  }
}
