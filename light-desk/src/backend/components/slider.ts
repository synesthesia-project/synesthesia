import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

import {Component} from './base';

type Listener = (value: number) => void;

export type SliderMode = 'writeThrough' | 'writeBack';

export class Slider extends Component {
  private min: number;
  private max: number;
  private step: number;
  private value: number | null;
  private mode: SliderMode;

  private readonly listeners = new Set<Listener>();

  public constructor(value: number, min = 0, max = 255, step = 5, mode: SliderMode = 'writeBack') {
    super();
    this.min = min;
    this.max = max;
    this.step = step;
    this.value = value;
    this.mode = mode;
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
    if (message.component !== 'slider') return;
    const newValue = Math.max(this.min, Math.min(this.max, message.value));
    if (this.value === newValue) return;
    if (this.mode === 'writeBack')
      this.value = newValue;
    for (const l of this.listeners) {
      l(newValue);
    }
    this.updateTree();
  }

  public addListener(listener: Listener) {
    this.listeners.add(listener);
  }

  public setValue(value: number) {
    const newValue = Math.max(this.min, Math.min(this.max, value));
    if (newValue === this.value) return;
    this.value = newValue;
    this.updateTree();
  }
}
