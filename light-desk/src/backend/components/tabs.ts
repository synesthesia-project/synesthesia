import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

import { BaseParent, Component } from './base';

type TabDefinition = {
  name: string;
  component: Component;
};

type InternalTabProps = {
  name: string;
};

export type TabProps = InternalTabProps;

export class Tab extends BaseParent<InternalTabProps> {
  public validateChildren = (children: Component[]) => {
    if (children.length > 1) {
      throw new Error('Tab can only have one child');
    }
  };

  /** @hidden */
  public getProtoInfo = (idMap: IDMap): proto.TabComponent => ({
    component: 'tab',
    key: idMap.getId(this),
    name: this.props.name,
    child: this.getChildren()
      .slice(0, 1)
      .map((c) => c.getProtoInfo(idMap))[0],
  });
}

type InternalTabsProps = Record<never, never>;

export type TabsProps = InternalTabsProps;

export class Tabs extends BaseParent<InternalTabsProps> {
  public validateChildren = (children: Component[]) => {
    for (const child of children) {
      if (!(child instanceof Tab)) {
        throw new Error('Tabs can only have Tab children');
      }
    }
  };

  public constructor(props?: TabsProps) {
    super({}, { ...props });
  }

  public addTabs(...tabs: TabDefinition[]) {
    for (const t of tabs) {
      const tab = new Tab({ name: t.name });
      tab.addChildren(t.component);
      this.addChild(tab);
    }
  }

  public addTab<C extends Component>(name: string, component: C): C {
    this.addTabs({ name, component });
    return component;
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.TabsComponent {
    return {
      component: 'tabs',
      key: idMap.getId(this),
      tabs: this.getChildren().map((c) => (c as Tab).getProtoInfo(idMap)),
    };
  }
}
