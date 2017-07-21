import {PlayStateData} from '../shared/protocol/messages';

import {LEDStripBackend} from '../backends/backends';
import {Color, Colors} from '../data/colors';
import {SynesthesiaDisplay} from './synesthesia-display';

const MAX_SPARKLINESS = 10;

interface Artifact {
  /** between 0 and 1 */
  width: number;
  /** between 0 and 1 */
  position: number;
  positionSpeed: number;
  life: number;
  lifeSpeed: number;
}

interface Sparkle {
  pos: number;
  life: number;
  lifeSpeed: number;
}

function genRandomArtifact(maxWidth: number): Artifact {
  return {
    width: getRandomArbitrary(maxWidth / 3, maxWidth),
    position: Math.random(),
    positionSpeed: (Math.random() < 0.5 ? 1 : -1) * getRandomArbitrary(0.001, 0.005),
    life: 0,
    lifeSpeed: getRandomArbitrary(0.001, 0.005)
  };
}

function getRandomArbitrary(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export interface StripBehaviorState {
  idleBrightness: number;
  primaryColor: Color;
  secondaryColor: Color;
  sparkleColor: Color;
  primaryArtifacts: number;
  secondaryArtifacts: number;
  /** Between 0 and 5 */
  sparkliness: number;
}

type StripBehaviorListener = (state: StripBehaviorState) => void;

export class StripBehavior {

  private readonly numberOfLeds: number;
  private readonly backend: LEDStripBackend;
  private readonly buffer: Buffer;
  private intervalID: NodeJS.Timer;

  private state: StripBehaviorState;
  private synesthesiaDisplay: SynesthesiaDisplay | null = null;

  private listeners: StripBehaviorListener[] = [];

  constructor(numberOfLeds: number, backend: LEDStripBackend) {
    this.numberOfLeds = numberOfLeds;
    this.backend = backend;
    this.buffer = new Buffer(numberOfLeds * 3);

    backend.setupBuffer(this.buffer);
    backend.addReadyListener(this.connected.bind(this));
    backend.addDisconnectedListener(this.disconnected.bind(this));

    this.state = {
      idleBrightness: 0.3,
      primaryColor: new Color(50, 0, 255),
      secondaryColor: new Color(255, 0, 50),
      sparkleColor: new Color(255, 255, 255),
      primaryArtifacts: 5,
      secondaryArtifacts: 3,
      sparkliness: 7
    };

    // Zero-Out buffer
    for (let i = 0; i < numberOfLeds; i++)
      this.setPixel(i, this.state.primaryColor);
  }

  public addListener(listener: StripBehaviorListener) {
    this.listeners.push(listener);
    listener(this.state);
  }

  public updateState(state: Partial<StripBehaviorState>) {
    for (const key of Object.keys(state)) {
      const val: number | Color = state[key];
      if (val === undefined) continue;
      if (val instanceof Color) {
        if (!val.equals(this.state[key]))
          this.state[key] = val;
      } else if (val !== this.state[key]) {
        this.state[key] = val;
      }
    }

    // Sanity Check state
    this.state.sparkliness = Math.max(0, Math.min(MAX_SPARKLINESS, Math.round(this.state.sparkliness)));

    this.listeners.map(l => l(this.state));
  }

  public updateSynesthesiaPlayState(state: PlayStateData | null): void {
    console.log('updateSynesthesiaPlayState', state);
    this.synesthesiaDisplay = state ? new SynesthesiaDisplay(this.numberOfLeds, state) : null;
  }

  public removeListener(listener: StripBehaviorListener) {
    this.listeners = this.listeners.filter(l => listener !== l);
  }

  private connected() {
    clearInterval(this.intervalID);
    this.startPattern();
  }

  private disconnected() {
    clearInterval(this.intervalID);
  }

  private setPixel(i: number, c: Color) {
    const i3 = i * 3;
    this.buffer[i3] = c.r;
    this.buffer[i3 + 1] = c.g;
    this.buffer[i3 + 2] = c.b;
  }

  private startPattern() {

    const leds: Color[] = [];
    for (let i = 0; i < this.numberOfLeds; i++)
      leds.push(Colors.Black);

    let primaryArtifacts: Artifact[] = [];
    let secondaryArtifacts: Artifact[] = [];
    let sparkles: Sparkle[] = [];
    let nextSparkle = -1;

    const tickArtifacts = (artifacts: Artifact[]) =>
      artifacts
        .map<Artifact>(a => {
          const p = a.position + a.positionSpeed;
          return {
            width: a.width,
            position: p > 1 ? (p - 1) : p < 0 ? (p + 1) : p,
            positionSpeed: a.positionSpeed,
            life: a.life + a.lifeSpeed,
            lifeSpeed: a.lifeSpeed
          };
        })
        .filter(a => a.life < 1);

    const displayArtifacts = (artifacts: Artifact[], color: Color) =>
      artifacts.map(a => {
        const ledWidth = 1.0 / leds.length;
        const sectionSize = (a.width / 2);

        const start = a.position;
        const mid = start + sectionSize;
        const end = mid + sectionSize;

        // Wrapped values
        const startW = start - 1;
        const midW = mid - 1;
        const endW = end - 1;

        const artifactOpacity = a.life < 0.25 ? (a.life * 4) : a.life > 0.75 ? ((1 - a.life) * 4) : 1;

        for (let i = 0; i < leds.length; i++) {
          const ledPos = i * ledWidth;
          const opacity = ledPos > start ?
            (
              // Do calculation on unwrapped artifact
              ledPos < mid ? ((ledPos - start) / sectionSize):
              ledPos < end ? ((end - ledPos) / sectionSize):
              0
            ) : (
              // Do calculation on wrapped artifact
              ledPos < midW ? ((ledPos - startW) / sectionSize):
              ledPos < endW ? ((endW - ledPos) / sectionSize):
              0
            );
          const actualOpacity = artifactOpacity * opacity;
          if (actualOpacity > 0)
            leds[i] = leds[i].overlay(color, actualOpacity);
        }
      });

    const calculateAndSendPattern = () => {
      // Zero-Out buffer
      for (let i = 0; i < leds.length; i++)
        leds[i] = Colors.Black;

      // Generate new artifacts
      while (primaryArtifacts.length < this.state.primaryArtifacts)
        primaryArtifacts.push(genRandomArtifact(0.6));
      while (secondaryArtifacts.length < this.state.secondaryArtifacts)
        secondaryArtifacts.push(genRandomArtifact(0.4));

      // Update artifacts
      primaryArtifacts = tickArtifacts(primaryArtifacts);
      secondaryArtifacts = tickArtifacts(secondaryArtifacts);

      // Print Primary Artifacts
      displayArtifacts(primaryArtifacts, this.state.primaryColor);
      displayArtifacts(secondaryArtifacts, this.state.secondaryColor);

      // Generate new sparkles
      nextSparkle--;
      if (this.state.sparkliness > 0) {
        while (nextSparkle <= 0) {
          sparkles.push({
            pos: Math.random(),
            life: 0,
            lifeSpeed: getRandomArbitrary(0.02, 0.08)
          });
          if (Math.random() < this.state.sparkliness / (MAX_SPARKLINESS + 2))
            nextSparkle = 0;
          else
            nextSparkle = Math.round(getRandomArbitrary(1, MAX_SPARKLINESS * 2 - this.state.sparkliness * 2 + 2));
        }
      }

      // Update sparkles
      sparkles = sparkles
        .map(s => ({
          pos: s.pos,
          life: s.life + s.lifeSpeed,
          lifeSpeed: s.lifeSpeed
        }))
        .filter(s => s.life < 1);

      sparkles.map(s => {
        const pixel = Math.min(leds.length - 1, Math.floor(s.pos * leds.length));
        const opacity = (s.life < 0.5 ? (s.life) : (1-s.life)) * 2;
        leds[pixel] = leds[pixel].overlay(this.state.sparkleColor, opacity);
      });

      // Overlay Synesthesia Display
      if (this.synesthesiaDisplay) {
        const display = this.synesthesiaDisplay.getDisplay();
        if (display.length !== leds.length) {
          console.error('length mismatch');
        } else {
          for (let i = 0; i < leds.length; i++)
            leds[i] = leds[i].overlay(display[i], display[i].a);
        }
      } else {
        // Decrease the brightness of the strip when idle
        for (let i = 0; i < leds.length; i++)
          leds[i] = leds[i].overlay(Colors.Black, 1 - this.state.idleBrightness);
      }

      // Update Strip
      for (let i = 0; i < leds.length; i++)
        this.setPixel(i, leds[i]);
      this.backend.updateStrip();
    };
    this.intervalID = setInterval(calculateAndSendPattern, 10);
  }

}
