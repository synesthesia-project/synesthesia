import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

export abstract class Component {
  /** @hidden */
  private parent: Parent | null = null;

  /** @hidden */
  public setParent(parent: Parent | null) {
    if (this.parent) {
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
}

/** @hidden */
export interface Parent {
  updateTree(): void;
  removeChild(component: Component): void;
}
