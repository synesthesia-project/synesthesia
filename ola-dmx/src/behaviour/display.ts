import {PlayStateData} from '../shared/protocol/messages';
import {CueFile} from '../shared/file/file';
import {
    prepareFile,
    getActiveEvents,
    getCurrentEventStateValue
  } from '../shared/file/file-usage';

import {DmxProxy} from '../dmx/proxy';
import * as config from '../config';
import * as util from '../util';
import {RGBColor, RGB_BLACK, randomRGBColorPallete} from './colors';

const INTERVAL = 1000 / 44;
const CHANGE_INTERVAL = 60 * 1000;

/** The state of a particular layer in a synesthesia track, to be used to inform any fixture using this information how to display itself */
interface LayerState {
  brightness: number;
}

interface RGBChaseTiming {
  /** How many frames should we wait before transitioning */
  waitTime: number;
  /** How many frames should it take to transition */
  transitionTime: number;
}

interface RGBChasePattern {
  patternType: 'rgbChase';
  colors: RGBColor[];
  timing: RGBChaseTiming;
  currentColor: number;
  /** Number of frames we've been on the current color for */
  currentColorTime: number;
  /** Which synesthesia layers are affecting the display of this pattern */
  targetLayers: number[];
}

type FixturePattern = RGBChasePattern;

type LayeredFixturePattern = FixturePattern[];

interface FixtureMovementPattern {
  stage: number;
  /** Number of frames the stage has been active for */
  stageTime: number;
}

interface FixtureLayout {
  /** The layers that contribute to the colour pattern displayed for this fixture */
  pattern: LayeredFixturePattern;
  nextPattern?: {
    pattern: LayeredFixturePattern;
    frame: number;
    transitionTime: number;
  };
  movement?: FixtureMovementPattern;
}

/*
 * Describes what we're currently displaying on the fixures, and how we're
 * taking into account the synesthesia data to modify the display
 */
interface Layout {
  /** Value from 0 to 1 representing brightness of the whole display */
  masterBrightness: number;
  colorPallete: RGBColor[];
  timing: RGBChaseTiming;
  fixtures: FixtureLayout[];
}

function randomRGBChaseState(colors: RGBColor[], targetLayers: number[], timing: RGBChaseTiming): RGBChasePattern {
  return {
    patternType: 'rgbChase',
    colors,
    timing,
    currentColor: Math.floor(Math.random() * colors.length),
    currentColorTime: util.randomInt(0, 40 + 20),
    targetLayers
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
    const colorPallete = randomRGBColorPallete();
    const timing = {waitTime: 0, transitionTime: 40};
    const fixtures: FixtureLayout[] = config.fixtures.map(config => ({
      pattern: [randomRGBChaseState(colorPallete, [-1], timing)]
    }));

    this.layout = {masterBrightness: 1, colorPallete, timing, fixtures};

    setInterval(this.transitionToNextPattern.bind(this), CHANGE_INTERVAL);
    let up = false;
    setInterval(
      () => {
        if (up) {
          this.layout.masterBrightness += 0.01;
          if (this.layout.masterBrightness > 1) {
            up = false;
            this.layout.masterBrightness = 1;
          }
        } else {
          this.layout.masterBrightness -= 0.01;
          if (this.layout.masterBrightness < 0) {
            up = true;
            this.layout.masterBrightness = 0;
          }
        }
      },
      10);
  }

  public newSynesthesiaPlayState(state: PlayStateData | null): void {
    this.playState = state ? {
      effectiveStartTimeMillis: state.effectiveStartTimeMillis,
      file: prepareFile(state.file)
    } : null;
    if (this.playState) {
      // Mapping from groups to list of synesthesia layers it's targeting
      const groupsToLayers: {[id: string]: number[]} = {};
      for (const fixture of this.config.fixtures)
        groupsToLayers[fixture.group] = [];

      // Assign a group to each layer
      for (let i = 0; i < this.playState.file.layers.length; i++) {
        // find the group with the least number of layers
        let currentMinGroup: {group: string, layersCount: number} | null = null;
        for (const group of Object.keys(groupsToLayers)) {
          const layersCount = groupsToLayers[group].length;
          if (currentMinGroup === null || currentMinGroup.layersCount > layersCount)
            currentMinGroup = {group, layersCount};
        }
        if (currentMinGroup)
          groupsToLayers[currentMinGroup.group].push(i);
      }
      // For every group, if it has no layers, randomly pick one
      for (const group of Object.keys(groupsToLayers)) {
        if (groupsToLayers[group].length === 0)
          groupsToLayers[group].push(Math.floor(Math.random() * this.playState.file.layers.length));
      }
      // create the layout, do a random chaser for now for every fixture
      const colorPallete = randomRGBColorPallete();
      const fixturePatterns: RGBChasePattern[] = this.config.fixtures.map(config =>
        randomRGBChaseState(colorPallete, groupsToLayers[config.group], this.layout.timing)
      );

      for (let i = 0; i < this.layout.fixtures.length; i++) {
        this.layout.fixtures[i].pattern = [fixturePatterns[i]];
        this.layout.fixtures[i].nextPattern = undefined;
      }
    }
    console.log('newSynesthesiaPlayState', this.playState );
  }

  /**
   * Generate a new random pattern / display, and transition all fixtures to it
   */
  private transitionToNextPattern() {
    const colorPallete = this.layout.colorPallete = randomRGBColorPallete();
    for (const fixture of this.layout.fixtures) {
      const pattern: LayeredFixturePattern = fixture.pattern.map(layer =>
        randomRGBChaseState(colorPallete, layer.targetLayers, this.layout.timing)
      );
      fixture.nextPattern = {pattern, frame: 0, transitionTime: 60};
    }
  }

  private calculateAndIncrementPatternState(layerStates: LayerState[], fixture: config.Fixture, pattern: LayeredFixturePattern): RGBColor {
    let color = RGB_BLACK;
    for (const layer of pattern) {
      if (layer.patternType === 'rgbChase') {
        let currentColor = this.calculateRGBChasePatternColor(layer);
        let brightness = 1;
        if (layerStates.length > 0 && layer.targetLayers.length > 0) {
          brightness = Math.max.apply(null, layer.targetLayers.map(layer =>
            layerStates[layer].brightness
          ));
          if (fixture.group === 'hex-small') {
            brightness = brightness * 0.7 + 0.15;
          }
        }
        currentColor = currentColor.overlay(RGB_BLACK, 1 - brightness);
        this.incrementRGBChasePatternColor(layer);
        color = color.add(currentColor);
      } else {
        throw new Error('not implemnted');
      }
    }
    return color;
  }

  private frame() {

    /** The current states of the layers of the synesthesia track, if currently playing something */
    let layerStates: LayerState[] = [];

    if (this.playState) {
      const positionMillis = new Date().getTime() - this.playState.effectiveStartTimeMillis;

      for (const layer of this.playState.file.layers) {
        const state: LayerState = {
          brightness: 0
        };
        layerStates.push(state);
        if (layer.kind === 'percussion') {
          const activeEvents = getActiveEvents(layer.events, positionMillis);
          if (activeEvents.length > 0) {
            for (const event of activeEvents) {
              const amplitude = getCurrentEventStateValue(event, positionMillis, s => s.amplitude);
              state.brightness = Math.max(state.brightness, amplitude);
            }
          }
        }
      }
    }

    for (let i = 0; i < this.config.fixtures.length; i++) {
      const fixture = this.config.fixtures[i];
      const layout = this.layout.fixtures[i];

      let color = this.calculateAndIncrementPatternState(layerStates, fixture, layout.pattern);
      if (layout.nextPattern) {
        const nextColor = this.calculateAndIncrementPatternState(layerStates, fixture, layout.nextPattern.pattern);
        color = color.overlay(nextColor, layout.nextPattern.frame / layout.nextPattern.transitionTime);
        layout.nextPattern.frame++;
        if (layout.nextPattern.frame >= layout.nextPattern.transitionTime) {
          layout.pattern = layout.nextPattern.pattern;
          layout.nextPattern = undefined;
        }
      }
      if (fixture.brightness !== undefined)
        color = color.overlay(RGB_BLACK, 1 - fixture.brightness);
      this.setFixtureRGBColor(fixture, color);

      // Update static static channels
      for (let i = 0; i < fixture.channels.length; i++) {
        const channel = fixture.channels[i];
        if (channel.kind === 'static') {
          this.setDMXBufferValue(fixture.universe, fixture.startChannel + i, channel.value);
        }
      }

      // Update movement
      if (fixture.movement && fixture.movement.stages.length > 0) {
        if (!layout.movement) {
          layout.movement = {
            stage: 0, stageTime: 0
          };
        }

        const stage = fixture.movement.stages[layout.movement.stage];

        // Set channel values
        let stageChannelIndex = 0;
        for (let i = 0; i < fixture.channels.length; i++) {
          const channel = fixture.channels[i];
          if (channel.kind === 'movement' && stageChannelIndex < stage.channelValues.length) {
            const val = stage.channelValues[stageChannelIndex];
            stageChannelIndex++;
            this.setDMXBufferValue(fixture.universe, fixture.startChannel + i, val);
          } else if (channel.kind === 'speed') {
            this.setDMXBufferValue(fixture.universe, fixture.startChannel + i, stage.speed);
          }
        }

        // Increment Stage
        layout.movement.stageTime++;
        if (layout.movement.stageTime > fixture.movement.stageInterval) {
          layout.movement.stage++;
          layout.movement.stageTime = 0;
          if (layout.movement.stage >= fixture.movement.stages.length) {
            layout.movement.stage = 0;
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
    pattern.currentColorTime ++;
    if (pattern.currentColorTime >= pattern.timing.waitTime + pattern.timing.transitionTime) {
      pattern.currentColorTime = 0;
      pattern.currentColor++;
      if (pattern.currentColor >= pattern.colors.length) {
        pattern.currentColor = 0;
      }
    }
  }

  private calculateRGBChasePatternColor(pattern: RGBChasePattern) {
    if (pattern.currentColorTime < pattern.timing.waitTime)
      return pattern.colors[pattern.currentColor];
    const colorA = pattern.colors[pattern.currentColor];
    const colorBIndex = pattern.currentColor === pattern.colors.length - 1 ?
      0 : pattern.currentColor + 1;
    const colorB = pattern.colors[colorBIndex];
    return colorA.transition(colorB, (pattern.currentColorTime - pattern.timing.waitTime) / pattern.timing.transitionTime);
  }

  private setFixtureRGBColor(fixture: config.Fixture, color: RGBColor) {
    const adjustedColor = color.overlay(RGB_BLACK, 1 - this.layout.masterBrightness);
    let rChannel = -1, gChannel = -1, bChannel = -1;
    for (let i = 0; i < fixture.channels.length; i++) {
      const channel = fixture.channels[i];
      if (channel.kind === 'color') {
        if (channel.color === 'r') {
          rChannel = fixture.startChannel + i;
        } else if (channel.color === 'g') {
          gChannel = fixture.startChannel + i;
        } else if (channel.color === 'b') {
          bChannel = fixture.startChannel + i;
        }
      }
    }
    if (rChannel >= 0 && gChannel >= 0 && bChannel >= 0) {
      this.setDMXBufferValue(fixture.universe, rChannel, adjustedColor.r);
      this.setDMXBufferValue(fixture.universe, gChannel, adjustedColor.g);
      this.setDMXBufferValue(fixture.universe, bChannel, adjustedColor.b);
    }
  }

  private setDMXBufferValue(universe: number, channel: number, value: number) {
    this.buffers[universe][channel - 1] = value;
  }

  public run() {
    setInterval(this.frame.bind(this), INTERVAL);
  }
}
