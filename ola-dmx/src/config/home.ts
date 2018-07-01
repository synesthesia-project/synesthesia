import {Channel, Fixture, Group, Config} from './';

const fixtures: Fixture[] = [];

const simpleRgbFixtureChannels: Channel[] = [
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
  {kind: 'static', value: 255},
  {kind: 'strobe'},
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
      group: 'par'
    },
    {
      universe: 0,
      startChannel: 4,
      channels: simpleRgbFixtureChannels,
      group: 'par'
    },
    {
      universe: 0,
      startChannel: 7,
      channels: simpleRgbFixtureChannels,
      group: 'par'
    },
    {
      universe: 0,
      startChannel: 10,
      channels: simpleRgbFixtureChannels,
      group: 'par'
    },
    {
      universe: 0,
      startChannel: 13,
      channels: simpleRgbFixtureChannels,
      group: 'par'
    },
    {
      universe: 0,
      startChannel: 16,
      channels: simpleRgbFixtureChannels,
      group: 'par'
    },
    {
      universe: 0,
      startChannel: 100,
      channels: movingHeadOneFixtureChannels,
      movement: {
        stageInterval: 60,
        stages: [
          {speed: 0, channelValues: [100, 40]},
        ]
      },
      group: 'moving-head'
    },
  ],
  groups: [
    {
    id: 'par'
    },
    {
      id: 'moving-head-1'
    }
  ]
};

export function getConfig() {
  return config;
}
