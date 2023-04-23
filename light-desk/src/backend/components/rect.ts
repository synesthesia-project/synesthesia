import * as proto from '../../shared/proto';
import { Color, COLOR_RGB_WHITE} from '../util/color';
import {IDMap} from '../util/id-map';

import {Component} from './base';

/**
 * A simple rectangle component. Could be used for example to indicate
 * certain states, or represent the color of certain lights or fixtures,
 * or perhaps colours used in a chase.
 *
 * **Example:**
 *
 * ```js
 * const lightDesk = require('@synesthesia-project/light-desk');
 *
 * // ...
 *
 * group.addChild(new lightDesk.Rect(new lightDesk.color.RGBColor(85, 85, 85)));
 * group.addChild(new lightDesk.Rect(new lightDesk.color.RGBColor(255, 255, 0)));
 * group.addChild(new lightDesk.Rect(new lightDesk.color.RGBColor(255, 0, 0)));
 * group.addChild(new lightDesk.Rect(new lightDesk.color.RGBColor(255, 255, 255)));
 * group.addChild(new lightDesk.Rect(new lightDesk.color.RGBColor(200, 200, 200)));
 * ```
 *
 * **Preview:**
 *
 * ![](media://images/rect_screenshot.png)
 */
export class Rect extends Component {

  /** @hidden */
  private color: Color;

  public constructor(color: Color = COLOR_RGB_WHITE) {
    super();
    this.color = color;
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'rect',
      key: idMap.getId(this),
      color: this.color.json()
    };
  }

  public setColor(color: Color): Rect {
    if (!this.color.equals(color)) {
      this.color = color;
      this.updateTree();
    }
    return this;
  }
}
