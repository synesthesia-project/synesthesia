import * as proto from '../../shared/proto';
import { GroupComponentStyle, GROUP_DEFAULT_STYLE } from '../../shared/styles';
import { IDMap } from '../util/id-map';

import { BaseParent, Component, EventEmitter, Listenable } from './base';
import type { Button } from './button';

type Label = (proto.GroupComponent['labels'] & Array<unknown>)[number];

type GroupOptions = {
  editableTitle?: boolean;
  defaultCollapsibleState?: proto.GroupComponent['defaultCollapsibleState'];
};

type Events = {
  'title-changed': (title: string) => void;
};

export type InternalProps = GroupComponentStyle &
  GroupOptions & {
    title: string | null;
    labels: Label[] | null;
    headerButtons: Button[] | null;
  };

export type Props = Partial<InternalProps>;

const DEFAULT_PROPS: InternalProps = {
  ...GROUP_DEFAULT_STYLE,
  title: null,
  labels: null,
  headerButtons: null,
};

/**
 * A collection of components, grouped in either a row or column. Can contain
 * further groups as children to organize components however you wish, and have
 * a number of styling options (such as removing the border).
 *
 * ![](media://images/group_screenshot.png)
 */
export class Group
  extends BaseParent<InternalProps>
  implements Listenable<Events>
{
  /** @hidden */
  private readonly events = new EventEmitter<Events>();
  /** @hidden */
  private readonly children: Component[] = [];

  public constructor(props?: Props) {
    super(DEFAULT_PROPS, props);
  }

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

  public setOptions = (options: GroupOptions) => {
    this.updateProps(options);
  };

  public setTitle(title: string) {
    this.updateProps({ title });
  }

  public addLabel = (label: Label) => {
    this.updateProps({ labels: [...(this.props.labels || []), label] });
  };

  public setLabels = (labels: Label[]) => {
    this.updateProps({ labels });
  };

  public addHeaderButton = (button: Button): Button => {
    button.setParent(this);
    this.updateProps({
      headerButtons: [...(this.props.headerButtons || []), button],
    });
    this.updateTree();
    return button;
  };

  public removeHeaderButton = (button: Component) => {
    const buttons = this.props.headerButtons;
    if (buttons) {
      const match = buttons.findIndex((c) => c === button);
      if (match >= 0) {
        const matchingButton = buttons[match];
        this.updateProps({
          headerButtons: [
            ...buttons.slice(0, match),
            ...buttons.slice(match + 1),
          ],
        });
        // Remove parent form button _after_ removing button from parent
        // to prevent loop
        matchingButton.setParent(null);
      }
    }
  };

  public removeAllHeaderButtons = () => {
    this.props.headerButtons?.map((c) => c.setParent(null));
    this.updateProps({
      headerButtons: [],
    });
    this.updateTree();
  };

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.GroupComponent {
    return {
      component: 'group',
      key: idMap.getId(this),
      title: this.props.title ?? undefined,
      style: {
        direction: this.props.direction,
        noBorder: this.props.noBorder,
        wrap: this.props.wrap,
      },
      children: this.children.map((c) => c.getProtoInfo(idMap)),
      labels: this.props.labels ?? undefined,
      headerButtons:
        this.props.headerButtons?.map((c) => c.getProtoInfo(idMap)) ??
        undefined,
      editableTitle: this.props.editableTitle || false,
      defaultCollapsibleState: this.props.defaultCollapsibleState,
    };
  }

  /** @hidden */
  getAllChildren(): Iterable<Component> {
    return [...this.children, ...(this.props.headerButtons || [])];
  }

  /** @hidden */
  public handleMessage(message: proto.ClientComponentMessage) {
    if (message.component === 'group') {
      this.setTitle(message.title);
      this.events.emit('title-changed', message.title);
    }
  }
}
