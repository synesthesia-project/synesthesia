import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

import {Component} from './base';

export class Slider extends Component {
  private min: number;
  private max: number;
  private step: number;
  private value: number | null;

  public constructor(value: number, min = 0, max = 255, step = 5) {
    super();
    this.min = min;
    this.max = max;
    this.step = step;
    this.value = value;
  }

  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'slider',
      key: idMap.getId(this),
      min: this.min,
      max: this.max,
      step: this.step,
      value: this.value
    };
  }

  public handleMessage(message: proto.ClientComponentMessage) {
    this.value = Math.max(this.min, Math.min(this.max, message.value));
    this.updateTree();
  }
}
