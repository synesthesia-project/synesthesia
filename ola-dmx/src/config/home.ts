export type ChannelKind = 'r' | 'g' | 'b';

import {ChannelKind, Channel, Fixture, Group, Config} from './';

const fixtures: Fixture[] = [];

const simpleRgbFixtureChannels: Channel[] = [
  {kind: 'r'},
  {kind: 'g'},
  {kind: 'b'}
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
      group: 'par',
      brightness: 0.1
    },
    {
      universe: 0,
      startChannel: 7,
      channels: simpleRgbFixtureChannels,
      group: 'par',
      brightness: 0
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
  ],
  groups: [{
    id: 'par'
  }]
};

export function getConfig() {
  return config;
}
