/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'chai';

import { MetaIDs } from '../../main/state/meta-ids';

describe('MetaIDs', () => {
  const m = new MetaIDs();

  describe('getId()', () => {
    it('basic title/author meta', () => {
      expect(
        m.getId({
          type: 'meta',
          title: 'some song',
          artist: 'some artist',
          lengthMillis: 1234,
        })
      ).to.equal('8e8597ef1d809a1afd9f839841cb099337cfb70c');
    });

    it('basic title/author meta (reordered)', () => {
      expect(
        m.getId({
          artist: 'some artist',
          lengthMillis: 1234,
          type: 'meta',
          title: 'some song',
        })
      ).to.equal('8e8597ef1d809a1afd9f839841cb099337cfb70c');
    });

    it('basic title/author meta (extra data)', () => {
      expect(
        m.getId({
          artist: 'some artist',
          lengthMillis: 1234,
          type: 'meta',
          title: 'some song',
          foo: 'bar',
        } as any)
      ).to.equal('8e8597ef1d809a1afd9f839841cb099337cfb70c');
    });
  });
});
