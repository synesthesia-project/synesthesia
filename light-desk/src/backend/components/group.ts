import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

import {Component, Parent} from './base';

export class Group extends Component implements Parent {

  private readonly children: Component[] = [];

  public addChild(component: Component) {
    this.children.push(component);
    component.setParent(this);
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

  /**
   * TODO: we can do this better, right now it broadcasts the message to all
   * components of the tree
   */
  public routeMessage(idMap: IDMap, message: proto.ClientComponentMessage) {
    if (idMap.getId(this) === message.componentKey) {
      this.handleMessage(message);
    } else {
      for (const c of this.children) {
        if (c instanceof Group) {
          c.routeMessage(idMap, message);
        } else {
          if (idMap.getId(c) === message.componentKey)
            c.handleMessage(message);
        }
      }
    }
  }
}
