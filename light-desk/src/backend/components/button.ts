import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

import { Component } from './base';

type Listener = () => void | Promise<void>;

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
export class Button extends Component {
  /** @hidden */
  private text: string;
  private state: proto.ButtonComponent['state'] = {
    state: 'normal',
  };

  /** @hidden */
  private readonly listeners = new Set<Listener>();

  public constructor(text: string) {
    super();
    this.text = text;
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.ButtonComponent {
    return {
      component: 'button',
      key: idMap.getId(this),
      text: this.text,
      state: this.state,
    };
  }

  /** @hidden */
  public handleMessage(message: proto.ClientComponentMessage) {
    if (message.component === 'button') {
      Promise.all(
        [...this.listeners].map(
          (l) =>
            new Promise((resolve, reject) => {
              try {
                resolve(l());
              } catch (e) {
                reject(e);
              }
            })
        )
      )
        .then(() => {
          if (this.state.state !== 'normal') {
            this.state = {
              state: 'normal',
            };
            this.updateTree();
          }
        })
        .catch((e) => {
          this.state = {
            state: 'error',
            error: `${e}`,
          };
          this.updateTree();
        });
    }
  }

  public addListener(listener: Listener): Button {
    this.listeners.add(listener);
    return this;
  }
}
