import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

import { BaseParent, Component } from './base';

type Tab = {
  name: string;
  component: Component;
};

type InternalProps = Record<never, never>;

export type Props = InternalProps;

export class Tabs extends BaseParent<InternalProps> {
  /** @hidden */
  private readonly tabs: Tab[] = [];

  public constructor(props?: Props) {
    super({}, { ...props });
  }

  public addTabs(...tabs: Tab[]) {
    for (const t of tabs) {
      if (!this.tabs.some((existing) => existing.component === t.component)) {
        this.tabs.push(t);
        t.component.setParent(this);
      }
    }
    this.updateTree();
  }

  public addTab<C extends Component>(name: string, component: C): C {
    this.addTabs({ name, component });
    return component;
  }

  public removeChild(component: Component) {
    const match = this.tabs.findIndex((t) => t.component === component);
    if (match >= 0) {
      const removed = this.tabs.splice(match, 1);
      removed.map((t) => t.component.setParent(null));
      this.updateTree();
    }
  }

  public removeAllChildren() {
    this.tabs
      .splice(0, this.tabs.length)
      .map((t) => t.component.setParent(null));
    this.updateTree();
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.TabsComponent {
    return {
      component: 'tabs',
      key: idMap.getId(this),
      tabs: this.tabs.map((t) => ({
        name: t.name,
        component: t.component.getProtoInfo(idMap),
      })),
    };
  }

  getAllChildren() {
    return this.tabs.map((t) => t.component);
  }
}
