import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

import {Component} from './base';

type Listener = (state: 'on' | 'off') => void;

export class Switch extends Component {

  private state: 'on' | 'off';

  private readonly listeners = new Set<Listener>();

  public constructor(state: 'on' | 'off') {
    super();
    this.state = state;
  }

  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'switch',
      key: idMap.getId(this),
      state: this.state
    };
  }

  public handleMessage(message: proto.ClientComponentMessage) {
    if (message.component === 'switch') {
      this.state = this.state === 'on' ? 'off' : 'on';
      for (const l of this.listeners) {
        l(this.state);
      }
      this.updateTree();
    }
  }

  public addListener(listener: Listener): Switch {
    this.listeners.add(listener);
    return this;
  }
}
