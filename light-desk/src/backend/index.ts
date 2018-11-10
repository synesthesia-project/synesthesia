import {Parent} from './components/base';
import {Group} from './components/group';
import {IDMap} from './util/id-map';

import * as proto from '../shared/proto';

import {Connection, Server} from './server';

const DEFAULT_PORT = 1337;

export class LightDesk implements Parent {

  private readonly server: Server;
  private rootGroup: Group | null;
  /**
   * Mapping from components to unique IDs that identify them
   */
  private readonly componentIDMap = new IDMap();
  private readonly connections = new Set<Connection>();

  constructor(port = DEFAULT_PORT) {
    console.log('Starting light desk on port:', port);
    this.server = new Server(
      port,
      this.onNewConnection.bind(this),
      this.onClosedConnection.bind(this),
      this.onMessage.bind(this));
    this.server.start();
  }

  public setRoot(group: Group) {
    if (this.rootGroup) {
      // TODO
      throw new Error('Can only set root group once');
    }
    this.rootGroup = group;
    this.rootGroup.setParent(this);
  }

  public updateTree() {
    if (!this.rootGroup) return;
    const root = this.rootGroup.getProtoInfo(this.componentIDMap);
    for (const connection of this.connections) {
      connection.sendMessage({type: 'update_tree', root});
    }
  }

  private onNewConnection(connection: Connection) {
    this.connections.add(connection);
    if (this.rootGroup) {
      connection.sendMessage({
        type: 'update_tree',
        root: this.rootGroup.getProtoInfo(this.componentIDMap)
      });
    }
  }

  private onClosedConnection(connection: Connection) {
    console.log('removing connection');
    this.connections.delete(connection);
  }

  private onMessage(connection: Connection, message: proto.ClientMessage) {
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
export {Component} from './components/base';
export {Group} from './components/group';
export {Slider} from './components/slider';
