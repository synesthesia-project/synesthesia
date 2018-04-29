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

const INTERVAL = 1000 / 44;

export class Display {

  private readonly config: config.Config;
  private readonly dmx: DmxProxy;
  // Mapping form universe to buffers
  private readonly buffers: {[id: number]: Int8Array} = {};
  private state: PlayStateData | null;

  public constructor(config: config.Config, dmx: DmxProxy) {
    this.config = config;
    this.dmx = dmx;
    this.newSynesthesiaPlayState = this.newSynesthesiaPlayState.bind(this);
    // create one buffer for each universe we have
    for (const fixture of config.fixtures) {
      if (!this.buffers[fixture.universe])
        this.buffers[fixture.universe] = new Int8Array(512);
    }
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

    for (const fixture of this.config.fixtures) {
      if (fixture.group === 'hex-small') {
        this.setDMXBufferValue(fixture.universe, fixture.startChannel, 255 * brightness | 0);
      }
      if (fixture.group === 'hex-med') {
        this.setDMXBufferValue(fixture.universe, fixture.startChannel + 1, 255 * brightness | 0);
      }
      if (fixture.group === 'hex-big') {
        this.setDMXBufferValue(fixture.universe, fixture.startChannel + 2, 255 * brightness | 0);
      }
    }

    // Write Universes
    for (const universe of Object.keys(this.buffers)) {
      this.dmx.writeDmx(Number(universe), this.buffers[universe]);
    }
  }

  private setDMXBufferValue(universe: number, channel: number, value: number) {
    this.buffers[universe][channel - 1] = value;
  }

  public run() {
    setInterval(this.frame.bind(this), INTERVAL);
  }
}
