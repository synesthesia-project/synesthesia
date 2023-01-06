import { expect } from 'chai';
import { CueFile } from '@synesthesia-project/core/lib/file/index';

import { Storage } from '../../main/storage/storage';
import { TEST_DATA } from '../util/consts';

/**
 * Return a new promise that fails if the given promise does not fail in the correct manner
 * @param promise the promise that should fail
 * @param errorMsg the error message that should be given in the rejection
 */
function promiseError(
  promise: Promise<unknown>,
  errorMsg: (msg: Error) => Chai.Assertion
): Promise<void> {
  const succeedError = new Error('Not supposed to succeed');
  return promise
    .then(() => {
      throw succeedError;
    })
    .catch((err: Error) => {
      expect(err).to.be.an.instanceOf(Error);
      if (err.message === 'Not supposed to succeed') throw err;
      errorMsg(err);
    });
}

const FNF_REGEX = /file not found:/;

const fileNotFound = (err: Error) => {
  if (!FNF_REGEX.exec(err.message)) {
    throw err;
  }
  return expect(true);
};

describe('Storage', () => {
  describe('Basic storage + fetching', () => {
    it('Non-Existant', async () => {
      const s = new Storage(TEST_DATA);

      await promiseError(s.getFile('non-existent-id'), fileNotFound);
    });

    it('Set And Get', async () => {
      const id = '3fjc94jst';
      const s = new Storage(TEST_DATA);
      const f: CueFile = {
        lengthMillis: 12345,
        layers: [],
      };

      // Check file does not yet exist
      await promiseError(s.getFile(id), fileNotFound);
      // Save the file
      await s.saveFile(id, f);
      // Check invalid ID does not return file
      await promiseError(s.getFile('non-existent-id'), fileNotFound);
      // Check file is correctly returned
      expect(await s.getFile(id)).to.deep.equal(f);
    });
  });

  describe('multiple revisions', () => {
    it('Non-Existant', async () => {
      const s = new Storage(TEST_DATA);

      expect(await s.getRevisions('non-existent-id')).to.deep.equal([]);
    });

    it('Single Revision', async () => {
      const id = '3fjc94jst4';
      const s = new Storage(TEST_DATA);
      const f: CueFile = {
        lengthMillis: 12345,
        layers: [],
      };

      // Check file does not yet exist
      await promiseError(s.getFile(id), fileNotFound);
      expect(await s.getRevisions(id)).to.deep.equal([]);
      // Save the file
      await s.saveFile(id, f);
      // Check file is correctly returned
      expect(await s.getFile(id)).to.deep.equal(f);
      const revisions = await s.getRevisions(id);
      expect(revisions.length).to.equal(1);
      expect(await s.getRevision(id, revisions[0])).to.deep.equal(f);
    });

    it('Multiple Single Revisions', async () => {
      const id = '3fjc94jst5';
      const s = new Storage(TEST_DATA);
      const f1: CueFile = {
        lengthMillis: 12345,
        layers: [],
      };
      const f2: CueFile = {
        lengthMillis: 54321,
        layers: [],
      };

      // Check file does not yet exist
      await promiseError(s.getFile(id), fileNotFound);
      expect(await s.getRevisions(id)).to.deep.equal([]);
      // Save the file
      await s.saveFile(id, f1);
      // Check file is correctly returned
      expect(await s.getFile(id)).to.deep.equal(f1);
      let revisions = await s.getRevisions(id);
      expect(revisions.length).to.equal(1);
      expect(await s.getRevision(id, revisions[0])).to.deep.equal(f1);
      // Save the file again
      await s.saveFile(id, f2);
      // Check current file is correctly returned
      expect(await s.getFile(id)).to.deep.equal(f2);
      revisions = await s.getRevisions(id);
      expect(revisions.length).to.equal(2);
      expect(await s.getRevision(id, revisions[1])).to.deep.equal(f2);
      // Check old file is correctly returned
      expect(await s.getRevision(id, revisions[0])).to.deep.equal(f1);
    });
  });
});
