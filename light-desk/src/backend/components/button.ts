import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

import { Component } from './base';

type Listener = () => void | Promise<void>;

export type ButtonMode = 'normal' | 'pressed';

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
  private icon?: string;
  private mode: ButtonMode = 'normal';
  private state: proto.ButtonComponent['state'] = {
    state: this.mode,
  };

  /** @hidden */
  private readonly listeners = new Set<Listener>();

  public constructor(text: string | null, icon?: string) {
    super();
    this.text = text || '';
    this.icon = icon;
  }

  public setText = (text: string | null) => {
    this.text = text || '';
    this.updateTree();
  };

  public setIcon = (icon: string | undefined) => {
    this.icon = icon;
    this.updateTree();
  };

  public setMode = (mode: ButtonMode) => {
    this.mode = mode;
    this.state = {
      state: this.mode,
    };
    this.updateTree();
  };

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.ButtonComponent {
    return {
      component: 'button',
      key: idMap.getId(this),
      text: this.text,
      state: this.state,
      icon: this.icon,
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
              state: this.mode,
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
