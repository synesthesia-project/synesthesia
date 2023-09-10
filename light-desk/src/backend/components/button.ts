import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

import { Base, EventEmitter, Listenable } from './base';

type Events = {
  click: () => void | Promise<void>;
};

export type ButtonMode = 'normal' | 'pressed';

export type InternalProps = {
  text: string | null;
  icon: string | null;
  mode: ButtonMode;
  error: string | null;
};

export type Props = Partial<InternalProps>;

const DEFAULT_PROPS: InternalProps = {
  text: null,
  icon: null,
  mode: 'normal',
  error: null,
};

/**
 * A simple component that can be "pressed" to trigger things.
 *
 * **Example:**
 *
 * ```js
 * const lightDesk = require('@synesthesia-project/light-desk');
 *
 * // ...
 *
 * const button1 = new lightDesk.Button('Button 1');
 * button1.addListener(() => console.log('Button 1 Pressed'));
 * group.addChild(button1);
 *
 * const button2 = new lightDesk.Button('Button 2');
 * button2.addListener(() => console.log('Button 2 Pressed'));
 * group.addChild(button2);
 * ```
 *
 * **Preview:**
 *
 * ![](media://images/button_screenshot.png)
 */
export class Button extends Base<InternalProps> implements Listenable<Events> {
  /** @hidden */
  private readonly events = new EventEmitter<Events>();

  public constructor(props?: Props) {
    super(DEFAULT_PROPS, props);
  }

  addListener = this.events.addListener;
  removeListener = this.events.removeListener;

  public setText = (text: string | null) => {
    this.updateProps({ text });
    return this;
  };

  public setIcon = (icon: string | undefined | null) => {
    this.updateProps({ icon: icon ?? null });
    return this;
  };

  public setMode = (mode: ButtonMode) => {
    this.updateProps({
      mode,
      error: null,
    });
    return this;
  };

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.ButtonComponent {
    return {
      component: 'button',
      key: idMap.getId(this),
      text: this.props.text || '',
      state: this.props.error
        ? { state: 'error', error: this.props.error }
        : { state: this.props.mode },
      icon: this.props.icon ?? undefined,
    };
  }

  /** @hidden */
  public handleMessage(message: proto.ClientComponentMessage) {
    if (message.component === 'button') {
      this.events
        .emit('click')
        .then(() => {
          if (this.props.error) {
            this.updateProps({
              error: null,
            });
          }
        })
        .catch((e) => {
          this.updateProps({
            error: `${e}`,
          });
        });
    }
  }
}
