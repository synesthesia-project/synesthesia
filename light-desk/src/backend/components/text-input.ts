import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

import { Component } from './base';

type Listener = (value: string) => void;

export class TextInput extends Component {
  /** @hidden */
  private value: string;

  /** @hidden */
  private readonly listeners = new Set<Listener>();

  public constructor(value: string) {
    super();
    this.value = value;
  }

  /** @hidden */
  public getProtoInfo = (idMap: IDMap): proto.Component => {
    return {
      component: 'text-input',
      key: idMap.getId(this),
      value: this.value,
    };
  };

  /** @hidden */
  public handleMessage = (message: proto.ClientComponentMessage) => {
    if (message.component === 'text-input') {
      if (this.value !== message.value) {
        this.value = message.value;
        for (const l of this.listeners) {
          l(this.value);
        }
        this.updateTree();
      }
    }
  };

  public addListener = (listener: Listener): TextInput => {
    this.listeners.add(listener);
    return this;
  };

  public getValue = () => this.value;

  public getValidatedValue = <T>(validator: (text: string) => T): null | T =>
    this.value === '' ? null : validator(this.value);

  public setValue = (value: string) => {
    this.value = value;
    this.updateTree();
  };
}
