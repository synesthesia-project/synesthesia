import * as http from 'http';
import WebSocket = require('ws');
import * as fs from 'fs';
import * as path from 'path';

import * as proto from '../shared/proto';
import {AudioFile, AUDIO_FILES} from '../shared/static';
import { LightDeskOptions } from './options';

const STATIC_DIR = path.resolve(__dirname, '../frontend');

const STATIC_FILES: {[id: string]: [string, string]} = {
  '/bundle.js': ['bundle.js', 'text/javascript'],
  '/bundle.js.map': ['bundle.js.map', 'text/plain']
};

// Add audio files to STATIC_FILES
for (const key of Object.keys(AUDIO_FILES)) {
  const audioFile: AudioFile = AUDIO_FILES[key];
  const contentType =
    audioFile.file.endsWith('.wav') ? 'audio/wav' :
    audioFile.file.endsWith('.ogg') ? 'audio/ogg' :
    'application/octet-stream';
  STATIC_FILES[`/audio/${audioFile.file}`] = [`audio/${audioFile.file}`, contentType];
}

export interface Connection {
  sendMessage(msg: proto.ServerMessage): void;
}

export class Server {

  public constructor(
    private readonly options: LightDeskOptions,
    private readonly onNewConnection: (connection: Connection) => void,
    private readonly onClosedConnection: (connection: Connection) => void,
    private readonly onMessage: (connection: Connection, message: proto.ClientMessage) => void
  ){};

  public handleHttpRequest = (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (req.url === this.options.path) {
      const content = `
          <html>
            <head>
              <title>Light Desk</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body>
              <div id="root"></div>
              <script type="text/javascript" src="${this.options.path}bundle.js"></script>
            </body>
          </html>`;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content, 'utf-8');
      return;
    }
    if (req.url && req.url.startsWith(this.options.path)) {
      const relativePath = req.url.substr(this.options.path.length - 1);
      const f = STATIC_FILES[relativePath];
      if (f) {
        this.sendStaticFile(path.join(STATIC_DIR, f[0]), res, f[1]);
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found', 'utf-8');
  }

  private sendStaticFile = (file: string, response: http.ServerResponse, contentType: string) => {
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

  public handleWsConnection = <S extends WebSocket>(ws: S) => {
    const connection: Connection = {
      sendMessage: msg => ws.send(JSON.stringify(msg))
    };
    this.onNewConnection(connection);
    console.log('new connection');
    ws.on('message', msg => this.onMessage(connection, JSON.parse(msg.toString())));
    ws.on('close', () => this.onClosedConnection(connection));
  }

}
