import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

import { Base } from './base';

type Listener = (state: 'on' | 'off') => void;

type InternalProps = {
  state: 'on' | 'off';
};

export type Props = Partial<InternalProps>;

const DEFAULT_PROPS: InternalProps = {
  state: 'off',
};

/**
 * A component that allows you to switch between an "on" and "off" state.
 *
 * ![](media://images/switch_screenshot.png)
 */
export class Switch extends Base<InternalProps> {
  /** @hidden */
  private readonly listeners = new Set<Listener>();

  public constructor(props?: Props) {
    super(DEFAULT_PROPS, props);
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'switch',
      key: idMap.getId(this),
      state: this.props.state,
    };
  }

  /** @hidden */
  public handleMessage(message: proto.ClientComponentMessage) {
    if (message.component === 'switch') {
      // Toggle state value
      const state = this.props.state === 'on' ? 'off' : 'on';
      this.updateProps({ state });
      for (const l of this.listeners) {
        l(state);
      }
    }
  }

  public addListener(listener: Listener): Switch {
    this.listeners.add(listener);
    return this;
  }

  public setValue(state: 'on' | 'off') {
    if (state === this.props.state) return;
    this.updateProps({ state });
  }
}
