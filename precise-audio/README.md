# `PreciseAudio`

[![](https://img.shields.io/npm/v/@synesthesia-project/precise-audio.svg)](https://www.npmjs.com/package/@synesthesia-project/precise-audio)

A browser-based API for more precise audio playback,
scrubbing/seeking and gapless playback.

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

## Gapless Playback

As this library use the
[Web Audio API ](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
to fully decode each track into an
[`AudioBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer),
we are able to schedule playback with accuracy down to each individual sample.
This makes it possible to schedule adjacent tracks to play
in such a way as to remove any audible gaps between tracks.
The library has been extended with an API for queueing multiple tracks,
and when used it will attempt to play these tracks gaplessly.

The NPM package
[`@synesthesia-project/gapless-meta`](https://www.npmjs.com/package/@synesthesia-project/gapless-meta)
is used to try to determine any gapless padding
that has been added to audio tracks,
when it's not possible to determine padding,
it is assumed to be 0.

For instructions on how to use the gapless API,
see [Gapless API](#gapless-api).

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
  audio.src = "...";
  ```

### Using Webpack

If you are using webpack to bundle your client-side code,
You can simply import the module and use it:

```ts
import PreciseAudio from '@synesthesia-project/precise-audio';

const audio = new PreciseAudio();
audio.src = "...";
```

## Gapless API

To take advantage of the gapless playback functionality,
you need to queue multiple tracks at the same time using either
`updateTracks` or `updateUpcomingTracks`.

**Example:**

```ts
const audio = new PreciseAudio();
audio.updateTracks('track1.mp3', 'track2.mp3');
```

## API

Full documentation on the `PreciseAudio` api can be found
[on the synesthesia project website](https://synesthesia-project.org/api/precise-audio/PreciseAudio.html).

## TODO

* Allow specifying a threshold for maximum length of a song to fully decode,
  disabling gapless playback and reducing precision for songs outside that
  threshold by falling back to using HTMLAudioElement internally.
