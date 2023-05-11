import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

import { BaseParent, Component } from './base';
import { ListComponentOptions } from '../../shared/options';


export class List extends BaseParent {
  /** @hidden */
  private readonly children: Component[] = [];
  /** @hidden */
  private readonly options: ListComponentOptions;

  public constructor(options: ListComponentOptions = {}) {
    super();
    this.options = options;
  }

  public setChildren(...children: Component[]) {
    // Remove any children that are no longer present
    for (const c of this.children) {
      if (!children.includes(c)) {
        c.setParent(null);
      }
    }
    this.children.splice(0, this.children.length, ...children);
    for (const c of children) {
      c.setParent(this);
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

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.ListComponent {
    return {
      component: 'list',
      key: idMap.getId(this),
      children: this.children.map((c) => c.getProtoInfo(idMap)),
      options: this.options,
    };
  }

  /** @hidden */
  getAllChildren(): Iterable<Component> {
    return this.children;
  }
}
