# `PreciseAudio`


[![](https://img.shields.io/npm/v/@synesthesia-project/precise-audio.svg)](https://www.npmjs.com/package/@synesthesia-project/precise-audio)

A browser-based API for more precise playback, scrubbing/seeking and timestamp
functionality.

## Background

When playing audio in browsers using the `<audio>` tag,
seeking/scrubbing to different positions can often be inaccurate,
jumping to a particular point in time can often be off by seconds.
So when trying to synchronize events with playing audio,
like in synesthesia,
scrubbing can cause desynchronization issues
that don't occur when playing a track from start to finish.

This is due to browsers having to sometimes approximate where in an audio file
a particular audio frame is,
rather than knowing precisely.
This is worse in certain codecs more than others.

This problem can be alleviated by using constant bit rate audio files,
which allows browsers to more precisely jump to the correct audio frames,
reducing the chance of discrepancy.

This however is problematic if you want to be able to consume audio files
of numerous formats,
with no bit rate guarantee.

This library aims to mitigate this,
and exposes an API similar to
[`HTMLAudioElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement).

For more background,
read Terill Thompson's blog post:
[Constant vs Variable Bit Rate MP3 Encoding and Timed Text](https://terrillthompson.com/624).

For testing this functionalty,
we use [this test MP3 by Terill](https://github.com/synesthesia-project/synesthesia/raw/master/precise-audio/seconds-VBR.mp3),
that was created for the blog post above.

## Implementation

This library works by using the
[Web Audio API ](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
to decode and load the entire track into memory, as an
[`AudioBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer),
at which point scrubbing can accurately pinpoint the correct frame.

Note though that doing this goes directly against the
[advice on MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer):

> Objects of these types are designed to hold small audio snippets, typically less than 45 s. For longer sounds, objects implementing the MediaElementAudioSourceNode are more suitable.

For applications such as synesthesia though,
this precision is neccesary.

## Usage

This library can either be used in a `<script>` tag directly on your pages,
or imported and packaged using webpack.

In either case, you can obtain the package via npm by running:

```
npm install @synesthesia-project/precise-audio
```

### Including directly in browser

* Copy the file `node_modules/@synesthesia-project/precise-audio/dist.min.js`
  (and optionaly `dist.min.js.map` too)
  to an appropriate location for your project.
* Add something like this to your HTML:

  ```html
  <script src="/static/precise-audio/dist.min.js"></script>
  ```
* The class `PreciseAudio` will then be available to use
  directly in the browser:

  ```ts
  const audio = new PreciseAudio();
  audio.loadAudioFile(...);
  ```

### Using Webpack

If you are using webpack to bundle your client-side code,
You can simply import the module and use it:

```ts
import PreciseAudio from '@synesthesia-project/precise-audio';

const audio = new PreciseAudio();
audio.loadAudioFile(...);
```

## API

Full documentation on the `PreciseAudio` api can be found
[on the synesthesia project website](https://synesthesia-project.org/api/precise-audio/PreciseAudio.html).