import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

import {Component} from './base';

type Listener = (value: number) => void;

export type SliderMode = 'writeThrough' | 'writeBack';

/**
 * A button that when "pressed" or "touched" expands to reveal a slider that
 * allows you to change the numeric value of something (between some maximum and
 * minimum that you define). Could be used for example: for dimmers, or DMX
 * values.
 *
 * ![](media://images/sliderbutton_screenshot.png)
 */
export class SliderButton extends Component {
  /** @hidden */
  private min: number;
  /** @hidden */
  private max: number;
  /** @hidden */
  private step: number;
  /** @hidden */
  private value: number | null;
  /** @hidden */
  private mode: SliderMode;

  /** @hidden */
  private readonly listeners = new Set<Listener>();

  public constructor(value: number, min = 0, max = 255, step = 5, mode: SliderMode = 'writeBack') {
    super();
    this.min = min;
    this.max = max;
    this.step = step;
    this.value = value;
    this.mode = mode;
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'slider_button',
      key: idMap.getId(this),
      min: this.min,
      max: this.max,
      step: this.step,
      value: this.value
    };
  }

  /** @hidden */
  public handleMessage(message: proto.ClientComponentMessage) {
    if (message.component !== 'slider_button') return;
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
