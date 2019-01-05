import * as lightDesk from '@synesthesia-project/light-desk';

import {PlayStateData} from '@synesthesia-project/core/protocol/messages';
import {CueFile} from '@synesthesia-project/core/file';
import {
    prepareFile,
    getActiveEvents,
    getCurrentEventStateValue
  } from '@synesthesia-project/core/file/file-usage';

import {DmxProxy} from '../dmx/proxy';
import * as config from '../config';
import * as util from '../util';

import {RGBColor, RGB_BLACK, RGB_WHITE, randomRGBColorPallete} from './colors';
import {Interval} from './interval';

const INTERVAL = 1000 / 44;
const CHANGE_INTERVAL = 60 * 1000;
const BRIGHTNESS_TRANSITION_STEP = 0.03;

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

interface Sprite {
  color: RGBColor;
  position: number;
  size: number;
  minPosition: number;
  maxPosition: number;
  speed: number;
}

interface SpritePattern {
  patternType: 'sprite';
  sprite: Sprite;
  position: number;
}

type FixturePattern = RGBChasePattern | SpritePattern;

type FixturePatternAndOpacity = {
  pattern: FixturePattern;
  opacity: number;
};

type LayeredFixturePattern = FixturePatternAndOpacity[];

interface FixtureMovementPattern {
  stage: number;
  /** Number of frames the stage has been active for */
  stageTime: number;
}

type Pattern = {
  type: 'single';
  /** Current Pattern */
  pattern: LayeredFixturePattern;
} | {
  type: 'transition';
  /** Current Pattern */
  pattern: Pattern;
  next: LayeredFixturePattern;
  frame: number;
  transitionTime: number;
};

function singlePattern(pattern: LayeredFixturePattern): Pattern {
  return {
    type: 'single',
    pattern
  };
}

function transition(prev: Pattern, next: LayeredFixturePattern): Pattern {
  return {
    type: 'transition',
    pattern: prev,
    next,
    frame: 0,
    transitionTime: 60
  };
}

interface FixtureLayout {
  config: config.Fixture;
  /** The layers that contribute to the colour pattern displayed for this fixture */
  pattern: Pattern;
  movement?: FixtureMovementPattern;
}

/*
 * Describes what we're currently displaying on the fixures, and how we're
 * taking into account the synesthesia data to modify the display
 */
interface Layout {
  /** Value from 0 to 1 representing brightness of the whole display */
  masterBrightness: number;
  /** If set, then transition the value of the masterBrightness to the given brightness */
  transitionMasterBrightness: number | null;
  colorPallete: RGBColor[];
  sprites: Set<Sprite>;
  timing: RGBChaseTiming;
  fixtures: FixtureLayout[];
  blackout: boolean;
  /**
   * Brightness used for blackout fading in / out
   */
  blackoutBrightness: number;
  /**
   * How long it takes to fade in / out from blackout
   */
  blackoutTransitionTime: number;
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

function randomSprite(color: RGBColor, position: {min: number; max: number}, speed = 0.2, size = 1.5): Sprite {
  return {
    color,
    position: position.min + (position.max - position.min) * Math.random(),
    size,
    minPosition: position.min - size,
    maxPosition: position.max + size,
    speed
  };
}

const randomThing = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

function randomSpriteState(fixture: FixtureLayout & {config: {position: number}}, sprite: Sprite): SpritePattern {
  return {
    patternType: 'sprite',
    sprite,
    position: fixture.config.position
  };
}

function calculatePositionRange(fixtures: FixtureLayout[]) {
  let val: {min: number, max: number} | null = null;
  if (fixtures.length === 0) return {min: 0, max: 0};
  for (const f of fixtures) {
    if (!f.config.position) continue;
    if (!val) {
      val = {min: f.config.position, max: f.config.position};
    } else {
      val.min = Math.min(val.min, f.config.position);
      val.max = Math.max(val.max, f.config.position);
    }
  }
  if (!val) return {min: 0, max: 0};
  return val;
}

function positionedFixture(fixture: FixtureLayout): fixture is FixtureLayout & {config: {position: number}} {
   return !!fixture.config.position;
}

/** between 0 and 1 */
function calculateProximity(sprite: Sprite, position: number): number {
  return Math.max(0, sprite.size - Math.abs(sprite.position - position));
}

export interface DisplayListener {
  masterBrightnessChanges?: (brightness: number) => void;
}

interface Desk {
  desk: lightDesk.Group;
  blackout: lightDesk.Switch;
}

export class Display {

  private readonly config: config.Config;
  private readonly dmx: DmxProxy;
  // Mapping form universe to buffers
  private readonly buffers: {[id: number]: Int8Array} = {};
  private readonly layout: Layout;
  private playState: PlayStateData | null;

  private readonly transitionInterval: Interval;
  private readonly colorInterval: Interval;

  private readonly listeners = new Set<DisplayListener>();

  private desk: Desk | null = null;

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
    const fixtures: FixtureLayout[] = config.fixtures.map(config => ({config, pattern: singlePattern([])}));

    this.layout = {
      masterBrightness: 1,
      transitionMasterBrightness: null,
      sprites: new Set<Sprite>(),
      colorPallete,
      timing,
      fixtures,
      blackout: false,
      // Start with 0 so it fades in on start
      blackoutBrightness: 0,
      blackoutTransitionTime: config.settings.blackoutTransitionTime
    };

    // Calculation of next coolor requires layout to be ready
    this.layout.fixtures = this.generateNextPattern().map((pattern, i) => ({
      config: config.fixtures[i],
      pattern: singlePattern(pattern)
    }));

    this.transitionInterval = new Interval(this.transitionToNextPattern.bind(this), CHANGE_INTERVAL);
    this.colorInterval = new Interval(this.pickNextColorPalette.bind(this), CHANGE_INTERVAL * 3);
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
      const fixturePatterns: FixturePatternAndOpacity[] = this.config.fixtures.map(config => ({
        pattern: randomRGBChaseState(colorPallete, groupsToLayers[config.group], this.layout.timing),
        opacity: 1
      }));

      for (let i = 0; i < this.layout.fixtures.length; i++) {
        this.layout.fixtures[i].pattern = singlePattern([fixturePatterns[i]]);
      }
    }
    console.log('newSynesthesiaPlayState', this.playState );
  }

  /**
   * Generate a new random pattern / display, and transition all fixtures to it
   */
  private transitionToNextPattern() {
    const pattern = this.generateNextPattern();
    for (let i = 0; i < this.layout.fixtures.length; i++) {
      this.layout.fixtures[i].pattern = transition(this.layout.fixtures[i].pattern, pattern[i]);
    }
  }

  private pickNextColorPalette() {
    this.layout.colorPallete = randomRGBColorPallete();
  }

  private generateNextPattern(): LayeredFixturePattern[] {
    const colorPallete = this.layout.colorPallete;
    const patterns = ['rgbChase' as 'rgbChase', 'chaseAndSprite' as 'chaseAndSprite', 'sprite' as 'sprite'];
    let pattern = randomThing(patterns);
    const positionRange = calculatePositionRange(this.layout.fixtures);
    const sprites: Sprite[] = [];
    if (pattern === 'chaseAndSprite') {
      sprites[0] = randomSprite(Math.random() > 0.6 ? RGB_WHITE : randomThing(colorPallete), positionRange, Math.random() * 0.3 + 0.05);
      this.layout.sprites.add(sprites[0]);
    }
    if (pattern === 'sprite') {
      sprites[0] = randomSprite(randomThing(colorPallete), positionRange, Math.random() * 0.3 + 0.03, Math.random() * 1 + 0.5);
      if (Math.random() > 0.5) sprites[0].speed *= -1;
      this.layout.sprites.add(sprites[0]);
    }
    return this.layout.fixtures.map(fixture => {
      let targetLayers: number[] = [];
      for (const layer of (fixture.pattern.type === 'single' ? fixture.pattern.pattern : fixture.pattern.next)) {
        if (layer.pattern.patternType === 'rgbChase')
          targetLayers = layer.pattern.targetLayers;
      }
      if (pattern === 'chaseAndSprite' && positionedFixture(fixture)) {
        const pattern: LayeredFixturePattern = [
          {
            pattern: randomRGBChaseState(colorPallete, targetLayers, this.layout.timing),
            opacity: 0.7
          },
          {
            pattern: randomSpriteState(fixture, sprites[0]),
            opacity: 1
          }
        ];
        return pattern;
      } else if (pattern === 'sprite' && positionedFixture(fixture)) {
        const pattern: LayeredFixturePattern = sprites.map(sprite => ({
          pattern: randomSpriteState(fixture, sprite),
          opacity: 1
        }));
        return pattern;
      } else {
        const pattern: LayeredFixturePattern = [
          {
            pattern: randomRGBChaseState(colorPallete, targetLayers, this.layout.timing),
            opacity: 1
          }
        ];
        return pattern;
      }
    });
  }

  private calculateAndIncrementLayeredFixturePattern(
      layerStates: LayerState[], fixture: config.Fixture, pattern: LayeredFixturePattern): RGBColor {
    let color = RGB_BLACK;
    for (const layer of pattern) {
      if (layer.pattern.patternType === 'rgbChase') {
        let currentColor = this.calculateRGBChasePatternColor(layer.pattern);
        let brightness = 1;
        if (layerStates.length > 0 && layer.pattern.targetLayers.length > 0) {
          brightness = Math.max.apply(null, layer.pattern.targetLayers.map(layer =>
            layerStates[layer].brightness
          ));
          if (fixture.group === 'hex-small') {
            brightness = brightness * 0.7 + 0.15;
          }
        }
        currentColor = currentColor.overlay(RGB_BLACK, 1 - brightness);
        this.incrementRGBChasePatternColor(layer.pattern);
        color = color.add(RGB_BLACK.overlay(currentColor, layer.opacity));
      } else if (layer.pattern.patternType === 'sprite') {
        const proximity = calculateProximity(layer.pattern.sprite, layer.pattern.position);
        // Alter colour brightness as appropriate
        color = color.add(RGB_BLACK.overlay(layer.pattern.sprite.color, proximity * layer.opacity));
      } else {
        throw new Error('not implemnted');
      }
    }
    return color;
  }

  private calculateAndIncrementPatternState(layerStates: LayerState[], fixture: config.Fixture, parent: {pattern: Pattern}): RGBColor {
    if (parent.pattern.type === 'single') {
      return this.calculateAndIncrementLayeredFixturePattern(layerStates, fixture, parent.pattern.pattern);
    } else {
      const prevColor =  this.calculateAndIncrementPatternState(layerStates, fixture, parent.pattern);
      const nextColor = this.calculateAndIncrementLayeredFixturePattern(layerStates, fixture, parent.pattern.next);
      const color = prevColor.overlay(nextColor, parent.pattern.frame / parent.pattern.transitionTime);
      parent.pattern.frame++;
      if (parent.pattern.frame >= parent.pattern.transitionTime) {
        // TODO: When finishing the transition, garbage collect certain things,
        // e.g. sprites used in parent.pattern.pattern (which we dereference here)
        parent.pattern = singlePattern(parent.pattern.next);
      }
      return color;
    }
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

    // Increment global states

    // Adjust brightness for blackout if transitioning
    const blackoutAdjust = 1 / this.layout.blackoutTransitionTime * INTERVAL;
    if (this.layout.blackout && this.layout.blackoutBrightness > 0) {
      this.layout.blackoutBrightness -= blackoutAdjust;
      if (this.layout.blackoutBrightness < 0) this.layout.blackoutBrightness = 0;
    } else if (!this.layout.blackout && this.layout.blackoutBrightness < 1) {
      this.layout.blackoutBrightness += blackoutAdjust;
      if (this.layout.blackoutBrightness > 1) this.layout.blackoutBrightness = 1;
    }

    // Transition master brightness if needed
    if (this.layout.transitionMasterBrightness !== null) {
      if (this.layout.masterBrightness < this.layout.transitionMasterBrightness) {
        this.layout.masterBrightness += BRIGHTNESS_TRANSITION_STEP;
        if (this.layout.masterBrightness > this.layout.transitionMasterBrightness) {
          this.layout.masterBrightness = this.layout.transitionMasterBrightness;
          this.layout.transitionMasterBrightness = null;
        }
      } else {
        this.layout.masterBrightness -= BRIGHTNESS_TRANSITION_STEP;
        if (this.layout.masterBrightness < this.layout.transitionMasterBrightness) {
          this.layout.masterBrightness = this.layout.transitionMasterBrightness;
          this.layout.transitionMasterBrightness = null;
        }
      }
      for (const listener of this.listeners) {
        if (listener.masterBrightnessChanges) {
          listener.masterBrightnessChanges(this.layout.masterBrightness);
        }
      }
    }

    // Move sprites
    for (const sprite of this.layout.sprites) {
      sprite.position += sprite.speed;
      if (sprite.position > sprite.maxPosition)
        sprite.position = sprite.minPosition;
      if (sprite.position < sprite.minPosition)
        sprite.position = sprite.maxPosition;
    }

    // Calculate the state for each fixture
    for (let i = 0; i < this.config.fixtures.length; i++) {
      const fixture = this.config.fixtures[i];
      const layout = this.layout.fixtures[i];

      let color = this.calculateAndIncrementPatternState(layerStates, fixture, layout);
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
    const adjustedColor = color
      .overlay(RGB_BLACK, 1 - this.layout.masterBrightness)
      .overlay(RGB_BLACK, 1 - this.layout.blackoutBrightness);
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

  public getLightDesk(): lightDesk.Group {
    if (this.desk) return this.desk.desk;

    const deskGroup = new lightDesk.Group({direction: 'vertical'});

    const intervals = new lightDesk.Group({direction: 'horizontal', noBorder: true});
    deskGroup.addChild(intervals);

    intervals.addChild(this.transitionInterval.lightDeskGroup('Transition'));
    intervals.addChild(this.colorInterval.lightDeskGroup('Randomize Color'));

    const dimmersGroup = new lightDesk.Group();
    deskGroup.addChild(dimmersGroup);

    const masterBrightness = new lightDesk.Slider(this.layout.masterBrightness, 0, 1, 0.05);
    this.addListener({
      masterBrightnessChanges: value => masterBrightness.setValue(value)
    });
    masterBrightness.addListener(value => this.setMasterBrightness(value));
    dimmersGroup.addChild(new lightDesk.Label('Master Dimmer:'));
    dimmersGroup.addChild(masterBrightness);

    const blackout = new lightDesk.Switch('off');
    blackout.addListener(blackout => this.setBlackout(blackout === 'on'));
    dimmersGroup.addChild(new lightDesk.Label('Blackout:'));
    dimmersGroup.addChild(blackout);

    const waitTime = new lightDesk.Slider(this.layout.timing.waitTime, 0, 600, 5);
    waitTime.addListener(value => this.layout.timing.waitTime = value);
    dimmersGroup.addChild(new lightDesk.Label('Delay Time:'));
    dimmersGroup.addChild(waitTime);

    const transitionTime = new lightDesk.Slider(this.layout.timing.transitionTime, 0, 600, 5);
    transitionTime.addListener(value => this.layout.timing.transitionTime = value);
    dimmersGroup.addChild(new lightDesk.Label('Transition Time:'));
    dimmersGroup.addChild(transitionTime);

    this.desk = {
      desk: deskGroup,
      blackout
    };

    return deskGroup;
  }

  public addListener(listener: DisplayListener) {
    this.listeners.add(listener);
  }

  public removeListener(listener: DisplayListener) {
    this.listeners.delete(listener);
  }

  public setMasterBrightness(value: number) {
    value = Math.max(0, Math.min(1, value));
    this.layout.masterBrightness = value;
    this.layout.transitionMasterBrightness = null;
    for (const listener of this.listeners) {
      if (listener.masterBrightnessChanges) {
        listener.masterBrightnessChanges(value);
      }
    }
  }

  public transitionMasterBrightness(value: number) {
    value = Math.max(0, Math.min(1, value));
    this.layout.transitionMasterBrightness = value;
  }

  public setBlackout(value: boolean) {
    console.log('Set Blackout:', value);
    this.layout.blackout = value;
    if (this.desk)
      this.desk.blackout.setValue(value ? 'on' : 'off');
  }


}
