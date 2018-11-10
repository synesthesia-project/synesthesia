import * as React from 'react';

import * as proto from '../../shared/proto';

import {KEYS} from '../util/keys';

import {styled} from './styling';

interface Props {
  className?: string;
  info: proto.SliderComponent;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}

class Slider extends React.Component<Props, {}> {

  public constructor(props: Props) {
    super(props);

    this.onKeyDown = this.onKeyDown.bind(this);
  }

  public render() {
    const value = this.props.info.value;
    return (
      <div className={this.props.className}>
        <input type="number" value={value === null ? '' : value.toString()} onKeyDown={this.onKeyDown}/>
      </div>
    );
  }

  private onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!this.props.sendMessage || this.props.info.value === null) return;
    let value: number | null = null;
    switch (event.keyCode) {
      case KEYS.DOWN:
      value = this.props.info.value - this.props.info.step;
      break;
      case KEYS.UP:
      value = this.props.info.value + this.props.info.step;
      break;
    }
    if (value !== null) {
      console.log('sending message');
      this.props.sendMessage({
        type: 'component_message',
        componentKey: this.props.info.key,
        component: 'slider',
        value
      });
    }
  }
}

const StyledSlider = styled(Slider)`

`;

export {StyledSlider as Slider};
