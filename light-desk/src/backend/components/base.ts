import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

export interface Component {
  getProtoInfo(idMap: IDMap): proto.Component;

  handleMessage(message: proto.ClientComponentMessage): void;

  routeMessage(idMap: IDMap, message: proto.ClientComponentMessage): void;

  setParent(parent: Parent | null): void;
}

export abstract class Base<Props> implements Component {
  /** @hidden */
  private parent: Parent | null = null;

  /** @hidden */
  private readonly defaultProps: Props;

  /** @hidden */
  private _props: Props;

  public constructor(defaultProps: Props, props?: Partial<Props>) {
    this.defaultProps = defaultProps;
    this._props = Object.freeze({
      ...defaultProps,
      ...props,
    });
  }

  public get props(): Props {
    return this._props;
  }

  public set props(props: Partial<Props>) {
    this.setProps(props);
  }

  public setProps = (props: Partial<Props>) => {
    this._props = Object.freeze({
      ...this.defaultProps,
      ...props,
    });
    this.updateTree();
  };

  public updateProps = (updates: Partial<Props>) => {
    this._props = Object.freeze({
      ...this._props,
      ...updates,
    });
    this.updateTree();
  };

  /** @hidden */
  public setParent(parent: Parent | null) {
    if (this.parent && this.parent !== parent) {
      this.parent.removeChild(this);
    }
    this.parent = parent;
  }

  /** @hidden */
  public updateTree() {
    if (this.parent) this.parent.updateTree();
  }

  /** @hidden */
  public abstract getProtoInfo(idMap: IDMap): proto.Component;

  /** @hidden */
  public handleMessage(message: proto.ClientComponentMessage): void {
    console.log('Component Received Message:', message);
  }

  public routeMessage(
    _idMap: IDMap,
    _message: proto.ClientComponentMessage
  ): void {
    // Do nothing by default, only useful for Parent components
  }
}

/** @hidden */
export interface Parent {
  updateTree(): void;
  removeChild(component: Component): void;
}

export abstract class BaseParent<T> extends Base<T> implements Parent {
  /** @hidden */
  private children: readonly Component[] = [];

  public abstract validateChildren(children: Component[]): void;

  public addChildren = <CS extends Component[]>(...children: CS): CS => {
    for (const c of children) {
      if (!this.children.includes(c)) {
        const newChildren = [...this.children, c];
        this.validateChildren(newChildren);
        this.children = Object.freeze(newChildren);
        c.setParent(this);
      }
    }
    this.updateTree();
    return children;
  };

  public addChild = <C extends Component>(child: C): C => {
    this.addChildren(child);
    return child;
  };

  public removeChild = (component: Component) => {
    const match = this.children.findIndex((c) => c === component);
    if (match >= 0) {
      const removingChild = this.children[0];
      const newChildren = [
        ...this.children.slice(0, match),
        ...this.children.slice(match + 1),
      ];
      this.validateChildren(newChildren);
      this.children = Object.freeze(newChildren);
      removingChild.setParent(null);
      this.updateTree();
    }
  };

  public removeAllChildren = () => {
    this.children.map((c) => c.setParent(null));
    this.children = Object.freeze([]);
    this.updateTree();
  };

  /**
   * Return all children components that messages need to be routed to
   */
  public getChildren = (): readonly Component[] => this.children;

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
        if (idMap.getId(c) === message.componentKey) {
          c.handleMessage(message);
        } else {
          c.routeMessage(idMap, message);
        }
      }
    }
  }

  public insertBefore(_child: Component, _beforeChild: Component) {
    throw new Error('TODO');
  }
}

export interface Listenable<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Map extends Record<string, (...args: any[]) => void>
> {
  addListener<T extends keyof Map>(type: T, listener: Map[T]): void;
  removeListener<T extends keyof Map>(type: T, listener: Map[T]): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class EventEmitter<Map extends Record<string, (...args: any[]) => void>>
  implements Listenable<Map>
{
  private readonly listeners = new Map<
    keyof Map,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Set<(...args: any[]) => void>
  >();

  addListener = <T extends keyof Map>(type: T, listener: Map[T]) => {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener);
  };

  removeListener = <T extends keyof Map>(type: T, listener: Map[T]) => {
    this.listeners.get(type)?.delete(listener);
  };

  emit = <T extends keyof Map>(
    type: T,
    ...args: Parameters<Map[T]>
  ): Promise<unknown> => {
    return Promise.all(
      [...(this.listeners.get(type) || [])].map(
        (l) =>
          new Promise((resolve, reject) => {
            try {
              resolve(l(...args));
            } catch (e) {
              reject(e);
            }
          })
      )
    );
  };
}
