# A library to interact with various midi consoles

[![](https://img.shields.io/npm/v/@synesthesia-project/midi-consoles.svg)](https://www.npmjs.com/package/@synesthesia-project/midi-consoles)

A best-effort attempt to create a library that interacts well with various MIDI
consoles, providing an easy-to use API, and common abstractions.

It can be quite hard to obtain accurate information on the control protocols
for various different devices, as the music industry manufacturers seem to be
very aprehensive about sharing these kinds of details. So most of the work in
library has been pulled together from various sources, some reverse-engineering,
and a substantial amount of trial-and-error.

Contributions welcome!

## Supported Consoles

I'm adding support for consoles as and when the need arises,
if you have a console that does not have support yet,
you're welcome to contribute!

### Behringer X-Touch Extender

*(Note: thie library is currently being written)*

The X-Touch supports two different communication modes:

  * MCU (Mackie Control Universal) Protocol

    ```
    SysEx Manufacturer Id: 0x 00 00 66 (mackie)
    SysEx Device ID:       0x 15
    ```
  * Mackie HUI Protocol

The MCU protocol is the more modern one (and the default mode).
I have managed to get the LCD display working in MCU,
but not over the HUI protocol.


## Useful Information / Sources

* **Logic Pro 7.2 .1 Dedicated Control Surface Support:**

  This manual seems to somewhat accurately document the Mackie Control Universal Protocol
  on page `239` onwards.

  * [https://web.archive.org/web/20130402181113/http://manuals.info.apple.com/en/Logic7_DedicatedCntrlSurfaceInfo.pdf](https://web.archive.org/web/20130402181113/http://manuals.info.apple.com/en/Logic7_DedicatedCntrlSurfaceInfo.pdf)
  * [https://people.ok.ubc.ca/creative/MacManuals/Logic7_DedicatedCntrlSurfaceInfo.pdf](https://people.ok.ubc.ca/creative/MacManuals/Logic7_DedicatedCntrlSurfaceInfo.pdf)

* **MACKIE HUI MIDI protocol:**

  The results of a 2-day reverse-engineering-session trying to reverse-engineer
  the the HUI protocol.

  * [https://stash.reaper.fm/12332/HUI.pdf](https://stash.reaper.fm/12332/HUI.pdf)
  * [https://forum.cockos.com/showthread.php?t=101328](https://forum.cockos.com/showthread.php?t=101328)
