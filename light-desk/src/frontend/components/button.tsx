import * as React from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';

import {
  rectButton,
  buttonStateNormalActive,
  touchIndicatorNormal,
  touchIndicatorTouching,
} from './styling';
import { calculateClass } from '../util/react';
import { StageContext } from './context';
import { Icon } from './icon';
import { usePressable } from '../util/touch';

const TOUCH_INDICATOR_CLASS = 'touch-indicator';
const TOUCHING_CLASS = 'touching';
const ERROR_CLASS = 'error';

interface Props {
  className?: string;
  info: proto.ButtonComponent;
}

const ButtonContents = styled.div`
  padding: 6px 4px;
  display: flex;
  justify-content: center;
  align-items: center;

  > * {
    padding: 0;
  }
`;

const ButtonLabel = styled.span`
  padding: 0 4px;
`;

const Button: React.FunctionComponent<Props> = (props) => {
  const { sendMessage } = React.useContext(StageContext);
  const { touching, handlers } = usePressable(() =>
    sendMessage?.({
      type: 'component_message',
      componentKey: props.info.key,
      component: 'button',
    })
  );
  const { state } = props.info;

  return (
    <div
      className={calculateClass(
        props.className,
        touching || state.state === 'pressed' ? TOUCHING_CLASS : null,
        state.state === 'error' && ERROR_CLASS
      )}
      {...handlers}
      title={state.state === 'error' ? state.error : undefined}
    >
      <div className={TOUCH_INDICATOR_CLASS} />
      <ButtonContents>
        {props.info.icon && <Icon icon={props.info.icon} />}
        {props.info.text && <ButtonLabel>{props.info.text}</ButtonLabel>}
      </ButtonContents>
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
