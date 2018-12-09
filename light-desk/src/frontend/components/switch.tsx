import * as React from 'react';

import * as proto from '../../shared/proto';

import {styled, touchIndicatorNormal, touchIndicatorTouching} from './styling';

const CLASS_TOUCHING = 'touching';
const TOUCH_INDICATOR_CLASS = 'touch-indicator';

interface Props {
  className?: string;
  info: proto.SwitchComponent;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}

interface State {
  touching: boolean;
}

class Switch extends React.Component<Props, State> {

  public constructor(props: Props) {
    super(props);
    this.state = {
      touching: false
    };

    this.onClick = this.onClick.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
  }

  public render() {
    const classes = [this.props.className];
    if (this.state.touching) classes.push(CLASS_TOUCHING);
    return (
      <div
        className={classes.join(' ')}
        onClick={this.onClick}
        onTouchStart={this.onTouchStart}
        onTouchEnd={this.onTouchEnd}>
        <div className={TOUCH_INDICATOR_CLASS} />
        <div className="inner">
          <div className={'slider' + (this.props.info.state === 'on' ? ' on' : '')}>
            <div className="on-text">ON</div>
            <div className="off-text">OFF</div>
            <div className="button" />
          </div>
        </div>
      </div>
    );
  }

  private click() {
    if (!this.props.sendMessage) return;
    console.log('sending message');
    this.props.sendMessage({
      type: 'component_message',
      componentKey: this.props.info.key,
      component: 'switch'
    });
  }

  private onClick() {
    this.click();
  }

  private onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    event.preventDefault();
    this.setState({touching: true});
  }

  private onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    event.preventDefault();
    this.setState({touching: false});
    this.click();
  }
}

const SWITCH_HEIGHT = 30;
const BUTTON_WIDTH = 30;
const TEXT_WIDTH = 40;

const StyledSwitch = styled(Switch)`
  position: relative;

  .inner {

    display: block;
    position: relative;
    overflow: hidden;
    width: ${BUTTON_WIDTH + TEXT_WIDTH}px;
    min-width: ${BUTTON_WIDTH + TEXT_WIDTH}px;
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
        text-shadow: 0 -1px rgba(0, 0, 0, 0.4);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2), 0 1px 0 0 rgba(255,255,255,0.15);
      }

      > .on-text {
        left: -40px;
        background: linear-gradient(to bottom, ${p => p.theme.hintDark1}, ${p => p.theme.hint});
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
        background: linear-gradient(to bottom, #242525, #37383A);
        left: ${BUTTON_WIDTH - 2}px;
      }

      &.on {
        left: 40px;
      }

      &:hover > .button {
        background: linear-gradient(to bottom, #5e6064, #393A3B);
      }

    }
  }

  .${TOUCH_INDICATOR_CLASS} {
    ${touchIndicatorNormal}
  }

  &.${CLASS_TOUCHING} {
    .${TOUCH_INDICATOR_CLASS} {
      ${touchIndicatorTouching}
    }
  }

`;

export {StyledSwitch as Switch};
