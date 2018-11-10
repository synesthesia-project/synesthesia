import {extend} from 'lodash';

import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

import {Component} from './base';

const DEFAULT_STYLE: proto.LabelComponentStyle = {
  bold: false
};

export class Label extends Component {

  private readonly style: proto.LabelComponentStyle;
  private text: string;

  public constructor(text: string, style: Partial<proto.LabelComponentStyle> = {}) {
    super();
    this.style = extend({}, DEFAULT_STYLE, style);
    this.text = text;
  }

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
