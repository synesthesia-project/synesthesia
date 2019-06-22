import { DownstreamEndpoint } from '@synesthesia-project/core/lib/protocols/broadcast';
import { PlayStateData } from '@synesthesia-project/core/lib/protocols/broadcast/messages';
import { CueFile } from '@synesthesia-project/core/lib/file';
import * as usage from '@synesthesia-project/core/lib/file/file-usage';
import { DEFAULT_SYNESTHESIA_PORT } from '@synesthesia-project/core/lib/constants';

import { LocalCommunicationsConsumer } from '@synesthesia-project/core/lib/local';

import * as WebSocket from 'ws';
import * as openrazer from 'openrazer';

export class Display {

  private state: {
    playState: PlayStateData;
    files: Map<string, CueFile>;
  } = {
    playState: { layers: [] },
    files: new Map()
  };

  private keyboard: {
    keyboard: openrazer.Keyboard,
    map: openrazer.KeyboardPixelMap,
    coords: {
      xMin: number,
      xMax: number,
    }
  } | null = null;
  private x = 0;

  public constructor() {
    this.frame = this.frame.bind(this);

    const local = new LocalCommunicationsConsumer();

    local.on('new-server', port => {
      console.log(`New server started on port ${port}`);
      const endpoint = this.connectToServer(port);
      endpoint
        .catch(err => console.error(`Could not connect to server on port: ${port}`))
        .then(() => console.log(`Connected to server on port: ${port}`));
    });

    const endpoint = this.connectToServer(DEFAULT_SYNESTHESIA_PORT);
    endpoint.catch(err => console.error(`Could not connect to server on port: ${DEFAULT_SYNESTHESIA_PORT}`));
  }

  private connectToServer(port: number): Promise<DownstreamEndpoint> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${port}/listen`);
      ws.addEventListener('open', () => {
        const endpoint = new DownstreamEndpoint(
          msg => ws.send(JSON.stringify(msg)),
          async playState => {
            if (playState) {
              const nextFiles = new Map<string, CueFile>();
              await Promise.all(playState.layers.map(async l => {
                const existing = this.state.files.get(l.fileHash);
                if (existing) {
                  nextFiles.set(l.fileHash, existing);
                } else {
                  return endpoint.getFile(l.fileHash).then(f => { nextFiles.set(l.fileHash, usage.prepareFile(f)); });
                }
              }));
              this.state = {playState, files: nextFiles};
            }
          }
        );
        ws.addEventListener('message', msg => {
          endpoint.recvMessage(JSON.parse(msg.data));
        });
        resolve(endpoint);
      });
      ws.addEventListener('error', err => {
        reject(err);
      });
      ws.addEventListener('close', err => {
        // TODO
      });
    });
  }

  public async start() {
    setInterval(this.frame, 20);

    const keyboards = await openrazer.getKeyboards();
    if (keyboards.length > 0) {
      const keyboard = keyboards[0];
      const map = await keyboard.getPixelMap();
      if (!map) {
        throw new Error('keyboard has no pixel map');
      }
      // calculate xMin and xMax
      const coords = {xMax: -Infinity, xMin: Infinity};
      for (const row of map.rows) {
        for (const key of row.keys) {
          coords.xMax = Math.max(coords.xMax, key.centreX);
          coords.xMin = Math.min(coords.xMin, key.centreX);
        }
      }
      this.keyboard = { keyboard, map, coords };
      this.x = coords.xMin - 20;
    }
  }

  private async frame() {

    // const timestampMillis = new Date().getTime();

    if (this.keyboard) {
      const rows = this.keyboard.map.rows;
      this.x += 10;
      if ( this.x >= this.keyboard.coords.xMax + 100) {
        this.x = this.keyboard.coords.xMin - 100;
      }
      console.log(this.x);
      const rowData: { index: number, start: number, colors: openrazer.RGB[]}[] = [];
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const indexes = row.keys.map(k => k.i);
        const kMin = Math.min(...indexes);
        const kMax = Math.max(...indexes);
        const colors: openrazer.RGB[] = [];
        for (let k = kMin; k <= kMax; k++) {
          colors[k - kMin] = [0, 0, 0];
        }
        // Set brightness of keys based on bar location
        for (const key of row.keys) {
          const distance = Math.abs(this.x - key.centreX);
          const brightness = Math.max(0, 1 - distance / 50);
          colors[key.i - kMin] = [
            Math.round(255 * brightness),
            0,
            Math.round(255 * brightness),
          ];
        }
        rowData.push({
          index: r,
          start: kMin,
          colors
        });
      }
      await this.keyboard.keyboard.writeCustomFrame(rowData);
      // let amplitude = 0;
      // if (this.state.playState.layers.length === 0) {
      //   this.keyboard.setMatrixBrightness(255);
      // } else {
      //   for (const layer of this.state.playState.layers) {
      //     const f = this.state.files.get(layer.fileHash);
      //     if (!f) continue;
      //     const t = (timestampMillis - layer.effectiveStartTimeMillis) * layer.playSpeed;
      //     for (const fLayer of f.layers) {
      //       const activeEvents = usage.getActiveEvents(fLayer.events, t);
      //       for (const e of activeEvents) {
      //         const a = usage.getCurrentEventStateValue(e, t, state => state.amplitude);
      //         amplitude = Math.max(amplitude, a);
      //       }
      //     }
      //   }
      //   this.keyboard.setMatrixBrightness(10 + amplitude * 205);
      // }
    }
  }
}

const display = new Display();
display.start();
