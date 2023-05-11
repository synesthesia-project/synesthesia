import { extend } from 'lodash';

import * as proto from '../../shared/proto';
import { GroupComponentStyle, GROUP_DEFAULT_STYLE } from '../../shared/styles';
import { IDMap } from '../util/id-map';

import { BaseParent, Component } from './base';

/**
 * A collection of components, grouped in either a row or column. Can contain
 * further groups as children to organize components however you wish, and have
 * a number of styling options (such as removing the border).
 *
 * ![](media://images/group_screenshot.png)
 */
export class Group extends BaseParent {
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

  public addChildren<CS extends Component[]>(...children: CS): CS {
    for (const c of children) {
      if (!this.children.includes(c)) {
        this.children.push(c);
        c.setParent(this);
      }
    }
    this.updateTree();
    return children;
  }

  public addChild<C extends Component>(child: C): C {
    this.addChildren(child);
    return child;
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

  /** @hidden */
  getAllChildren(): Iterable<Component> {
    return this.children;
  }
}
