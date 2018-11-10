import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

import {Component} from './base';

type Listener = () => void;

export class Button extends Component {

  private text: string;

  private readonly listeners = new Set<Listener>();

  public constructor(text: string) {
    super();
    this.text = text;
  }

  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'button',
      key: idMap.getId(this),
      text: this.text
    };
  }

  public handleMessage(message: proto.ClientComponentMessage) {
    if (message.component === 'button') {
      for (const l of this.listeners) {
        l();
      }
    }
  }

  public addListener(listener: Listener): Button {
    this.listeners.add(listener);
    return this;
  }
}
