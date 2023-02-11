import * as fs from 'fs';
import * as http from 'http';
import * as WebSocket from 'ws';
import {
  BROADCAST_UPSTREAM_WEBSOCKET_PATH,
  CONTROLLER_WEBSOCKET_PATH,
  COMPOSER_PATH,
} from '@synesthesia-project/core/lib/constants';
import { LocalCommunicationsServer } from '@synesthesia-project/core/lib/local';

import * as composer from '@synesthesia-project/composer';

import { ComposerConnection } from './connections/composer';
import { ControllerConnection } from './connections/controller';
import { DownstreamConnection } from './connections/downstream';

import { ServerState } from './state/state';
import { ConnectionMetadataManager } from '@synesthesia-project/core/lib/protocols/util/connection-metadata';

export class Server {
  private readonly state: ServerState;
  private readonly connectionMetadata = new ConnectionMetadataManager('server');

  private readonly port: number;
  private readonly local: LocalCommunicationsServer;
  private readonly server: http.Server;
  private readonly wss: WebSocket.Server;

  public constructor(port: number, dataDir: string) {
    this.port = port;
    this.state = new ServerState(dataDir);
    this.local = new LocalCommunicationsServer();

    this.server = http.createServer((request, response) => {
      if (request.url) {
        if (request.url === COMPOSER_PATH) {
          response.writeHead(302, { Location: COMPOSER_PATH + '/' });
          response.end('', 'utf-8');
          return;
        }
        if (request.url.startsWith(COMPOSER_PATH + '/')) {
          const composerPath = request.url.substr(COMPOSER_PATH.length);
          if (composerPath === '/') {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(
              composer.getIndexHtml({
                name: 'Synesthesia Server',
                websocketURL: `ws://localhost:${this.port}${COMPOSER_PATH}`,
              }),
              'utf-8'
            );
            return;
          }
          for (const file of composer.STATIC_FILES) {
            if (file.url === composerPath) {
              response.writeHead(200, { 'Content-Type': file.contentType });
              this.sendStaticFile(file.path, response, file.contentType);
              return;
            }
          }
        }
      }

      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('not found', 'utf-8');
    });

    this.wss = new WebSocket.Server({
      server: this.server,
    });

    this.wss.on('connection', this.handleConnection);
  }

  public start() {
    this.server.listen(this.port, () => {
      console.log('Synesthesia Server Started on port: ' + this.port);
      this.local.notifyConsumers(this.port);
    });
  }

  private sendStaticFile(
    file: string,
    response: http.ServerResponse,
    contentType: string
  ) {
    fs.readFile(file, (error, content) => {
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

  private handleConnection = (ws: WebSocket, req: http.IncomingMessage) => {
    const url = ws.url || req.url;
    console.log('new connection', url);

    if (url === COMPOSER_PATH) {
      // Initiate a new connection to composer
      this.state.addComposer(
        new ComposerConnection(ws, this.connectionMetadata)
      );
      return;
    }

    if (url === CONTROLLER_WEBSOCKET_PATH) {
      // Initiate a new connection to composer
      this.state.addController(
        new ControllerConnection(ws, this.connectionMetadata)
      );
      return;
    }

    if (url === BROADCAST_UPSTREAM_WEBSOCKET_PATH) {
      // We are the upstream endpoint:
      // Initiate a new connection to the downstream endpoint
      this.state.addDownstreamConnection(
        new DownstreamConnection(
          ws,
          (hash) => this.state.getActiveFileByHash(hash),
          this.connectionMetadata
        )
      );
      return;
    }
  };
}
