import { DownstreamEndpoint } from '@synesthesia-project/core/lib/protocols/broadcast';
import { PlayStateData } from '@synesthesia-project/core/lib/protocols/broadcast/messages';
import { CueFile } from '@synesthesia-project/core/lib/file';
import * as usage from '@synesthesia-project/core/lib/file/file-usage';
import { DEFAULT_SYNESTHESIA_PORT } from '@synesthesia-project/core/lib/constants';

import { LocalCommunicationsConsumer } from '@synesthesia-project/core/lib/local';

import * as fs from 'fs';
import * as WebSocket from 'ws';
import {promisify} from 'util';

const open = promisify(fs.open);
const write = promisify(fs.write);

const LEDS = 90;

export class Display {

  private state: {
    playState: PlayStateData;
    files: Map<string, CueFile>;
  } = {
      playState: { layers: [] },
      files: new Map()
    };

  private buffer: Buffer;
  private stream: fs.WriteStream;

  public constructor() {
    this.frame = this.frame.bind(this);

    this.buffer = Buffer.alloc(LEDS * 3);
    this.stream = fs.createWriteStream('/tmp/leds');

    const local = new LocalCommunicationsConsumer();

    local.on('new-server', port => {
      console.log(`New server started on port ${port}`);
      const endpoint = this.connectToServer(port);
      endpoint
        .then(() => console.log(`Connected to server on port: ${port}`))
        .catch(err => console.error(`Could not connect to server on port: ${port}`));
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
            console.log('play state!', playState);
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
              this.state = { playState, files: nextFiles };
            }
          }
        );
        ws.addEventListener('message', msg => {
          console.log('message', msg);
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
  }

  private frame() {

    const timestampMillis = new Date().getTime();

    let brightness = 255;
    if (this.state.playState.layers.length === 0) {
      brightness = 255;
    } else {
      let amplitude = 0;
      for (const layer of this.state.playState.layers) {
        const f = this.state.files.get(layer.fileHash);
        if (!f) continue;
        const t = (timestampMillis - layer.effectiveStartTimeMillis) * layer.playSpeed;
        for (const fLayer of f.layers) {
          const activeEvents = usage.getActiveEvents(fLayer.events, t);
          for (const e of activeEvents) {
            const a = usage.getCurrentEventStateValue(e, t, state => state.amplitude);
            amplitude = Math.max(amplitude, a);
          }
        }
      }
      brightness = 10 + amplitude * 205;
    }

    for (let i = 0; i < this.buffer.length; i += 3) {
      this.buffer[i] = 0;
      this.buffer[i + 1] = brightness;
      this.buffer[i + 2] = brightness;
    }

    this.stream.write(this.buffer);
  }
}

const display = new Display();
display.start();
