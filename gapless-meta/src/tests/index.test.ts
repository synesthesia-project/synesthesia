import * as path from 'path';
import { expect } from 'chai';

import {
  getMetadataFromFile
} from '../lib/node';

const TRACKS = path.join(path.dirname(__dirname), 'tracks');
const TRACKS_SINTEL = path.join(TRACKS, 'sintel');

describe('index.ts', () => {

  it('getMetadata', async () => {
    const src = path.join(TRACKS_SINTEL, 'sintel_1.mp3');
    const metadata = await getMetadataFromFile(src);
    expect(metadata).to.deep.equal({
      version: '1',
      layer: '3',
      bitrate: 128,
      mode: 'joint_stereo',
      sampleRate: 44100,
      samplesPerFrame: 1152,
      vbrInfo: {
        isCBR: false,
        numberOfFrames: 249,
      },
      lameInfo: {
        encoder: 'LAME3.99r',
      },
    });
  });

});
