import * as React from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';
import * as util from '../util/util';
import { play } from '../util/audio';

import {
  buttonPressed,
  buttonStateNormal,
  buttonStateNormalHover,
} from './styling';
import { StageContext } from './context';

const CLASS_SLIDER_DISPLAY = 'slider-display';
const CLASS_SLIDER_VALUE = 'slider-value';

const OPEN_SLIDER_WIDTH = 400;
const SLIDER_PADDING = 15;
const SLIDER_VALUE_WIDTH = 60;
const OPEN_SLIDER_INNER_WIDTH =
  OPEN_SLIDER_WIDTH - SLIDER_PADDING * 4 - SLIDER_VALUE_WIDTH * 2;

const KEYS = {
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  Enter: 'Enter',
  Escape: 'Escape',
};

interface Props {
  className?: string;
  info: proto.SliderButtonComponent;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}

type TouchingState = {
  state: 'touching';
  startValue: number | null;
  startX: number;
  innerLeft: string;
  diff: number;
};

type State =
  | {
      state: 'closed' | 'focused' | 'mouse-down';
    }
  | TouchingState;

const NUMBER_FORMATTER = new Intl.NumberFormat(undefined, {
  // A large enough value for most usecases,
  // but to avoid inaccuracies from floating-point maths
  maximumFractionDigits: 10,
});

const getRelativeCursorPosition = (elem: Element, pageX: number) => {
  const rect = elem.getBoundingClientRect();
  return pageX - rect.left;
};

const SliderButton: React.FunctionComponent<Props> = (props) => {
  const [state, setState] = React.useState<State>({ state: 'closed' });
  const input = React.useRef<HTMLInputElement | null>(null);

  const displayValue = (value: number) => {
    if (props.info.max === 1 && props.info.min === 0) {
      return `${Math.round(value * 100)}%`;
    }
    return NUMBER_FORMATTER.format(value);
  };

  const sendValue = (value: number) =>
    props.sendMessage?.({
      type: 'component_message',
      componentKey: props.info.key,
      component: 'slider_button',
      value: value,
    });

  const getNewValue = (startValue: null | number, diff: number) => {
    return sanitizeValue((startValue || 0) + diff);
  };

  const sanitizeValue = (value: number) => {
    const i = Math.round((value - props.info.min) / props.info.step);
    const v = i * props.info.step + props.info.min;
    return Math.max(props.info.min, Math.min(props.info.max, v));
  };

  const getCurrentInputValue = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const float = parseFloat(e.currentTarget.value);
    return sanitizeValue(isNaN(float) ? props.info.value || 0 : float);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === KEYS.ArrowDown || e.key === KEYS.ArrowUp) {
      const currentValue = getCurrentInputValue(e);
      const diff = e.key === KEYS.ArrowUp ? props.info.step : -props.info.step;
      const newValue = sanitizeValue(currentValue + diff);
      e.currentTarget.value = NUMBER_FORMATTER.format(newValue);
      sendValue(newValue);
    } else if (e.key === KEYS.Enter) {
      const sanitizedValue = getCurrentInputValue(e);
      sendValue(sanitizedValue);
      e.currentTarget.value = NUMBER_FORMATTER.format(sanitizedValue);
    } else if (e.key === KEYS.Escape) {
      input.current?.blur();
    }
  };

  const onFocus = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setState({ state: 'focused' });
    e.currentTarget.value = `${props.info.value || 0}`;
  };

  const onBlur = () => {
    setState({ state: 'closed' });
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    play('touch');
    for (const touch of Array.from(e.changedTouches)) {
      const originalPageX = touch.pageX;
      const cursorPosition = getRelativeCursorPosition(
        e.currentTarget,
        touch.pageX
      );
      const start = onDown(cursorPosition);
      util.trackTouch(
        touch,
        (p) => {
          const amntDiff = (p.pageX - originalPageX) / OPEN_SLIDER_INNER_WIDTH;
          const newValueDiff = (props.info.max - props.info.min) * amntDiff;
          sendValue(getNewValue(start.startValue, newValueDiff));
          setState({ ...start, diff: newValueDiff });
        },
        (p) => {
          play('beep2');
          const amntDiff = (p.pageX - originalPageX) / OPEN_SLIDER_INNER_WIDTH;
          const newValueDiff = (props.info.max - props.info.min) * amntDiff;
          sendValue(getNewValue(start.startValue, newValueDiff));
          setState({ state: 'closed' });
        }
      );
      return;
    }
  };

  const onDown = (cursorStartPosition: number) => {
    const value = props.info.value === null ? 0 : props.info.value;
    /** Value between 0 - 1 representing where between min - max the value is */
    const amnt = (value - props.info.min) / (props.info.max - props.info.min);
    const innerLeft =
      cursorStartPosition -
      amnt * OPEN_SLIDER_INNER_WIDTH -
      SLIDER_PADDING * 2 -
      SLIDER_VALUE_WIDTH +
      'px';
    const start: TouchingState = {
      state: 'touching',
      startValue: props.info.value,
      startX: cursorStartPosition,
      innerLeft,
      diff: 0,
    };
    setState(start);
    return start;
  };

  const value =
    state.state === 'touching'
      ? getNewValue(state.startValue, state.diff)
      : props.info.value;
  const valueDisplay = value !== null ? displayValue(value) : '';
  const valueCSSPercent = value
    ? ((value - props.info.min) / (props.info.max - props.info.min)) * 100 + '%'
    : '0';
  return (
    <div className={[props.className, `state-${state.state}`].join(' ')}>
      <div
        className="inner"
        onMouseDown={() => setState({ state: 'mouse-down' })}
        onMouseUp={() => input.current?.focus()}
        onTouchStart={onTouchStart}
        style={state.state === 'touching' ? { left: state.innerLeft } : {}}
      >
        <input
          type="text"
          ref={input}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        <div className={CLASS_SLIDER_VALUE}>{valueDisplay}</div>
        <div className={CLASS_SLIDER_DISPLAY}>
          <div className="inner" style={{ width: valueCSSPercent }} />
        </div>
        <div className={CLASS_SLIDER_VALUE}>{valueDisplay}</div>
      </div>
    </div>
  );
};

const StyledSliderButton = styled(SliderButton)`
  position: relative;
  width: 100px;
  height: 30px;

  > .inner {
    position: absolute;
    display: flex;
    align-items: center;
    padding: 0 ${SLIDER_PADDING / 2}px;
    left: 0;
    top: 0;
    bottom: 0;
    width: 100px;
    cursor: pointer;
    transition: all 200ms;
    border-radius: 3px;
    border: 1px solid ${(p) => p.theme.borderDark};
    ${buttonStateNormal}

    > input {
      color: ${(p) => p.theme.textNormal};
      opacity: 0;
      margin: 0 -9px;
      padding: 6px 8px;
      width: 0;
      pointer-events: none;
      transition: all 200ms;
      border-radius: 3px;
      background: ${(p) => p.theme.bgDark1};
      border: 1px solid ${(p) => p.theme.borderDark};
      overflow: hidden;
      box-shadow: inset 0px 0px 8px 0px rgba(0, 0, 0, 0.3);
    }

    > .${CLASS_SLIDER_DISPLAY} {
      flex-grow: 1;
      margin: 0 ${SLIDER_PADDING / 2}px;
      height: 4px;
      background: ${(p) => p.theme.bgDark1};
      border: 1px solid ${(p) => p.theme.borderDark};

      > .inner {
        height: 100%;
        background: ${(p) => p.theme.hint};
      }
    }

    > .${CLASS_SLIDER_VALUE} {
      width: ${SLIDER_VALUE_WIDTH}px;
      margin: 0 -${SLIDER_VALUE_WIDTH / 2}px;
      line-height: 30px;
      text-align: center;
      opacity: 0;
    }

    &:hover {
      ${buttonStateNormalHover}
    }
  }

  &.state-mouse-down {
    > .inner {
      ${buttonPressed}
    }
  }

  &.state-focused {
    > .inner {
      > input {
        opacity: 1;
        width: 60%;
        padding: 0 5px;
        margin: 0;
      }
    }
  }

  &.state-touching {
    z-index: 100;

    .inner {
      background: ${(p) => p.theme.bgDark1};
      width: ${OPEN_SLIDER_WIDTH}px;

      > .${CLASS_SLIDER_VALUE} {
        opacity: 1;
        margin: 0 ${SLIDER_PADDING / 2}px;
      }
    }
  }
`;

const SliderButtonWrapper: React.FunctionComponent<
  Omit<Props, 'sendMessage'>
> = (props) => (
  <StageContext.Consumer>
    {({ sendMessage }) => (
      <StyledSliderButton {...props} sendMessage={sendMessage} />
    )}
  </StageContext.Consumer>
);

export { SliderButtonWrapper as SliderButton };
