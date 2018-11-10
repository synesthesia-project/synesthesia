import {Component} from './base';

export class Group extends Component {

  private readonly children: Component[] = [];

  public addChild(component: Component) {
    this.children.push(component);
    // TODO: allow children to have only one parent
    // TODO: prevent loops
  }
}
