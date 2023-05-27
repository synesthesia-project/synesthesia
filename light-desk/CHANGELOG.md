# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- `Group`:
  - Allow components to be dynamically added
    and removed after first render.
  - Return child in addChild, allowing for chaining
- `Button`: Introduce error state that will trigger
  when any listeners throw an error,
  or return a promise that rejects.
- `TextInput`: Introduce new generic text input component.
- Throttle how often the tree is updated
- Introduce new color constant `COLOR_RGB_BLACK`
- Fixed bugs that would occur when a child added to a group multiple times

## [2.1.1] - 2022-01-11

- Update ws and @types/ws
- Make handleWsConnection more usable

## [2.1.0] - 2022-01-11

- Introduce a new initialization mode for manual use

## [2.0.0] - 2022-01-10

- Updated dependencies and build configuration
- Modified the way server is started, allowing it to be added to existing
  express / http server (this is a breaking change)
- Added automatic reconnect to desk when websocket is closed and user tries to
  change something

## [1.1.0] - 2019-01-12

### Added
- Introduced `Rect` component

### Changed
- Removed unnecessary `typedoc` dependency

## [1.0.0] - 2019-01-06

First "full" release of the project

### Changed
- Renamed `Slider` to `SliderButton`
- Modified the parameters to the `LightDesk` constructor
- Switched to using a Sans-Serif font in frontend
- Lots of documentation updates