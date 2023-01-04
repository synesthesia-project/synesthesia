/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'chai';

import { ObjectHashLookup, hashObject } from '../../main/state/object-hash-lookup';

describe('ObjectHashLookup', () => {

  describe('Empty', () => {

    const lookup = new ObjectHashLookup<any>();

    it('getHash()', () => {
      expect(lookup.getHash({})).to.equal(null);
    });

    it('getObject()', () => {
      expect(lookup.getObject('123')).to.equal(null);
    });

  });

  describe('Single', () => {

    const lookup = new ObjectHashLookup<any>();
    const a = {};
    const b = {};
    lookup.updateActiveObjects([a]);

    it('getHash()', () => {
      expect(lookup.getHash(a)).to.equal('bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f');
      expect(lookup.getHash(b)).to.equal(null);
    });

    it('getObject()', () => {
      expect(lookup.getObject('bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f') === a).to.be.true;
    });

  });

  describe('Multi', () => {

    const lookup = new ObjectHashLookup<any>();
    const a = { v: 1};
    const b = { v: 2 };
    const c = { v: 3 };
    lookup.updateActiveObjects([a, b]);

    it('getHash()', () => {
      expect(lookup.getHash(a)).to.equal('05386f28d1614fecb1c7e329bd82417fb48dd452');
      expect(lookup.getHash(b)).to.equal('217e0aa280ea76871d5cfa05a015563a9be837b2');
      expect(lookup.getHash(c)).to.equal(null);
    });

    it('getObject()', () => {
      expect(lookup.getObject('05386f28d1614fecb1c7e329bd82417fb48dd452') === a).to.be.true;
      expect(lookup.getObject('217e0aa280ea76871d5cfa05a015563a9be837b2') === b).to.be.true;
    });

  });

  it('Single Replace', () => {

    const lookup = new ObjectHashLookup<any>();
    const a = {};
    const b = {};
    lookup.updateActiveObjects([a]);
    expect(lookup.getHash(a)).to.equal('bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f');
    expect(lookup.getHash(b)).to.equal(null);
    expect(lookup.getObject('bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f') === a).to.be.true;
    lookup.updateActiveObjects([b]);
    expect(lookup.getHash(a)).to.equal(null);
    expect(lookup.getHash(b)).to.equal('bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f');
    expect(lookup.getObject('bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f') === b).to.be.true;

  });

  it('Delete Old', () => {

    const lookup = new ObjectHashLookup<any>();
    const a = { v: 1 };
    const b = { v: 2 };
    const c = { v: 3 };
    lookup.updateActiveObjects([a, b]);

    expect(lookup.getHash(a)).to.equal('05386f28d1614fecb1c7e329bd82417fb48dd452');
    expect(lookup.getHash(b)).to.equal('217e0aa280ea76871d5cfa05a015563a9be837b2');
    expect(lookup.getHash(c)).to.equal(null);
    expect(lookup.getObject('05386f28d1614fecb1c7e329bd82417fb48dd452') === a).to.be.true;
    expect(lookup.getObject('217e0aa280ea76871d5cfa05a015563a9be837b2') === b).to.be.true;
    expect(lookup.getObject('8ca201b5be4035e9d47d070f3cc7e5ccc014d3e9')).to.equal(null);

    lookup.updateActiveObjects([c]);

    expect(lookup.getHash(a)).to.equal(null);
    expect(lookup.getHash(b)).to.equal(null);
    expect(lookup.getHash(c)).to.equal('8ca201b5be4035e9d47d070f3cc7e5ccc014d3e9');
    expect(lookup.getObject('05386f28d1614fecb1c7e329bd82417fb48dd452')).to.equal(null);
    expect(lookup.getObject('217e0aa280ea76871d5cfa05a015563a9be837b2')).to.equal(null);
    expect(lookup.getObject('8ca201b5be4035e9d47d070f3cc7e5ccc014d3e9') === c).to.be.true;

  });

  it('Avoid Hash Recomputation', () => {

    let hashCount = 0;
    const lookup = new ObjectHashLookup<any>(obj => {
      hashCount++;
      return hashObject(obj);
    });

    const a = { v: 1 };
    const b = { v: 2 };
    const c = { v: 3 };
    lookup.updateActiveObjects([a, b]);
    expect(hashCount).to.equal(2);

    expect(lookup.getHash(a)).to.equal('05386f28d1614fecb1c7e329bd82417fb48dd452');
    expect(lookup.getHash(b)).to.equal('217e0aa280ea76871d5cfa05a015563a9be837b2');
    expect(lookup.getHash(c)).to.equal(null);
    expect(lookup.getObject('05386f28d1614fecb1c7e329bd82417fb48dd452') === a).to.be.true;
    expect(lookup.getObject('217e0aa280ea76871d5cfa05a015563a9be837b2') === b).to.be.true;
    expect(lookup.getObject('8ca201b5be4035e9d47d070f3cc7e5ccc014d3e9')).to.equal(null);

    expect(hashCount).to.equal(2);
    hashCount = 0;

    lookup.updateActiveObjects([a, b, c]);
    expect(hashCount).to.equal(1);

    expect(lookup.getHash(a)).to.equal('05386f28d1614fecb1c7e329bd82417fb48dd452');
    expect(lookup.getHash(b)).to.equal('217e0aa280ea76871d5cfa05a015563a9be837b2');
    expect(lookup.getHash(c)).to.equal('8ca201b5be4035e9d47d070f3cc7e5ccc014d3e9');
    expect(lookup.getObject('05386f28d1614fecb1c7e329bd82417fb48dd452') === a).to.be.true;
    expect(lookup.getObject('217e0aa280ea76871d5cfa05a015563a9be837b2') === b).to.be.true;
    expect(lookup.getObject('8ca201b5be4035e9d47d070f3cc7e5ccc014d3e9') === c).to.be.true;

    expect(hashCount).to.equal(1);

  });
});
