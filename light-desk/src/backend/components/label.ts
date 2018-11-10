import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

import {Component} from './base';

export class Label extends Component {
  private text: string;

  public constructor(text: string) {
    super();
    this.text = text;
  }

  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'label',
      key: idMap.getId(this),
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
