import { extend } from 'lodash';

import * as proto from '../../shared/proto';
import { GroupComponentStyle, GROUP_DEFAULT_STYLE } from '../../shared/styles';
import { IDMap } from '../util/id-map';

import { Component, Parent } from './base';

/**
 * A collection of components, grouped in either a row or column. Can contain
 * further groups as children to organize components however you wish, and have
 * a number of styling options (such as removing the border).
 *
 * ![](media://images/group_screenshot.png)
 */
export class Group extends Component implements Parent {
  /** @hidden */
  private readonly children: Component[] = [];
  /** @hidden */
  private readonly style: GroupComponentStyle;
  /** @hidden */
  private title: string | undefined = undefined;

  public constructor(style: Partial<GroupComponentStyle> = {}) {
    super();
    this.style = extend({}, GROUP_DEFAULT_STYLE, style);
  }

  public addChild(...children: Component[]) {
    for (const c of children) {
      if (!this.children.includes(c)) {
        this.children.push(c);
        c.setParent(this);
      }
    }
    this.updateTree();
  }

  public removeChild(component: Component) {
    const match = this.children.findIndex((c) => c === component);
    if (match >= 0) {
      const removed = this.children.splice(match, 1);
      removed.map((c) => c.setParent(null));
      this.updateTree();
    }
  }

  public removeAllChildren() {
    this.children.splice(0, this.children.length);
    this.children.map((c) => c.setParent(null));
    this.updateTree();
  }

  public setTitle(title: string) {
    this.title = title;
    this.updateTree();
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.GroupComponent {
    return {
      component: 'group',
      key: idMap.getId(this),
      title: this.title,
      style: this.style,
      children: this.children.map((c) => c.getProtoInfo(idMap)),
    };
  }

  /**
   * TODO: we can do this better, right now it broadcasts the message to all
   * components of the tree
   *
   * @hidden
   */
  public routeMessage(idMap: IDMap, message: proto.ClientComponentMessage) {
    if (idMap.getId(this) === message.componentKey) {
      this.handleMessage(message);
    } else {
      for (const c of this.children) {
        if (c instanceof Group) {
          c.routeMessage(idMap, message);
        } else {
          if (idMap.getId(c) === message.componentKey) c.handleMessage(message);
        }
      }
    }
  }
}
