import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

import {Component} from './base';

type Listener = (state: 'on' | 'off') => void;

/**
 * A component that allows you to switch between an "on" and "off" state.
 *
 * ![](media://images/switch_screenshot.png)
 */
export class Switch extends Component {

  /** @hidden */
  private state: 'on' | 'off';

  /** @hidden */
  private readonly listeners = new Set<Listener>();

  public constructor(state: 'on' | 'off') {
    super();
    this.state = state;
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'switch',
      key: idMap.getId(this),
      state: this.state
    };
  }

  /** @hidden */
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

  public setValue(state: 'on' | 'off') {
    if (state === this.state) return;
    this.state = state;
    this.updateTree();
  }
}
