import * as React from 'react';

import * as proto from '../../shared/proto';

import {KEYS} from '../util/keys';

import {styled} from './styling';

interface Props {
  className?: string;
  info: proto.SwitchComponent;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}

class Switch extends React.Component<Props, {}> {

  public constructor(props: Props) {
    super(props);

    this.onChange = this.onChange.bind(this);
  }

  public render() {
    return (
      <div className={this.props.className} onClick={this.onChange}>
        <div className={'slider' + (this.props.info.state === 'on' ? ' on' : '')}>
          <div className="on-text">ON</div>
          <div className="off-text">OFF</div>
          <div className="button" />
        </div>
      </div>
    );
  }

  private onChange(event: React.MouseEvent<HTMLDivElement>) {
    if (!this.props.sendMessage) return;
    this.props.sendMessage({
      type: 'component_message',
      componentKey: this.props.info.key,
      component: 'switch'
    });
  }
}

const SWITCH_HEIGHT = 30;
const BUTTON_WIDTH = 30;
const TEXT_WIDTH = 40;

const StyledSwitch = styled(Switch)`
  display: block;
  position: relative;
  overflow: hidden;
  width: ${BUTTON_WIDTH + TEXT_WIDTH}px;
  height: ${SWITCH_HEIGHT}px;
  border-radius: 3px;
  border: 1px solid ${p => p.theme.borderDark};

  > .slider {
    position: absolute;
    top: 0;
    left: 0;
    cursor: pointer;
    transition: left 300ms;

    > .on-text, .off-text, .button  {
      position: absolute;
      height: ${SWITCH_HEIGHT}px;
    }

    > .on-text, .off-text {
      width: ${TEXT_WIDTH}px;
      text-align: center;
      top: 0;
      line-height: ${SWITCH_HEIGHT - 2}px;
      background: linear-gradient(to bottom, #242525, #37383A);
      text-shadow: 0 -1px rgba(0, 0, 0, 0.4);
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2), 0 1px 0 0 rgba(255,255,255,0.15);
    }

    > .on-text {
      left: -40px;
    }

    > .button {
      top: -1px;
      left: -1px;
      width: ${BUTTON_WIDTH}px;
      background: linear-gradient(to bottom, #4f5053, #343436);
      text-shadow: 0 -1px rgba(0, 0, 0, 0.7);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
      border-radius: 3px;
      border: 1px solid ${p => p.theme.borderDark};
    }

    > .off-text {
      left: ${BUTTON_WIDTH - 2}px;
    }

    &.on {
      left: 40px;
    }

    &:hover > .button {
      background: linear-gradient(to bottom, #5e6064, #393A3B);
    }

  }

`;

export {StyledSwitch as Switch};
