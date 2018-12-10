import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as WebSocket from 'ws';

import * as proto from '../shared/proto';

const STATIC_DIR = path.resolve(__dirname, '../frontend');
const AUDIO_DIR = path.resolve(STATIC_DIR, 'audio/freesound');

const STATIC_FILES: {[id: string]: [string, string]} = {
  '/bundle.js': ['bundle.js', 'text/javascript'],
  '/bundle.js.map': ['bundle.js.map', 'text/plain']
};

export interface Connection {
  sendMessage(msg: proto.ServerMessage): void;
}

export class Server {

  private readonly port: number;
  private readonly onNewConnection: (connection: Connection) => void;
  private readonly onClosedConnection: (connection: Connection) => void;
  private readonly onMessage: (connection: Connection, message: proto.ClientMessage) => void;
  private readonly server: http.Server;
  private readonly wss: WebSocket.Server;

  public constructor(
      port: number,
      onNewConnection: (connection: Connection) => void,
      onClosedConnection: (connection: Connection) => void,
      onMessage: (connection: Connection, message: proto.ClientMessage) => void
  ) {
    this.port = port;
    this.onNewConnection = onNewConnection;
    this.onClosedConnection = onClosedConnection;
    this.onMessage = onMessage;

    this.server = http.createServer((request, response) => {
      if (request.url === '/') {
        const content = `
          <html>
            <head>
              <title>Light Desk</title>
            </head>
            <body>
              <div id="root"></div>
              <script type="text/javascript" src="/bundle.js"></script>
            </body>
          </html>`;
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(content, 'utf-8');
        return;
      }
      if (request.url && request.url.startsWith('/')) {
        const f = STATIC_FILES[request.url];
        if (f) {
          this.sendStaticFile(path.join(STATIC_DIR, f[0]), response, f[1]);
          return;
        }
        const staticPath = path.normalize(path.join(STATIC_DIR, request.url.substr(1)));
        if (staticPath.startsWith(AUDIO_DIR)) {
          const contentType =
            staticPath.endsWith('.wav') ? 'audio/wav' :
            staticPath.endsWith('.ogg') ? 'audio/ogg' :
            'application/octet-stream';
          this.sendStaticFile(staticPath, response, contentType);
          return;
        }
      }

      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('not found', 'utf-8');
    });

    this.wss = new WebSocket.Server({
      server: this.server
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  public start() {
    this.server.listen(this.port, () => {
      console.log('Light Desk Started: http://localhost:' + this.port);
    });
  }

  private sendStaticFile(file: string, response: http.ServerResponse, contentType: string) {
    fs.readFile(file, function(error, content) {
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

  private handleConnection(ws: WebSocket) {
    const connection: Connection = {
      sendMessage: msg => ws.send(JSON.stringify(msg))
    };
    this.onNewConnection(connection);
    console.log('new connection');
    ws.on('message', msg => this.onMessage(connection, JSON.parse(msg)));
    ws.on('close', () => this.onClosedConnection(connection));
  }

}
