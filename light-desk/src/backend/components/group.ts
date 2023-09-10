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

export class GroupHeader extends BaseParent<Record<never, never>> {
  public validateChildren = () => {
    // All children are valid
  };

  /** @hidden */
  public getProtoInfo = (idMap: IDMap): proto.GroupHeaderComponent => ({
    component: 'group-header',
    key: idMap.getId(this),
    children: this.getChildren().map((c) => c.getProtoInfo(idMap)),
  });
}

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

  public constructor(props?: Props) {
    super(DEFAULT_PROPS, props);
  }

  addListener = this.events.addListener;
  removeListener = this.events.removeListener;

  public validateChildren = () => {
    // All children are valid
  };

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

  public addHeaderChild = (child: Button): Button => {
    const header = new GroupHeader({});
    header.addChild(child);
    this.addChild(header);
    return child;
  };

  public removeHeaderButton = (button: Component) => {
    for (const child of this.getChildren()) {
      if (child instanceof GroupHeader) {
        child.removeChild(button);
      }
    }
  };

  public removeAllHeaderButtons = () => {
    for (const child of this.getChildren()) {
      if (child instanceof GroupHeader) {
        child.removeAllChildren();
      }
    }
  };

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.GroupComponent {
    const children: proto.Component[] = [];
    const headers: proto.GroupHeaderComponent[] = [];
    for (const c of this.getChildren()) {
      const childProto = c.getProtoInfo(idMap);
      if (childProto.component === 'group-header') {
        headers.push(childProto);
      } else {
        children.push(childProto);
      }
    }
    return {
      component: 'group',
      key: idMap.getId(this),
      title: this.props.title ?? undefined,
      style: {
        direction: this.props.direction,
        noBorder: this.props.noBorder,
        wrap: this.props.wrap,
      },
      children,
      headers: headers.length > 0 ? headers : undefined,
      labels: this.props.labels ?? undefined,
      editableTitle: this.props.editableTitle || false,
      defaultCollapsibleState: this.props.defaultCollapsibleState,
    };
  }

  /** @hidden */
  public handleMessage(message: proto.ClientComponentMessage) {
    if (message.component === 'group') {
      this.setTitle(message.title);
      this.events.emit('title-changed', message.title);
    }
  }
}
