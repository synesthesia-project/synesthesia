import {extend} from 'lodash';

import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

import {Component, Parent} from './base';

const DEFAULT_STYLE: proto.GroupComponentStyle = {
  direction: 'horizontal'
};

export class Group extends Component implements Parent {

  private readonly children: Component[] = [];
  private readonly style: proto.GroupComponentStyle;
  private title: string | undefined = undefined;

  public constructor(style: Partial<proto.GroupComponentStyle> = {}) {
    super();
    this.style = extend({}, DEFAULT_STYLE, style);
  }

  public addChild(component: Component) {
    this.children.push(component);
    component.setParent(this);
    // TODO: allow children to have only one parent
    // TODO: prevent loops
  }

  public setTitle(title: string) {
    this.title = title;
    this.updateTree();
  }

  public getProtoInfo(idMap: IDMap): proto.GroupComponent {
    return {
      component: 'group',
      key: idMap.getId(this),
      title: this.title,
      style: this.style,
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
