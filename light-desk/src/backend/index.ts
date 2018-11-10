import {Group} from './components/group';
import {IdMap} from './util/id-map';

import {Server} from './server';

const DEFAULT_PORT = 1337;

export class LightDesk {

  private readonly server: Server;
  private rootGroup: Group | null;
  /**
   * Mapping from components to unique IDs that identify them
   */
  private readonly componentIDMap = new IdMap();

  constructor(port = DEFAULT_PORT) {
    console.log('Starting light desk on port:', port);
    this.server = new Server(port);
    this.server.start();
  }

  public setRoot(group: Group) {
    if (this.rootGroup) {
      // TODO
      throw new Error('Can only set root group once');
    }
    this.rootGroup = group;
  }
}

// Export components
export {Component} from './components/base';
export {Group} from './components/group';
export {Slider} from './components/slider';
