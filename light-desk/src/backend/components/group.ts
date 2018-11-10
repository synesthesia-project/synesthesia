import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

import {Component} from './base';

export class Group extends Component {

  private readonly children: Component[] = [];

  public addChild(component: Component) {
    this.children.push(component);
    // TODO: allow children to have only one parent
    // TODO: prevent loops
  }

  public getProtoInfo(idMap: IDMap): proto.GroupComponent {
    return {
      component: 'group',
      key: idMap.getId(this),
      children: this.children.map(c => c.getProtoInfo(idMap))
    };
  }
}
