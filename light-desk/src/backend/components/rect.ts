import * as proto from '../../shared/proto';
import {
  RGBAColor,
  RGBA_TRANSPARENT,
} from '@synesthesia-project/compositor/lib/color';
import { IDMap } from '../util/id-map';

import { Component } from './base';

/**
 * A simple rectangle component. Could be used for example to indicate
 * certain states, or represent the color of certain lights or fixtures,
 * or perhaps colours used in a chase.
 */
export class Rect extends Component {
  /** @hidden */
  private color: RGBAColor;

  public constructor(color: RGBAColor = RGBA_TRANSPARENT) {
    super();
    this.color = color;
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'rect',
      key: idMap.getId(this),
      color: {
        type: 'rgba',
        r: this.color.r,
        g: this.color.g,
        b: this.color.b,
        a: this.color.alpha,
      },
    };
  }

  public setColor(color: RGBAColor): Rect {
    if (!this.color.equals(color)) {
      this.color = color;
      this.updateTree();
    }
    return this;
  }
}
