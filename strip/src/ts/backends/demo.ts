/*
 * This is a backend that runs a web server that displays
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as ws from 'ws';
import {LEDStripBackend} from './backends';

export class DemoBackend extends LEDStripBackend {

  private readonly numberOfPixels: number;
  private readonly server: http.Server;
  private buffer: Buffer;
  private websocketListeners: ((data: Buffer) => void)[] = [];

  public constructor(numberOfPixels: number) {
    super();

    this.numberOfPixels = numberOfPixels;

    const staticDir = path.resolve(__dirname, '../../demo');

    function sendDemoFile(file: string, response: http.ServerResponse, contentType: string) {
      fs.readFile(path.join(staticDir, file), function(error, content) {
        if (error) {
          if (error.code === 'ENOENT') {
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            response.end('file not found', 'utf-8');
          } else {
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.end('Error', 'utf-8');
            console.error(error);
          }
        } else {
          response.writeHead(200, { 'Content-Type': contentType });
          response.end(content, 'utf-8');
        }
      });
    }

    const allowedFiles: {[id: string]: [string, string]} = {
      '/': ['index.html', 'text/html'],
      '/main.css': ['main.css', 'text/css'],
      '/main.js': ['main.js', 'text/javascript'],
      '/lib/jquery.min.js': ['lib/jquery.min.js', 'text/javascript']
    };

    this.server = http.createServer((request, response) => {
      if (request.url) {
        if (request.url === '/consts.js') {
          response.writeHead(200, { 'Content-Type': 'text/javascript' });
          response.end('var consts = {numberOfLeds: ' + this.numberOfPixels + '}', 'utf-8');
          return;
        }
        const f = allowedFiles[request.url];
        if (f) {
          sendDemoFile(f[0], response, f[1]);
          return;
        }
      }

      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('not found', 'utf-8');
    });

    const wss = new ws.Server({
      perMessageDeflate: false,
      port: 8126
    });

    wss.on('connection', connection => {
      const sendData = (data: Buffer) => {
        if (connection.readyState === ws.OPEN) {
          connection.send(data);
        } else {
          this.websocketListeners = this.websocketListeners.filter(f => f !== sendData);
        }
      };
      this.websocketListeners.push(sendData);
      // Send initial buffer if set
      if (this.buffer) {
        connection.send(this.buffer);
      }
      // connection.on('message', msg => {});
      connection.onclose = () => {
        this.websocketListeners = this.websocketListeners.filter(f => f !== sendData);
      };
    });

  }

  public setupBuffer(buffer: Buffer): void {
    this.buffer = buffer;
  }

  public connect(): void {
    this.server.listen(8125);
    console.log('HTTP Server listening on http://localhost:8125/');
    this.notifyReadyListeners();
  }

  public updateStrip(): void {
    this.websocketListeners.map(l => l(this.buffer));
  }
}
