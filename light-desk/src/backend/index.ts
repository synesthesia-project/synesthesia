import { extend } from 'lodash';
import * as http from 'http';
import * as WebSocket from 'ws';
import {Application} from 'express';

import { Parent } from './components/base';
import { Group } from './components/group';
import { IDMap } from './util/id-map';

import * as proto from '../shared/proto';
import * as color from './util/color';

import {Connection, Server} from './server';
import { LightDeskOptions } from './options';

const DEFAULT_LIGHT_DESK_OPTIONS: LightDeskOptions = {
  path: '/'
}

export type InitializationOptions =
  /** automatically start a simple  */
  | { mode: 'automatic', port: number }
  /** Create a websocket server that attaches to an existing express and http server */
  | { mode: 'express', express: Application, server: http.Server }
  /** Create a websocket server that attaches to an existing express and http server */
  | { mode: 'manual', setup: (server: Server) => void }

export class LightDesk implements Parent {

  private readonly options: LightDeskOptions;
  private rootGroup: Group | null = null;
  /**
   * Mapping from components to unique IDs that identify them
   */
  private readonly componentIDMap = new IDMap();
  private readonly connections = new Set<Connection>();

  constructor(options: Partial<LightDeskOptions> = {}) {
    this.options = extend({}, DEFAULT_LIGHT_DESK_OPTIONS, options);
    if (!this.options.path.endsWith('/') || !this.options.path.startsWith('/')) {
      throw new Error(`path must start and end with "/", set to: ${this.options.path}`);
    }
  }

  public start = (opts: InitializationOptions) => {
    const server = new Server(
      this.options,
      this.onNewConnection,
      this.onClosedConnection,
      this.onMessage
    );
    if (opts.mode === 'automatic') {
      const httpServer = http.createServer(server.handleHttpRequest);
      const wss = new WebSocket.Server({
        server: httpServer
      });
      wss.on('connection', server.handleWsConnection);

      httpServer.listen(opts.port, () => {
        console.log(`Light Desk Started: http://localhost:${opts.port}${this.options.path}`);
      });
    } else if (opts.mode === 'express') {
      const wss = new WebSocket.Server({
        server: opts.server
      });
      wss.on('connection', server.handleWsConnection);
      opts.express.get(`${this.options.path}*`, server.handleHttpRequest);
    } else if (opts.mode === 'manual') {
      opts.setup(server);
    } else {
      // @ts-ignore
      const _n: never = opts;
      throw new Error(`Unsupported mode`);
    }
  }

  public setRoot = (group: Group) => {
    if (this.rootGroup) {
      // TODO
      throw new Error('Can only set root group once');
    }
    this.rootGroup = group;
    this.rootGroup.setParent(this);
  }

  public updateTree = () => {
    if (!this.rootGroup) return;
    const root = this.rootGroup.getProtoInfo(this.componentIDMap);
    for (const connection of this.connections) {
      connection.sendMessage({type: 'update_tree', root});
    }
  }

  private onNewConnection = (connection: Connection) => {
    this.connections.add(connection);
    if (this.rootGroup) {
      connection.sendMessage({
        type: 'update_tree',
        root: this.rootGroup.getProtoInfo(this.componentIDMap)
      });
    }
  }

  private onClosedConnection = (connection: Connection) => {
    console.log('removing connection');
    this.connections.delete(connection);
  }

  private onMessage = (_connection: Connection, message: proto.ClientMessage) => {
    console.log('got message', message);
    switch (message.type) {
      case 'component_message':
      if (this.rootGroup)
        this.rootGroup.routeMessage(this.componentIDMap, message);
      break;
    }
  }

}

// Export components
export { Component } from './components/base';

export { Button } from './components/button';
export { Group } from './components/group';
export { Label } from './components/label';
export { Rect } from './components/rect';
export { SliderButton } from './components/slider_button';
export { Switch } from './components/switch';
export { color };
