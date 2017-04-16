import {LEDStripBackend} from "../backends/backends";
import {Color, Colors} from "../data/colors";

interface Artifact {
  /** between 0 and 1 */
  width: number;
  /** between 0 and 1 */
  position: number;
  positionSpeed: number;
  life: number;
  lifeSpeed: number;
  color: Color;
}

interface Sparkle {
  pos: number;
  life: number;
  lifeSpeed: number;
}

function genRandomArtifact(maxWidth: number, color: Color): Artifact {
  return {
    width: getRandomArbitrary(maxWidth / 3, maxWidth),
    position: Math.random(),
    positionSpeed: (Math.random() < 0.5 ? 1 : -1) * getRandomArbitrary(0.001, 0.005),
    life: 0,
    lifeSpeed: getRandomArbitrary(0.001, 0.005),
    color
  };
}

function getRandomArbitrary(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export class StripBehavior {

  private readonly numberOfLeds: number;
  private readonly backend: LEDStripBackend;
  private readonly buffer: Buffer;
  private intervalID: NodeJS.Timer;

  private primaryColor: Color;
  private secondaryColor: Color;
  private sparkleColor: Color;

  constructor(numberOfLeds: number, backend: LEDStripBackend) {
    this.numberOfLeds = numberOfLeds;
    this.backend = backend;
    this.buffer = new Buffer(numberOfLeds * 3);

    backend.setupBuffer(this.buffer);
    backend.addReadyListener(this.connected.bind(this));
    backend.addDisconnectedListener(this.disconnected.bind(this));

    this.primaryColor = new Color(20, 0, 0);
    this.secondaryColor = new Color(20, 0, 20);
    this.sparkleColor = new Color(0, 0, 0);

    // Zero-Out buffer
    for (let i = 0; i < numberOfLeds; i++)
      this.setPixel(i, this.primaryColor);
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
            lifeSpeed: a.lifeSpeed,
            color: a.color
          }
        })
        .filter(a => a.life < 1)

    const displayArtifacts = (artifacts: Artifact[]) =>
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
            leds[i] = leds[i].overlay(a.color, actualOpacity);
        }
      });

    const calculateAndSendPattern = () => {
      // Zero-Out buffer
      for (let i = 0; i < leds.length; i++)
        leds[i] = Colors.Black;

      // Generate new artifacts
      while (primaryArtifacts.length < 5)
        primaryArtifacts.push(genRandomArtifact(0.6, this.primaryColor));
      while (secondaryArtifacts.length < 2)
        secondaryArtifacts.push(genRandomArtifact(0.4, this.secondaryColor));

      // Update artifacts
      primaryArtifacts = tickArtifacts(primaryArtifacts);
      secondaryArtifacts = tickArtifacts(secondaryArtifacts);

      // Print Primary Artifacts
      displayArtifacts(primaryArtifacts);
      displayArtifacts(secondaryArtifacts);

      // Generate new sparkles
      nextSparkle--;
      while (nextSparkle <= 0) {
        sparkles.push({
          pos: Math.random(),
          life: 0,
          lifeSpeed: getRandomArbitrary(0.01, 0.08)
        });
        nextSparkle = Math.round(getRandomArbitrary(0, 3));
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
        leds[pixel] = leds[pixel].overlay(this.sparkleColor, opacity);
      })

      // Update Strip
      for (let i = 0; i < leds.length; i++)
        this.setPixel(i, leds[i]);
      this.backend.updateStrip();
    }
    this.intervalID = setInterval(calculateAndSendPattern, 10);
  }

}
