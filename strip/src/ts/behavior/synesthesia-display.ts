import {PlayStateData} from '../shared/protocol/messages';
import {CueFile} from '../shared/file/file';
import {
    PreparedFile,
    prepareFile,
    getActiveEvents,
    getCurrentEventStateValue
  } from '../shared/file/file-usage';

import {AlphaColor, Colors} from '../data/colors';

export class SynesthesiaDisplay {

  private readonly leds: AlphaColor[] = [];

  private readonly effectiveStartTimeMillis: number;
  private readonly preparedFile: PreparedFile;

  public constructor(numberOfLeds: number, state: PlayStateData) {
    for (let i = 0; i < numberOfLeds; i++) {
      this.leds.push(Colors.Transparent);
    }
    this.effectiveStartTimeMillis = state.effectiveStartTimeMillis;
    this.preparedFile = prepareFile(state.file);
  }

  public getDisplay(): AlphaColor[] {

    // Zero-Out leds
    const positionMillis = new Date().getTime() - this.effectiveStartTimeMillis;

    // --------------------
    // Layer 1 - Background
    // Create a black layer, that has a decreased opacity to let light through
    // when the main percussion has amplitude
    let backgroundBrightness = 0;

    // Get the active events for each layer
    for (const layer of this.preparedFile.layers) {
      // Pick out the layer we want to use for the percussion background.
      if (layer.kind === 'percussion') {
        const activeEvents = getActiveEvents(layer.events, positionMillis);
        if (activeEvents.length > 0) {
          for (const event of activeEvents) {
            const amplitude = getCurrentEventStateValue(event, positionMillis, s => s.amplitude);
            backgroundBrightness = Math.max(backgroundBrightness, amplitude);
          }
        }
        // Don't use a different layer for the background opacity
        break;
      }
    }

    // Set base background to black at appropriate opacity
    const bgOpacity = 0.9 - (backgroundBrightness * 0.9);
    const backgroundColor = new AlphaColor(0, 0, 0, bgOpacity);
    for (let i = 0; i < this.leds.length; i++) {
      this.leds[i] = backgroundColor;
    }

    // -------------
    return this.leds;
  }

}
