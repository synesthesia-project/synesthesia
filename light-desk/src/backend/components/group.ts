import { extend } from 'lodash';

import * as proto from '../../shared/proto';
import { GroupComponentStyle, GROUP_DEFAULT_STYLE } from '../../shared/styles';
import { IDMap } from '../util/id-map';

import { BaseParent, Component, EventEmitter, Listenable } from './base';
import type { Button } from './button';

type Label = (proto.GroupComponent['labels'] & Array<unknown>)[number];

type GroupOptions = {
  editableTitle?: boolean;
};

type Events = {
  'title-changed': (title: string) => void;
};

/**
 * A collection of components, grouped in either a row or column. Can contain
 * further groups as children to organize components however you wish, and have
 * a number of styling options (such as removing the border).
 *
 * ![](media://images/group_screenshot.png)
 */
export class Group extends BaseParent implements Listenable<Events> {
  /** @hidden */
  private readonly events = new EventEmitter<Events>();
  /** @hidden */
  private readonly children: Component[] = [];
  /** @hidden */
  private readonly style: GroupComponentStyle;
  /** @hidden */
  private title: string | undefined = undefined;
  /** @hidden */
  private labels?: Label[];
  /** @hidden */
  private headerButtons?: Button[];
  /** @hidden */
  private options: GroupOptions;

  public constructor(
    style: Partial<GroupComponentStyle> = {},
    opts?: GroupOptions
  ) {
    super();
    this.style = extend({}, GROUP_DEFAULT_STYLE, style);
    this.options = opts || {};
  }

  public setOptions = (options: GroupOptions) => {
    this.options = options;
    this.updateTree();
  };

  addListener = this.events.addListener;
  removeListener = this.events.removeListener;

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
    this.removeHeaderButton(component);
  }

  public removeAllChildren() {
    this.children.splice(0, this.children.length).map((c) => c.setParent(null));
    this.updateTree();
  }

  public setTitle(title: string) {
    this.title = title;
    this.updateTree();
  }

  public addLabel = (label: Label) => {
    this.labels = [...(this.labels || []), label];
    this.updateTree();
  };

  public setLabels = (labels: Label[]) => {
    this.labels = labels;
    this.updateTree();
  };

  public addHeaderButton = (button: Button): Button => {
    this.headerButtons = [...(this.headerButtons || []), button];
    button.setParent(this);
    this.updateTree();
    return button;
  };

  public removeHeaderButton = (button: Component) => {
    if (this.headerButtons) {
      const match = this.headerButtons.findIndex((c) => c === button);
      if (match >= 0) {
        const removed = this.headerButtons.splice(match, 1);
        removed.map((c) => c.setParent(null));
        this.updateTree();
      }
    }
  };

  public removeAllHeaderButtons = () => {
    this.headerButtons?.map((c) => c.setParent(null));
    this.headerButtons = undefined;
    this.updateTree();
  };

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.GroupComponent {
    return {
      component: 'group',
      key: idMap.getId(this),
      title: this.title,
      style: this.style,
      children: this.children.map((c) => c.getProtoInfo(idMap)),
      labels: this.labels,
      headerButtons: this.headerButtons?.map((c) => c.getProtoInfo(idMap)),
      editableTitle: this.options.editableTitle || false,
    };
  }

  /** @hidden */
  getAllChildren(): Iterable<Component> {
    return [...this.children, ...(this.headerButtons || [])];
  }

  /** @hidden */
  public handleMessage(message: proto.ClientComponentMessage) {
    if (message.component === 'group') {
      this.setTitle(message.title);
      this.events.emit('title-changed', message.title);
    }
  }
}
