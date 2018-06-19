export type ChannelKind = 'r' | 'g' | 'b';

import {ChannelKind, Channel, Fixture, Group, Config} from './';

const fixtures: Fixture[] = [];

const simpleRgbFixtureChannels: Channel[] = [
  {kind: 'r'},
  {kind: 'g'},
  {kind: 'b'}
];

// Small Hexigons
fixtures.push(...[1, 4, 7, 10, 13, 16].map<Fixture>(startChannel => ({
  universe: 0,
  startChannel,
  channels: simpleRgbFixtureChannels,
  group: 'par'
})));

const config: Config = {
  fixtures,
  groups: [{
    id: 'par'
  }]
};

export function getConfig() {
  return config;
}
