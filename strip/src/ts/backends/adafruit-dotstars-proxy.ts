import * as net from 'net';
import {LEDStripBackend} from './backends';

/**
 * An LED Backend controller that connects to a running strip-proxy.py
 * that passes on the new strip display
 */
export class AdafruitDotstarsProxyBackend extends LEDStripBackend {

  private readonly numberOfPixels: number;
  private readonly sockFile: string;
  private buffer: Buffer;
  private socket: net.Socket;

  public constructor(numberOfPixels: number, sockFile: string) {
    super();
    this.numberOfPixels = numberOfPixels;
    this.sockFile = sockFile;
  }

  public setupBuffer(buffer: Buffer) {
    if (buffer.length !== this.numberOfPixels * 3) {
      throw new Error('Unexpected Buffer Size');
    }
    this.buffer = buffer;
  }

  public connect() {
    const socket = net.connect(this.sockFile);
    this.socket = socket;
    socket
      .on('connect', () => {
        if (this.socket === socket) {
          this.notifyReadyListeners();
        }
      })
      .on('data', (data) => {
        console.info('client', 'Data: %s', data.toString());
      })
      .on('error', (err) => {
        console.error('client', err);
      })
      .on('end', () => {
        if (this.socket === socket) {
          this.notifyDisconnectedListeners();
        }
      })
      ;
  }

  public updateStrip() {
    if (!this.buffer) {
      throw new Error('setupBuffer() has not been called');
    }
    this.socket.write(this.buffer, 'binary');
  }
}
