import { DownstreamEndpoint } from '@synesthesia-project/core/lib/protocols/broadcast';
import { CueFile } from '@synesthesia-project/core/lib/file';
import * as usage from '@synesthesia-project/core/lib/file/file-usage';
import { DEFAULT_SYNESTHESIA_PORT } from '@synesthesia-project/core/lib/constants';

import { LocalCommunicationsConsumer } from '@synesthesia-project/core/lib/local';

import * as WebSocket from 'ws';
import * as openrazer from 'openrazer';

import {
  RGBAColor,
  Compositor,
  PixelInfo,
} from '@synesthesia-project/compositor';
import { SynesthesiaPlayState } from '@synesthesia-project/compositor/lib/modules';
import FillModule from '@synesthesia-project/compositor/lib/modules/fill';
import AddModule from '@synesthesia-project/compositor/lib/modules/add';
import ScanModule from '@synesthesia-project/compositor/lib/modules/scan';
import SynesthesiaModulateModule from '@synesthesia-project/compositor/lib/modules/modulate';
import { ConnectionMetadataManager } from '@synesthesia-project/core/lib/protocols/util/connection-metadata';

type PixelData =
  | {
      type: 'keyboard';
      row: number;
      col: number;
    }
  | {
      type: 'mousemat';
      i: number;
    };

type MouseMat = {
  dev: openrazer.MouseMat;
  map: openrazer.PixelMap;
  buffer: openrazer.RGB[];
};

export class Display {
  private state: SynesthesiaPlayState = {
    playState: { layers: [] },
    files: new Map(),
  };

  private devices: {
    keyboard: {
      dev: openrazer.Keyboard;
      map: openrazer.PixelMap;
      buffer: { index: number; start: number; colors: openrazer.RGB[] }[];
    };
    mousemat: MouseMat | null;
    compositor: Compositor<PixelData, { synesthesia: SynesthesiaPlayState }>;
  } | null = null;
  private x = 0;

  private writingFrame = false;

  public constructor() {
    const local = new LocalCommunicationsConsumer();

    local.on('new-server', (port) => {
      console.log(`New server started on port ${port}`);
      const endpoint = this.connectToServer(port);
      endpoint
        .catch((err) =>
          console.error(`Could not connect to server on port: ${port}`, err)
        )
        .then(() => console.log(`Connected to server on port: ${port}`));
    });

    const endpoint = this.connectToServer(DEFAULT_SYNESTHESIA_PORT);
    endpoint.catch((err) =>
      console.error(
        `Could not connect to server on port: ${DEFAULT_SYNESTHESIA_PORT}`,
        err
      )
    );
  }

  private connectToServer(port: number): Promise<DownstreamEndpoint> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${port}/listen`);
      ws.addEventListener('open', () => {
        const endpoint = new DownstreamEndpoint(
          (msg) => ws.send(JSON.stringify(msg)),
          async (playState) => {
            if (playState) {
              const nextFiles = new Map<string, CueFile>();
              await Promise.all(
                playState.layers.map(async (l) => {
                  const existing = this.state.files.get(l.fileHash);
                  if (existing) {
                    nextFiles.set(l.fileHash, existing);
                  } else {
                    return endpoint.getFile(l.fileHash).then((f) => {
                      nextFiles.set(l.fileHash, usage.prepareFile(f));
                    });
                  }
                })
              );
              this.state = { playState, files: nextFiles };
              // Update the state of any compositors
              if (this.devices)
                this.devices.compositor.updateState({
                  synesthesia: this.state,
                });
            }
          },
          {
            connectionType: 'upstream',
            connectionMetadata: new ConnectionMetadataManager(
              'synesthezia-razer'
            ),
          }
        );
        ws.addEventListener('message', (msg) => {
          endpoint.recvMessage(JSON.parse(msg.data.toString()));
        });
        resolve(endpoint);
      });
      ws.addEventListener('error', (err) => {
        reject(err);
      });
      ws.addEventListener('close', () => {
        // TODO
      });
    });
  }

  public async start() {
    setInterval(this.frame, 20);
    setInterval(this.initializeInterval, 100);
    await this.init();
  }

  private initializeInterval = async () => {
    if (!this.devices) await this.init();
  };

  private async init() {
    const keyboards = await openrazer.getKeyboards();
    const mousemats = await openrazer.getMousemats();
    if (keyboards.length > 0) {
      const keyboard = keyboards[0];
      const map = await keyboard.getPixelMap();
      if (!map) {
        throw new Error('keyboard has no pixel map');
      }

      // Build up list of pixels and prepare buffers

      let keyboardMaxX = -Infinity;

      // keyboard

      const pixels: PixelInfo<PixelData>[] = [];
      const buffer: {
        index: number;
        start: number;
        colors: openrazer.RGB[];
      }[] = [];
      for (let r = 0; r < map.rows.length; r++) {
        const row = map.rows[r];
        buffer[r] = {
          index: r,
          start: 0,
          colors: [],
        };
        let maxKeyIndex = 0;
        for (const key of row.keys) {
          maxKeyIndex = Math.max(maxKeyIndex, key.i);
          keyboardMaxX = Math.max(keyboardMaxX, key.centreX);
          pixels.push({
            x: key.centreX,
            y: key.centreY,
            data: {
              type: 'keyboard',
              row: r,
              col: key.i,
            },
          });
        }
        for (let k = 0; k <= maxKeyIndex; k++) buffer[r].colors[k] = [0, 0, 0];
      }

      // mousemat
      let mousemat: MouseMat | null = null;
      console.log(mousemat);
      if (mousemats.length > 0) {
        const dev = mousemats[0];
        const map = await dev.getPixelMap();
        if (!map) {
          throw new Error('missing pixelmap');
        }
        const buffer: openrazer.RGB[] = [];
        if (map.rows.length !== 1) {
          throw new Error('Invalid pixelmap');
        }
        const row = map.rows[0];
        let maxIndex = 0;
        for (const key of row.keys) {
          maxIndex = Math.max(maxIndex, key.i);
          pixels.push({
            // offset the mousemat
            x: key.centreX + keyboardMaxX + 50,
            y: key.centreY,
            data: {
              type: 'mousemat',
              i: key.i,
            },
          });
        }
        for (let i = 0; i <= maxIndex; i++) buffer[i] = [0, 0, 0];
        mousemat = { dev, map, buffer };
      }

      const compositor = new Compositor<
        PixelData,
        { synesthesia: SynesthesiaPlayState }
      >(
        {
          root: new SynesthesiaModulateModule(
            new AddModule([
              new FillModule(new RGBAColor(96, 0, 160, 1)),
              new ScanModule(new RGBAColor(160, 0, 104, 1), {
                delay: 0,
                speed: -0.1,
              }),
              new ScanModule(new RGBAColor(160, 0, 104, 1), { speed: 0.5 }),
              new ScanModule(new RGBAColor(160, 0, 104, 1), {
                delay: 0,
                speed: 0.2,
              }),
              new ScanModule(new RGBAColor(247, 69, 185, 1), {
                delay: 0,
                speed: -0.3,
              }),
              new ScanModule(new RGBAColor(247, 69, 185, 1), {
                delay: 1,
                speed: 0.3,
              }),
            ])
          ),
          pixels,
        },
        { synesthesia: this.state }
      );
      this.devices = {
        keyboard: { dev: keyboard, map, buffer },
        mousemat,
        compositor,
      };
    }
  }

  private resetFrame = () => {
    this.writingFrame = false;
    console.log('frame failed to write');
  };

  private frame = async () => {
    if (this.writingFrame) {
      // Skip Frame
      return;
    }

    // const timestampMillis = new Date().getTime();

    try {
      if (this.devices) {
        this.writingFrame = true;
        const resetFrameTimeout = setTimeout(this.resetFrame, 5000);
        const frame = this.devices.compositor.renderFrame();
        for (const p of frame) {
          if (p.pixel.data.type === 'keyboard') {
            this.devices.keyboard.buffer[p.pixel.data.row].colors[
              p.pixel.data.col
            ] = p.output.toRGB();
          }
        }
        await this.devices.keyboard.dev.writeCustomFrame(
          this.devices.keyboard.buffer
        );
        if (this.devices.mousemat) {
          for (const p of frame) {
            if (p.pixel.data.type === 'mousemat') {
              this.devices.mousemat.buffer[p.pixel.data.i] = p.output.toRGB();
            }
          }
          await this.devices.mousemat.dev.writeCustomFrame(
            0,
            this.devices.mousemat.buffer
          );
        }
        clearTimeout(resetFrameTimeout);
        this.writingFrame = false;
      }
    } catch (e) {
      console.log(e);
      console.log('Failed to write frame, resetting devices');
      this.devices = null;
    }
  };
}

const display = new Display();
display.start();
