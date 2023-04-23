import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

import {Component} from './base';

type Listener = () => void;

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

  /** @hidden */
  private readonly listeners = new Set<Listener>();

  public constructor(text: string) {
    super();
    this.text = text;
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'button',
      key: idMap.getId(this),
      text: this.text
    };
  }

  /** @hidden */
  public handleMessage(message: proto.ClientComponentMessage) {
    if (message.component === 'button') {
      for (const l of this.listeners) {
        l();
      }
    }
  }

  public addListener(listener: Listener): Button {
    this.listeners.add(listener);
    return this;
  }
}
