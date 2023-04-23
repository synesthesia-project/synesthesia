import {extend} from 'lodash';

import * as proto from '../../shared/proto';
import {LabelComponentStyle, LABEL_DEFAULT_STYLE} from '../../shared/styles';
import {IDMap} from '../util/id-map';

import {Component} from './base';

/**
 * A simple text component. Could be used to label components in a desk, or for
 * more dynamic purposes such as displaying the status of something.
 *
 * ![](media://images/label_screenshot.png)
 */
export class Label extends Component {

  /** @hidden */
  private readonly style: LabelComponentStyle;
  /** @hidden */
  private text: string;

  public constructor(text: string, style: Partial<LabelComponentStyle> = {}) {
    super();
    this.style = extend({}, LABEL_DEFAULT_STYLE, style);
    this.text = text;
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'label',
      key: idMap.getId(this),
      style: this.style,
      text: this.text
    };
  }

  public setText(text: string): Label {
    if (text !== this.text) {
      this.text = text;
      this.updateTree();
    }
    return this;
  }
}
