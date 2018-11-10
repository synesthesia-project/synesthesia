# Synesthesia


[![Total Alerts](https://img.shields.io/lgtm/alerts/g/samlanning/synesthesia.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/samlanning/synesthesia/alerts/)
[![Language Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/samlanning/synesthesia.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/samlanning/synesthesia/context:javascript)

Synesthesia is a lighting & Sound project. A 5 minute lightning talk
of the project can be found here: <https://www.youtube.com/watch?v=egsswPi8yio>

**It is very much a work in progress!**

# Demo Videos

* [Live Test 1 - Jul 23, 2017](https://www.youtube.com/watch?v=IWVBzzRnNas)
* [Live Test 2 - Apr 28, 2018](https://www.youtube.com/watch?v=dxShZ5Eeu8U)

# Components

## [shared](shared)

Core synesthesia libraries and type definitions

**TODO:**

* Move to `synesthesia` and setup as proper node / npm module
* Make usable by other projects, publish to npm etc...

## [composer](composer)

Timeline composition GUI app to manually create synesthesia "cue" files for your own songs.

## [light-desk](light-desk)

GUI app to control a lights etc...

## [ola-dmx](ola-dmx)

Synesthesia client that controls DMX fixtures using [Open Lighting Architecture](https://www.openlighting.org/ola/)

## [strip](strip)

Synesthesia client that controls an individually-addressable RGB light strip.
