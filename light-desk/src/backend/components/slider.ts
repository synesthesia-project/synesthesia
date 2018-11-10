import {Component} from './base';

export class Slider extends Component {
  private min: number;
  private max: number;
  private step: number;

  public constructor(min = 0, max = 255, step = 1) {
    super();
    this.min = min;
    this.max = max;
    this.step = step;
  }
}
