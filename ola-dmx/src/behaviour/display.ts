import {PlayStateData} from '../shared/protocol/messages';
import {CueFile} from '../shared/file/file';
import {
    PreparedFile,
    prepareFile,
    getActiveEvents,
    getCurrentEventStateValue
  } from '../shared/file/file-usage';

import {DmxProxy} from '../dmx/proxy';

const INTERVAL = 1000 / 44;

export class Display {

  private readonly dmx: DmxProxy;
  private readonly buffer = new Int8Array(512);
  private state: PlayStateData | null;

  public constructor(dmx: DmxProxy) {
    this.dmx = dmx;
    this.newSynesthesiaPlayState = this.newSynesthesiaPlayState.bind(this);
  }

  public newSynesthesiaPlayState(state: PlayStateData | null): void {
    this.state = state ? {
      effectiveStartTimeMillis: state.effectiveStartTimeMillis,
      file: prepareFile(state.file)
    } : null;
    console.log('newSynesthesiaPlayState', this.state );
  }

  private frame() {
    if (!this.state) return;
    const positionMillis = new Date().getTime() - this.state.effectiveStartTimeMillis;

    let brightness = 0;

    // Base brightness on percussion layer
    for (const layer of this.state.file.layers) {
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

    this.buffer[2] = 128; // y position
    this.buffer[5] = 255; // brightness

    this.buffer[7] = 205 * brightness | 0;
    this.buffer[8] = 100 * brightness | 0;
    this.buffer[9] = 255 * brightness | 0;
    this.buffer[10] = 5 * brightness | 0;
    this.dmx.writeDmx(0, this.buffer);
  }

  public run() {
    setInterval(this.frame.bind(this), INTERVAL);
  }
}
