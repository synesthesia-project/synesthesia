import * as path from 'path';
import { expect } from 'chai';

import { getMetadataFromFile } from '../lib/node';

const TRACKS = path.join(path.dirname(__dirname), 'tracks');
const TRACKS_SINTEL = path.join(TRACKS, 'sintel');

describe('index.ts', () => {
  describe('getMetadata', () => {
    it('sintel_1.mp3', async () => {
      const src = path.join(TRACKS_SINTEL, 'sintel_1.mp3');
      expect(await getMetadataFromFile(src)).to.deep.equal({
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
          paddingStart: 576,
          paddingEnd: 576,
        },
      });
    });

    it('sintel-clip-lame-cbr-128.mp3', async () => {
      const src = path.join(TRACKS_SINTEL, 'sintel-clip-lame-cbr-128.mp3');
      expect(await getMetadataFromFile(src)).to.deep.equal({
        version: '1',
        layer: '3',
        bitrate: 128,
        mode: 'joint_stereo',
        sampleRate: 44100,
        samplesPerFrame: 1152,
        vbrInfo: {
          isCBR: true,
          numberOfFrames: 185,
        },
        lameInfo: {
          encoder: 'LAME3.100',
          paddingStart: 576,
          paddingEnd: 1058,
        },
      });
    });

    it('sintel-clip-mono-lame-cbr-128.mp3', async () => {
      const src = path.join(TRACKS_SINTEL, 'sintel-clip-mono-lame-cbr-128.mp3');
      expect(await getMetadataFromFile(src)).to.deep.equal({
        version: '1',
        layer: '3',
        bitrate: 128,
        mode: 'mono',
        sampleRate: 44100,
        samplesPerFrame: 1152,
        vbrInfo: {
          isCBR: true,
          numberOfFrames: 185,
        },
        lameInfo: {
          encoder: 'LAME3.100',
          paddingStart: 576,
          paddingEnd: 1058,
        },
      });
    });

    it('sintel-clip-lavc-cbr-128-with-id3v2.mp3', async () => {
      const src = path.join(
        TRACKS_SINTEL,
        'sintel-clip-lavc-cbr-128-with-id3v2.mp3'
      );
      expect(await getMetadataFromFile(src)).to.deep.equal({
        version: '1',
        layer: '3',
        bitrate: 128,
        mode: 'stereo',
        sampleRate: 44100,
        samplesPerFrame: 1152,
        vbrInfo: {
          isCBR: true,
          numberOfFrames: 185,
        },
        lameInfo: {
          encoder: 'Lavc58.54',
          paddingStart: 576,
          paddingEnd: 1058,
        },
      });
    });
  });
});
