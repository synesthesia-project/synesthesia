# `gapless-meta`

This library is designed to extract metadata from audiofiles to allow for
gapless playback (for example, in browser-based media players),
but also extracts some other standard metadata.

## Audio file support

The following audio formats are supported, and are part of the test suite:

* MP3 files
  * Encoded by LAME or libavformat (Lavf)
  * With or without ID3v2 tags.

## Installation

```
npm install @synesthesia-project/gapless-meta
```

## Usage

```ts
import getMetadata from '@synesthesia-project/gapless-meta';

const buffer = ... // (some ArrayBuffer)
const metadata = getMetadata(buffer.buffer);
console.log(metadata);
```

**Output:**

```js
{
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
    paddingEnd: 1058
  }
}
```

*(For extensive examples of usage, see the [tests](src/tests)).*

## TODO

* CRC Verification
* MP4 AAC Support

## Inspiration

This library is inspired and informed by a number of documents, blog posts and
specifications, including:

* https://github.com/jquense/mpeg-frame-parser
* https://dalecurtis.github.io/llama-demo/index.html#creating-gapless-content
* https://www.codeproject.com/Articles/8295/MPEG-Audio-Frame-Header
* http://gabriel.mp3-tech.org/mp3infotag.html#delays
* http://www.id3.org/
