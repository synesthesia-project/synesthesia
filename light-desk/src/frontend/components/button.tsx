import * as React from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';
import { play } from '../util/audio';

import {
  rectButton,
  buttonStateNormalActive,
  touchIndicatorNormal,
  touchIndicatorTouching,
} from './styling';
import { calculateClass } from '../util/react';
import { StageContext } from './context';

const TOUCH_INDICATOR_CLASS = 'touch-indicator';
const TOUCHING_CLASS = 'touching';
const ERROR_CLASS = 'error';

interface Props {
  className?: string;
  info: proto.ButtonComponent;
}

const Button: React.FunctionComponent<Props> = (props) => {
  const { sendMessage } = React.useContext(StageContext);
  const [touching, setTouching] = React.useState(false);
  const { state } = props.info;

  const click = () =>
    sendMessage?.({
      type: 'component_message',
      componentKey: props.info.key,
      component: 'button',
    });

  return (
    <div
      className={calculateClass(
        props.className,
        touching && TOUCHING_CLASS,
        state.state === 'error' && ERROR_CLASS
      )}
      onClick={click}
      onTouchStart={(event) => {
        play('touch');
        event.preventDefault();
        setTouching(true);
      }}
      onTouchEnd={(event) => {
        event.preventDefault();
        setTouching(false);
        click();
        play('beep2');
      }}
      title={state.state === 'error' ? state.error : undefined}
    >
      <div className={TOUCH_INDICATOR_CLASS} />
      {props.info.text}
    </div>
  );
};

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
