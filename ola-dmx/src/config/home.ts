import {Channel, Fixture, Config} from './';

const fixtures: Fixture[] = [];

const simpleRgbFixtureChannels: Channel[] = [
  {kind: 'color', color: 'r'},
  {kind: 'color', color: 'g'},
  {kind: 'color', color: 'b'}
];

const simpleRgbFixtureChannels2: Channel[] = [
  {kind: 'static', value: 255}, // dimmer
  {kind: 'color', color: 'r'},
  {kind: 'color', color: 'g'},
  {kind: 'color', color: 'b'}
];

const movingHeadOneFixtureChannels: Channel[] = [
  {kind: 'movement', dimension: 'level'},
  {kind: 'static', value: 0},
  {kind: 'movement', dimension: 'vertical'},
  {kind: 'static', value: 0},
  {kind: 'speed'},
  {kind: 'static', value: 255}, // dimmer
  {kind: 'strobe'},
  {kind: 'color', color: 'r'},
  {kind: 'color', color: 'g'},
  {kind: 'color', color: 'b'},
  {kind: 'color', color: 'w'}
];

const movingHeadTwoFixtureChannels: Channel[] = [
  {kind: 'movement', dimension: 'level'},
  {kind: 'static', value: 0},
  {kind: 'movement', dimension: 'vertical'},
  {kind: 'static', value: 0},
  {kind: 'speed'},
  {kind: 'static', value: 255}, // strobe / dimmer
  {kind: 'color', color: 'r'},
  {kind: 'color', color: 'g'},
  {kind: 'color', color: 'b'},
  {kind: 'color', color: 'w'}
];

const config: Config = {
  fixtures: [
    {
      universe: 0,
      startChannel: 1,
      channels: simpleRgbFixtureChannels,
      group: 'par',
      position: 1
    },
    {
      universe: 0,
      startChannel: 4,
      channels: simpleRgbFixtureChannels,
      group: 'par',
      position: 2
    },
    {
      universe: 0,
      startChannel: 7,
      channels: simpleRgbFixtureChannels,
      group: 'par',
      position: 3
    },
    {
      universe: 0,
      startChannel: 10,
      channels: simpleRgbFixtureChannels,
      group: 'par',
      position: 6
    },
    {
      universe: 0,
      startChannel: 13,
      channels: simpleRgbFixtureChannels,
      group: 'par',
      position: 5
    },
    {
      universe: 0,
      startChannel: 16,
      channels: simpleRgbFixtureChannels,
      group: 'par',
      position: 4
    },
    {
      universe: 0,
      startChannel: 19,
      channels: simpleRgbFixtureChannels,
      group: 'par'
    },
    {
      universe: 0,
      startChannel: 22,
      channels: simpleRgbFixtureChannels,
      group: 'par'
    },
    // START: 4 Bar Flex
    {
      universe: 0,
      startChannel: 25,
      channels: [
        {kind: 'static', value: 0}, // Mode / Pattern
        {kind: 'static', value: 255}, // Dimmer
        {kind: 'static', value: 0}, // strobe
      ],
      group: 'par'
    },
    {
      universe: 0,
      startChannel: 28,
      channels: simpleRgbFixtureChannels,
      group: 'par',
      position: 10
    },
    {
      universe: 0,
      startChannel: 31,
      channels: simpleRgbFixtureChannels,
      group: 'par',
      position: 9
    },
    {
      universe: 0,
      startChannel: 34,
      channels: simpleRgbFixtureChannels,
      group: 'par',
      position: 8
    },
    {
      universe: 0,
      startChannel: 37,
      channels: simpleRgbFixtureChannels,
      group: 'par',
      position: 7
    },
    // END: 4 Bar Flex
    {
      universe: 0,
      startChannel: 40,
      channels: movingHeadTwoFixtureChannels,
      movement: {
        stageInterval: 80,
        stages: [
          {speed: 240, channelValues: [84, 181]},
          {speed: 240, channelValues: [106, 192]},
          {speed: 240, channelValues: [124, 162]},
          {speed: 240, channelValues: [124, 122]},
          {speed: 0, channelValues: [170, 171]}, // t's room left
          {speed: 240, channelValues: [139, 190]},
          {speed: 240, channelValues: [124, 162]},
          {speed: 240, channelValues: [124, 122]},
        ]
      },
      group: 'moving-head'
    },
    {
      universe: 0,
      startChannel: 100,
      channels: movingHeadOneFixtureChannels,
      movement: {
        stageInterval: 60,
        stages: [
          {speed: 0, channelValues: [100, 125]},
        ]
      },
      group: 'moving-head'
    },
    {
      universe: 0,
      startChannel: 60,
      channels: simpleRgbFixtureChannels2,
      group: 'par'
    },
  ],
  groups: [
    {
    id: 'par'
    },
    {
      id: 'moving-head-1'
    }
  ],
  settings: {
    blackoutTransitionTime: 1000
  }
};

export function getConfig() {
  return config;
}
