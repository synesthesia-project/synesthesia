import * as React from 'react';

import * as proto from '../../shared/proto';
import * as util from '../util/util';

import {KEYS} from '../util/keys';
import {styled, buttonStateNormal, buttonStateNormalHover} from './styling';

const CLASS_STATE_OPEN = 'open';
const CLASS_SLIDER_DISPLAY = 'slider-display';
const CLASS_SLIDER_BUTTON = 'slider-button';

const OPEN_SLIDER_WIDTH = 300;
const SLIDER_PADDING = 15;
const OPEN_SLIDER_INNER_WIDTH = OPEN_SLIDER_WIDTH - (SLIDER_PADDING * 2);

interface Props {
  className?: string;
  info: proto.SliderComponent;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}

interface State {
  openState: null | {startValue: number | null, startX: number, innerLeft: string};
  newValueDiff: null | number;
}

class Slider extends React.Component<Props, State> {

  public constructor(props: Props) {
    super(props);
    this.state = {
      openState: null,
      newValueDiff: null
    };

    this.onMouseDown = this.onMouseDown.bind(this);
  }

  private displayValue(value: number) {
    if (this.props.info.max === 1 && this.props.info.min === 0) {
      return `${Math.round(value * 100)}%`;
    }
    return value.toLocaleString();
  }

  private getNewValue(startValue: null | number, diff: number) {
    if (startValue === null) startValue = 0;
    return Math.max(this.props.info.min, Math.min(this.props.info.max, startValue + diff));
  }

  public render() {
    const value = (this.state.openState && this.state.newValueDiff !== null) ?
      this.getNewValue(this.state.openState.startValue, this.state.newValueDiff) :
      this.props.info.value;
    const valueDisplay = value !== null ? this.displayValue(value) : '';
    const valueCSSPercent = value ? ((value - this.props.info.min) / (this.props.info.max - this.props.info.min) * 100) + '%' : '0';
    const classes = [this.props.className];
    if (this.state.openState) classes.push(CLASS_STATE_OPEN);
    return (
      <div className={classes.join(' ')}>
        <div className="inner"
            onMouseDown={this.onMouseDown}
            style={this.state.openState ? {left: this.state.openState.innerLeft} : {}}
            >
          <div className={CLASS_SLIDER_DISPLAY}>
            <div className="inner" style={{width: valueCSSPercent}}/>
            <div className={CLASS_SLIDER_BUTTON} style={{left: valueCSSPercent}} />
          </div>
        </div>
      </div>
    );
  }

  private getRelativeCursorPosition(elem: Element, pageX: number) {
    const rect = elem.getBoundingClientRect();
    return pageX - rect.left;
  }

  private onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    const originalPageX = e.pageX;
    const cursorPosition = this.getRelativeCursorPosition(e.currentTarget, e.pageX);
    this.onDown(cursorPosition);
    util.trackMouseDown(
      p => this.onMove(p.pageX - originalPageX),
      p => this.onUp(p.pageX - originalPageX));
  }

  private onDown(cursorStartPosition: number) {
    const value = this.props.info.value === null ? 0 : this.props.info.value;
    /** Value between 0 - 1 representing where between min - max the value is */
    const amnt = (value - this.props.info.min) / (this.props.info.max - this.props.info.min);
    const innerLeft = (cursorStartPosition - amnt * OPEN_SLIDER_INNER_WIDTH - SLIDER_PADDING) + 'px';
    this.setState((_, props) => ({
      openState: {startValue: props.info.value, startX: cursorStartPosition, innerLeft},
      newValueDiff: 0
    }));
  }

  private onMove(relX: number) {
    const amntDiff = relX / OPEN_SLIDER_INNER_WIDTH;
    const newValueDiff = (this.props.info.max - this.props.info.min) * amntDiff;
    if (this.state.openState && this.props.sendMessage) {
      const value = this.getNewValue(this.state.openState.startValue, newValueDiff);
      this.props.sendMessage({
        type: 'component_message',
        componentKey: this.props.info.key,
        component: 'slider',
        value
      });
    }
    this.setState({newValueDiff});
  }

  private onUp(relX: number) {
    const amntDiff = relX / OPEN_SLIDER_INNER_WIDTH;
    const newValueDiff = (this.props.info.max - this.props.info.min) * amntDiff;
    if (this.state.openState && this.props.sendMessage) {
      const value = this.getNewValue(this.state.openState.startValue, newValueDiff);
      this.props.sendMessage({
        type: 'component_message',
        componentKey: this.props.info.key,
        component: 'slider',
        value
      });
    }
    this.setState({openState: null, newValueDiff: null});
    console.log('up', relX);
  }

}

const StyledSlider = styled(Slider)`
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
    border: 1px solid ${p => p.theme.borderDark};
    ${buttonStateNormal}

    > .${CLASS_SLIDER_DISPLAY} {
      position: absolute;
      height: 4px;
      left: ${SLIDER_PADDING}px;
      right: ${SLIDER_PADDING}px;
      top: ${(30 - 4 - 1) / 2}px;
      background: ${p => p.theme.bgDark1};
      border: 1px solid ${p => p.theme.borderDark};

      > .inner {
        height: 100%;
        background: ${p => p.theme.hint};
      }

      > .${CLASS_SLIDER_BUTTON} {
        position: absolute;
      }
    }

    &:hover {
      ${buttonStateNormalHover}
    }
  }

  &.${CLASS_STATE_OPEN} {
    z-index: 100;

    .inner {
      background: ${p => p.theme.bgDark1};
      width: ${OPEN_SLIDER_WIDTH}px;
    }
  }
`;

export {StyledSlider as Slider};
