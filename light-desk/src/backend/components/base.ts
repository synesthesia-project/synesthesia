import * as proto from '../../shared/proto';
import {IDMap} from '../util/id-map';

export abstract class Component {

  private parent: Parent | null;

  public setParent(parent: Parent) {
    if (this.parent) {
      // TODO: remove self from existing parent
    }
    this.parent = parent;
  }

  public updateTree() {
    if (this.parent) this.parent.updateTree();
  }

  public abstract getProtoInfo(idMap: IDMap): proto.Component;

  public handleMessage(message: proto.ClientComponentMessage): void {
    console.log('Component Received Message:', message);
  }

}

export interface Parent {
  updateTree(): void;
}
