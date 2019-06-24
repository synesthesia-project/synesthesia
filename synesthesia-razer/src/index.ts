import { DownstreamEndpoint } from '@synesthesia-project/core/lib/protocols/broadcast';
import { PlayStateData } from '@synesthesia-project/core/lib/protocols/broadcast/messages';
import { CueFile } from '@synesthesia-project/core/lib/file';
import * as usage from '@synesthesia-project/core/lib/file/file-usage';
import { DEFAULT_SYNESTHESIA_PORT } from '@synesthesia-project/core/lib/constants';

import { LocalCommunicationsConsumer } from '@synesthesia-project/core/lib/local';

import * as WebSocket from 'ws';
import * as openrazer from 'openrazer';

import { RGBAColor, Compositor, PixelInfo } from './compositor';
import FillModule from './compositor/modules/fill';
import AddModule from './compositor/modules/add';
import ScanModule from './compositor/modules/scan';

export class Display {

  private state: {
    playState: PlayStateData;
    files: Map<string, CueFile>;
  } = {
    playState: { layers: [] },
    files: new Map()
  };

  private keyboard: {
    keyboard: openrazer.Keyboard;
    map: openrazer.KeyboardPixelMap;
    compositor: Compositor<{ row: number, col: number }, {}>;
    buffer: { index: number, start: number, colors: openrazer.RGB[] }[];
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
      // Build up list of pixels and prepare buffer
      const pixels: PixelInfo<{row: number, col: number}>[] = [];
      const buffer: { index: number, start: number, colors: openrazer.RGB[] }[] = [];
      for (let r = 0; r < map.rows.length; r++) {
        const row = map.rows[r];
        buffer[r] = {
          index: r,
          start: 0,
          colors: []
        };
        let maxKeyIndex = 0;
        for (const key of row.keys) {
          maxKeyIndex = Math.max(maxKeyIndex, key.i);
          pixels.push({
            x: key.centreX,
            y: key.centreY,
            data: {
              row: r,
              col: key.i
            }
          });
        }
        for (let k = 0; k <= maxKeyIndex; k++) buffer[r].colors[k] = [0, 0, 0];
      }
      const compositor = new Compositor<{ row: number, col: number }, {}>(
        {
          root: new AddModule([
            new FillModule(new RGBAColor(255, 0, 0, 1)),
            new ScanModule(new RGBAColor(255, 255, 0, 1), { speed: 0.5 }),
            new ScanModule(new RGBAColor(255, 255, 0, 1), { speed: -0.5 })
          ]),
          pixels
        },
        {}
      );
      this.keyboard = { keyboard, map, compositor, buffer };
    }
  }

  private async frame() {

    // const timestampMillis = new Date().getTime();

    if (this.keyboard) {
      const frame = this.keyboard.compositor.renderFrame();
      for (const p of frame) {
        this.keyboard.buffer[p.pixel.data.row].colors[p.pixel.data.col] = p.output.toRGB();
      }
      await this.keyboard.keyboard.writeCustomFrame(this.keyboard.buffer);
      // await this.keyboard.keyboard.writeCustomFrame(rowData);
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
