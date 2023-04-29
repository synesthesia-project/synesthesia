import * as React from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';
import { play } from '../audio';

import {
  rectButton,
  buttonStateNormalActive,
  touchIndicatorNormal,
  touchIndicatorTouching,
} from './styling';
import { calculateClass } from '../util/react';

const TOUCH_INDICATOR_CLASS = 'touch-indicator';
const TOUCHING_CLASS = 'touching';
const ERROR_CLASS = 'error';

interface Props {
  className?: string;
  info: proto.ButtonComponent;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}

interface State {
  touching: boolean;
}

class Button extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = {
      touching: false,
    };

    this.onClick = this.onClick.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
  }

  public render() {
    const { state } = this.props.info;
    return (
      <div
        className={calculateClass(
          this.props.className,
          this.state.touching && TOUCHING_CLASS,
          state.state === 'error' && ERROR_CLASS
        )}
        onClick={this.onClick}
        onTouchStart={this.onTouchStart}
        onTouchEnd={this.onTouchEnd}
        title={state.state === 'error' ? state.error : undefined}
      >
        <div className={TOUCH_INDICATOR_CLASS} />
        {this.props.info.text}
      </div>
    );
  }

  private click() {
    if (!this.props.sendMessage) return;
    console.log('sending message');
    this.props.sendMessage({
      type: 'component_message',
      componentKey: this.props.info.key,
      component: 'button',
    });
  }

  private onClick(_: React.MouseEvent<HTMLDivElement>) {
    this.click();
  }

  private onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    play('touch');
    event.preventDefault();
    this.setState({ touching: true });
  }

  private onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    event.preventDefault();
    this.setState({ touching: false });
    this.click();
    play('beep2');
  }
}

const StyledButton = styled(Button)`
  ${rectButton}
  outline: none;
  height: 30px;
  position: relative;
  overflow: visible;

  .${TOUCH_INDICATOR_CLASS} {
    ${touchIndicatorNormal}
  }

  &.${ERROR_CLASS} {
    color: ${(p) => p.theme.colorRed};
    border-color: ${(p) => p.theme.colorRed};
  }

  &.${TOUCHING_CLASS} {
    ${buttonStateNormalActive}

    .${TOUCH_INDICATOR_CLASS} {
      ${touchIndicatorTouching}
    }
  }
`;

export { StyledButton as Button };
