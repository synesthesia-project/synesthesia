import * as React from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';
import * as util from '../util/util';
import { play } from '../util/audio';

import { buttonStateNormal, buttonStateNormalHover } from './styling';
import { StageContext } from './context';

const CLASS_STATE_OPEN = 'open';
const CLASS_SLIDER_DISPLAY = 'slider-display';
const CLASS_SLIDER_VALUE = 'slider-value';

const OPEN_SLIDER_WIDTH = 400;
const SLIDER_PADDING = 15;
const SLIDER_VALUE_WIDTH = 60;
const OPEN_SLIDER_INNER_WIDTH =
  OPEN_SLIDER_WIDTH - SLIDER_PADDING * 3 - SLIDER_VALUE_WIDTH;

interface Props {
  className?: string;
  info: proto.SliderButtonComponent;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}

type OpenState = {
  startValue: number | null;
  startX: number;
  innerLeft: string;
};

const getRelativeCursorPosition = (elem: Element, pageX: number) => {
  const rect = elem.getBoundingClientRect();
  return pageX - rect.left;
};

const SliderButton: React.FunctionComponent<Props> = (props) => {
  const [openState, setOpenState] = React.useState<null | OpenState>(null);
  const [valueDiff, setNewValueDiff] = React.useState<null | number>(null);

  const displayValue = (value: number) => {
    if (props.info.max === 1 && props.info.min === 0) {
      return `${Math.round(value * 100)}%`;
    }
    return value.toLocaleString();
  };

  const getNewValue = (startValue: null | number, diff: number) => {
    if (startValue === null) startValue = 0;
    return Math.max(
      props.info.min,
      Math.min(props.info.max, startValue + diff)
    );
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const originalPageX = e.pageX;
    const cursorPosition = getRelativeCursorPosition(e.currentTarget, e.pageX);
    const start = onDown(cursorPosition);
    util.trackMouseDown(
      (p) => onMove(start)(p.pageX - originalPageX),
      (p) => onUp(start)(p.pageX - originalPageX)
    );
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
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
        (p) => onMove(start)(p.pageX - originalPageX),
        (p) => {
          play('beep2');
          onUp(start)(p.pageX - originalPageX);
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
    const start: OpenState = {
      startValue: props.info.value,
      startX: cursorStartPosition,
      innerLeft,
    };
    setOpenState({
      startValue: props.info.value,
      startX: cursorStartPosition,
      innerLeft,
    });
    setNewValueDiff(0);
    return start;
  };

  const onMove = (start: OpenState) => (relX: number) => {
    const amntDiff = relX / OPEN_SLIDER_INNER_WIDTH;
    const newValueDiff = (props.info.max - props.info.min) * amntDiff;
    if (props.sendMessage) {
      const value = getNewValue(start.startValue, newValueDiff);
      props.sendMessage({
        type: 'component_message',
        componentKey: props.info.key,
        component: 'slider_button',
        value,
      });
    }
    setNewValueDiff(newValueDiff);
  };

  const onUp = (start: OpenState) => (relX: number) => {
    const amntDiff = relX / OPEN_SLIDER_INNER_WIDTH;
    const newValueDiff = (props.info.max - props.info.min) * amntDiff;
    if (props.sendMessage) {
      const value = getNewValue(start.startValue, newValueDiff);
      props.sendMessage({
        type: 'component_message',
        componentKey: props.info.key,
        component: 'slider_button',
        value,
      });
    }
    setOpenState(null);
    setNewValueDiff(null);
  };

  const value =
    openState && valueDiff !== null
      ? getNewValue(openState.startValue, valueDiff)
      : props.info.value;
  const valueDisplay = value !== null ? displayValue(value) : '';
  const valueCSSPercent = value
    ? ((value - props.info.min) / (props.info.max - props.info.min)) * 100 + '%'
    : '0';
  const classes = [props.className];
  if (openState) classes.push(CLASS_STATE_OPEN);
  return (
    <div className={classes.join(' ')}>
      <div
        className="inner"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={openState ? { left: openState.innerLeft } : {}}
      >
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
    left: 0;
    top: 0;
    bottom: 0;
    width: 100px;
    cursor: pointer;
    transition: all 200ms;
    border-radius: 3px;
    border: 1px solid ${(p) => p.theme.borderDark};
    ${buttonStateNormal}

    > .${CLASS_SLIDER_DISPLAY} {
      position: absolute;
      height: 4px;
      left: ${SLIDER_PADDING}px;
      right: ${SLIDER_PADDING}px;
      top: ${(30 - 4 - 1) / 2}px;
      background: ${(p) => p.theme.bgDark1};
      border: 1px solid ${(p) => p.theme.borderDark};
      transition: left 200ms;

      > .inner {
        height: 100%;
        background: ${(p) => p.theme.hint};
      }
    }

    > .${CLASS_SLIDER_VALUE} {
      position: absolute;
      left: right: ${SLIDER_PADDING}px;
      width: ${SLIDER_VALUE_WIDTH}px;
      line-height: 30px;
      text-align: center;
      opacity: 0;
      transition: opacity 200ms;
    }

    &:hover {
      ${buttonStateNormalHover}
    }
  }

  &.${CLASS_STATE_OPEN} {
    z-index: 100;

    .inner {
      background: ${(p) => p.theme.bgDark1};
      width: ${OPEN_SLIDER_WIDTH}px;

      > .${CLASS_SLIDER_DISPLAY} {
        left: ${SLIDER_PADDING * 2 + SLIDER_VALUE_WIDTH}px;
      }

      > .${CLASS_SLIDER_VALUE} {
        opacity: 1;
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
