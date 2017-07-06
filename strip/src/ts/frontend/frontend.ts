import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as WebSocket from 'ws';

import {StripBehavior} from '../behavior/behavior';
import {SynesthesiaConsumerProtocol} from './synesthesia-consumer';
import {StripControllerProtocol} from './strip-controller';

import * as shared from '../shared';

export class Frontend {

  private readonly server: http.Server;
  private readonly behavior: StripBehavior;

  public constructor(behavior: StripBehavior) {
    this.behavior = behavior;

    const staticDir = path.resolve(__dirname, '../../frontend');

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
        const f = allowedFiles[request.url];
        if (f) {
          sendDemoFile(f[0], response, f[1]);
          return;
        }
      }

      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('not found', 'utf-8');
    });
  }

  public start() {
    console.log('Starting Frontend');
    this.server.listen(8121);
    console.log('Frontend HTTP Server listening on http://localhost:8121/');

    shared.protocol.messages.test();

    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: shared.constants.DEFAULT_SYNESTHESIA_PORT
    });

    wss.on('connection', connection => {
      const url = connection.upgradeReq.url;
      if (url === '/strip') {
        const proto = new StripControllerProtocol(connection, this.behavior);
        return;
      }
      if (url === shared.constants.SYNESTHESIA_WEBSOCKET_PATH) {
        const proto = new SynesthesiaConsumerProtocol(connection, this.behavior);
        return;
      }
      console.error('unrecognized websocket url: ', url);
      connection.close();
    });
  }

}
