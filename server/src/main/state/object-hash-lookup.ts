import { createHash } from 'crypto';

function emptyState<T>() {
  return {
    objToHash: new Map<T, string>(),
    hashToObj: new Map<string, T>()
  };
}

export function hashObject(obj: any) {
  return createHash('sha1').update(JSON.stringify(obj), 'utf8').digest('hex');
}

/**
 * This class manages computing a hashes for objects, and makes it possible to look up
 * objects by their hash.
 *
 * At any one time, there are limited number of objects that are "active", and can be
 * looked-up. Only active objects can be requested by their hash, or have their hash
 * value returned. When the active objects are updated, only those that are new need
 * to have their hash computed.
 *
 * The objects passed must not be mutated, as their hash is calculated based on their
 * contents, and assumed not to change.
 *
 * (This is primarily used for calculating the hashes and allowing for hash lookups of CueFiles).
 */
export class ObjectHashLookup<T> {

  private state = emptyState<T>();
  private readonly hashObject: (obj: any) => string;

  /**
   * @param hash optional parameter to use a different hash function than the default
   */
  public constructor(hash = hashObject) {
    this.hashObject = hash;
  }

  public updateActiveObjects(objects: T[]) {
    const newState = emptyState<T>();
    for (const obj of objects) {
      let hash = this.state.objToHash.get(obj);
      if (!hash)
        hash = this.hashObject(obj);
      newState.hashToObj.set(hash, obj);
      newState.objToHash.set(obj, hash);
    }
    this.state = newState;
  }

  public getHash(object: T): string | null {
    const r = this.state.objToHash.get(object);
    return r ? r : null;
  }

  public getObject(hash: string): T | null {
    const r = this.state.hashToObj.get(hash);
    return r ? r : null;
  }

}
