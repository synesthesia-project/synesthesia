import { expect } from 'chai';

import {
  getMetadata
} from '../';

describe('index.ts', () => {

  it('getMetadata', () => {
    expect(getMetadata()).to.equal('todo');
  });

});
