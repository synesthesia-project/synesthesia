export interface StaticChannel {
  kind: 'static';
  value: number;
}

export interface ColourChannel {
  kind: 'color';
  color: 'r' | 'g' | 'b' | 'w';
}

export interface MovementChannel {
  kind: 'movement';
  dimension: 'level' | 'vertical';
}

export interface SpeedChannel {
  kind: 'speed';
}

export interface StrobeChannel {
  kind: 'strobe';
}

export type Channel = StaticChannel | ColourChannel | MovementChannel | SpeedChannel | StrobeChannel;

export interface FixtureMovement {
  /** Number of frames to be in each stage */
  stageInterval: number;
  stages: {
    speed: number;
    /** DMX values for each of the movement channels */
    channelValues: number[];
  }[];
}

export interface Fixture {
  universe: number;
  startChannel: number;
  channels: Channel[];
  group: string;
  brightness?: number;
  position?: number;
  movement?: FixtureMovement;
}

export interface Group {
  id: string;
  subGroups?: Group[];
}

export interface Config {
  fixtures: Fixture[];
  groups: Group[];
  settings: {
    /** How many milliseconds it should take to come in and out of blackout */
    blackoutTransitionTime: 1000;
  };
}

const fixtures: Fixture[] = [];

const simpleRgbFixtureChannels: Channel[] = [
  {kind: 'color', color: 'r'},
  {kind: 'color', color: 'g'},
  {kind: 'color', color: 'b'}
];

// Small Hexigons
fixtures.push(...[1, 4, 10, 13, 16, 19, 28, 31, 37, 40, 46, 52, 70, 73, 79].map<Fixture>(startChannel => ({
  universe: 0,
  startChannel,
  channels: simpleRgbFixtureChannels,
  group: 'hex-small'
})));

// Medium Hexigons
fixtures.push(...[7, 25, 43, 49, 61, 64, 76].map<Fixture>(startChannel => ({
  universe: 0,
  startChannel,
  channels: simpleRgbFixtureChannels,
  group: 'hex-med'
})));

// Big Hexigons
fixtures.push(...[22, 34, 55, 58].map<Fixture>(startChannel => ({
  universe: 0,
  startChannel,
  channels: simpleRgbFixtureChannels,
  group: 'hex-big'
})));

const config: Config = {
  fixtures,
  groups: [{
    id: 'hex',
    subGroups: [
      {id: 'hex-big'},
      {id: 'hex-med'},
      {id: 'hex-small'}
    ]
  }],
  settings: {
    blackoutTransitionTime: 1000
  }
};

export function getConfig() {
  return config;
}
