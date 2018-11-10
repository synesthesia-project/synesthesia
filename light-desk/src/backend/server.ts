import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as WebSocket from 'ws';

const STATIC_DIR = path.resolve(__dirname, '../frontend');

const STATIC_FILES: {[id: string]: [string, string]} = {
  '/': ['index.html', 'text/html'],
  '/index.css': ['index.css', 'text/css'],
  '/bundle.js': ['bundle.js', 'text/javascript'],
  '/bundle.js.map': ['bundle.js.map', 'text/plain']
};

export class Server {

  private readonly port: number;
  private readonly server: http.Server;
  private readonly wss: WebSocket.Server;

  public constructor(port: number) {
    this.port = port;

    this.server = http.createServer((request, response) => {
      if (request.url) {
        const f = STATIC_FILES[request.url];
        if (f) {
          this.sendStaticFile(f[0], response, f[1]);
          return;
        }
      }

      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('not found', 'utf-8');
    });

    this.wss = new WebSocket.Server({
      server: this.server
    });

    this.wss.on('connection', ws =>
      ws.on('message', msg => this.handleMessage(ws, msg))
    );
  }

  public start() {
    this.server.listen(this.port, () => {
      console.log('Light Desk Started: http://localhost:' + this.port);
    });
  }

  private sendStaticFile(file: string, response: http.ServerResponse, contentType: string) {
    fs.readFile(path.join(STATIC_DIR, file), function(error, content) {
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

  private handleMessage(ws: WebSocket, data: any) {
    console.log('got message:', data);
  }

}
