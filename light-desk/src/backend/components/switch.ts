import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

import { Base, EventEmitter, Listenable } from './base';

type Events = {
  change: (state: 'on' | 'off') => void | Promise<void>;
};

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
export class Switch extends Base<InternalProps> implements Listenable<Events> {
  /** @hidden */
  private readonly events = new EventEmitter<Events>();

  public constructor(props?: Props) {
    super(DEFAULT_PROPS, props);
  }

  addListener = this.events.addListener;
  removeListener = this.events.removeListener;

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
      this.events.emit('change', state);
    }
  }

  public setValue(state: 'on' | 'off') {
    if (state === this.props.state) return;
    this.updateProps({ state });
  }
}
