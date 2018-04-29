import {PlayStateData} from '../shared/protocol/messages';
import {CueFile} from '../shared/file/file';
import {
    PreparedFile,
    prepareFile,
    getActiveEvents,
    getCurrentEventStateValue
  } from '../shared/file/file-usage';

import {DmxProxy} from '../dmx/proxy';
import * as config from '../config';
import {RGBColor} from './colors';

const INTERVAL = 1000 / 44;

const PURPLE = new RGBColor(200, 0, 255);
const BLUE = new RGBColor(0, 50, 255);

interface RGBChasePattern {
  patternType: 'rgbChase';
  colors: RGBColor[];
  /* How much we should change between colors per frame */
  speed: number;
  currentColor: number;
  currentTransitionAmount: number;
}

type FixturePattern = RGBChasePattern;

/*
 * Describes what we're currently displaying on the fixures, and how we're
 * taking into account the synesthesia data to modify the display
 */
interface Layout {
  fixtures: FixturePattern[];
}

function randomRGBChaseState(colors: RGBColor[]): RGBChasePattern {
  return {
    patternType: 'rgbChase',
    colors,
    speed: 0.02,
    currentColor: Math.floor(Math.random() * colors.length),
    currentTransitionAmount: Math.random()
  };
}

export class Display {

  private readonly config: config.Config;
  private readonly dmx: DmxProxy;
  // Mapping form universe to buffers
  private readonly buffers: {[id: number]: Int8Array} = {};
  private readonly layout: Layout;
  private playState: PlayStateData | null;

  public constructor(config: config.Config, dmx: DmxProxy) {
    this.config = config;
    this.dmx = dmx;
    this.newSynesthesiaPlayState = this.newSynesthesiaPlayState.bind(this);
    // create one buffer for each universe we have
    for (const fixture of config.fixtures) {
      if (!this.buffers[fixture.universe])
        this.buffers[fixture.universe] = new Int8Array(512);
    }
    // create the layout, do a random chaser for now for every fixture
    const fixtures: FixturePattern[] = config.fixtures.map(config => {
      return randomRGBChaseState([PURPLE, BLUE]);
    });

    this.layout = {fixtures};
  }

  public newSynesthesiaPlayState(state: PlayStateData | null): void {
    this.playState = state ? {
      effectiveStartTimeMillis: state.effectiveStartTimeMillis,
      file: prepareFile(state.file)
    } : null;
    console.log('newSynesthesiaPlayState', this.playState );
  }

  private frame() {

    for (let i = 0; i < this.config.fixtures.length; i++) {
      const fixture = this.config.fixtures[i];
      const pattern = this.layout.fixtures[i];
      if (pattern.patternType === 'rgbChase') {
        const currentColor = this.calculateRGBChasePatternColor(pattern);
        this.setFixtureRGBColor(fixture, currentColor);
        this.incrementRGBChasePatternColor(pattern);
      }
    }

    if (this.playState) {
      const positionMillis = new Date().getTime() - this.playState.effectiveStartTimeMillis;

      let brightness = 0;

      // Base brightness on percussion layer
      for (const layer of this.playState.file.layers) {
        if (layer.kind === 'percussion') {
          const activeEvents = getActiveEvents(layer.events, positionMillis);
          if (activeEvents.length > 0) {
            for (const event of activeEvents) {
              const amplitude = getCurrentEventStateValue(event, positionMillis, s => s.amplitude);
              brightness = Math.max(brightness, amplitude);
            }
          }
        }
      }
    }

    // Write Universes
    for (const universe of Object.keys(this.buffers)) {
      this.dmx.writeDmx(Number(universe), this.buffers[universe]);
    }
  }

  private incrementRGBChasePatternColor(pattern: RGBChasePattern) {
    pattern.currentTransitionAmount += pattern.speed;
    if (pattern.currentTransitionAmount >= 1) {
      pattern.currentTransitionAmount -= 1;
      pattern.currentColor++;
      if (pattern.currentColor >= pattern.colors.length) {
        pattern.currentColor = 0;
      }
    }
  }

  private calculateRGBChasePatternColor(pattern: RGBChasePattern) {
    const colorA = pattern.colors[pattern.currentColor];
    const colorBIndex = pattern.currentColor === pattern.colors.length - 1 ?
      0 : pattern.currentColor + 1;
    const colorB = pattern.colors[colorBIndex];
    return colorA.overlay(colorB, pattern.currentTransitionAmount);
  }

  private setFixtureRGBColor(fixture: config.Fixture, color: RGBColor) {
    let rChannel = -1, gChannel = -1, bChannel = -1;
    for (let i = 0; i < fixture.channels.length; i++) {
      const channel = fixture.channels[i];
      if (channel.kind === 'r') {
        rChannel = fixture.startChannel + i;
      } else if (channel.kind === 'g') {
        gChannel = fixture.startChannel + i;
      } else if (channel.kind === 'b') {
        bChannel = fixture.startChannel + i;
      }
    }
    if (rChannel >= 0 && gChannel >= 0 && bChannel >= 0) {
      this.setDMXBufferValue(fixture.universe, rChannel, color.r);
      this.setDMXBufferValue(fixture.universe, gChannel, color.g);
      this.setDMXBufferValue(fixture.universe, bChannel, color.b);
    }
  }

  private setDMXBufferValue(universe: number, channel: number, value: number) {
    this.buffers[universe][channel - 1] = value;
  }

  public run() {
    setInterval(this.frame.bind(this), INTERVAL);
  }
}
