import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

import { Base } from './base';

type Listener = (value: number) => void;

export type SliderMode = 'writeThrough' | 'writeBack';

type InternalProps = {
  min: number;
  max: number;
  step: number;
  value: number | null;
  mode: SliderMode;
};

type RequiredProps = 'value';

export type Props = Pick<InternalProps, RequiredProps> &
  Partial<Omit<InternalProps, RequiredProps>>;

const DEFAULT_PROPS: InternalProps = {
  value: null,
  min: 0,
  max: 255,
  step: 5,
  mode: 'writeBack',
};

/**
 * A button that when "pressed" or "touched" expands to reveal a slider that
 * allows you to change the numeric value of something (between some maximum and
 * minimum that you define). Could be used for example: for dimmers, or DMX
 * values.
 *
 * ![](media://images/sliderbutton_screenshot.png)
 */
export class SliderButton extends Base<InternalProps> {
  /** @hidden */
  private readonly listeners = new Set<Listener>();

  public constructor(props?: Props) {
    super(DEFAULT_PROPS, props);
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'slider_button',
      key: idMap.getId(this),
      min: this.props.min,
      max: this.props.max,
      step: this.props.step,
      value: this.props.value,
    };
  }

  /** @hidden */
  public handleMessage(message: proto.ClientComponentMessage) {
    if (message.component !== 'slider_button') return;
    const newValue = this.sanitizeNumber(message.value);
    if (this.props.value === newValue) return;
    if (this.props.mode === 'writeBack') {
      this.updateProps({ value: newValue });
    }
    for (const l of this.listeners) {
      l(newValue);
    }
  }

  public addListener(listener: Listener) {
    this.listeners.add(listener);
  }

  public setValue(value: number) {
    const newValue = this.sanitizeNumber(value);
    if (newValue === this.props.value) return;
    this.updateProps({ value });
    this.updateTree();
  }

  private sanitizeNumber(value: number) {
    // Return the closest number according to the min, max and step values
    // allowedValue = min + step * i (for some integer i)
    const i = Math.round((value - this.props.min) / this.props.step);
    const v = i * this.props.step + this.props.min;
    // map value to an integer index
    const clampedValue = Math.max(this.props.min, Math.min(this.props.max, v));
    return clampedValue;
  }
}
