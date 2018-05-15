import * as React from 'react';
import {styled} from './styling';

import * as util from '../shared/util/util';

import * as func from '../data/functional';
import * as stageState from '../data/stage-state';
import {PlayState, PlayStateData, MediaPlaying} from '../data/play-state';

export interface PlayerBarState {
  /**
   * True iff the user is currently dragging the button
   */
  dragging: boolean;
  trackPosition: number;
}

export interface PlayerBarProps {
  // Properties
  className?: string;
  playState: PlayState;
  scrubbingPosition: func.Maybe<number>;
  zoom: stageState.ZoomState;
  // Callbacks
  updateScrubbingPosition: (position: func.Maybe<number>) => void;
}

class PlayerBar extends React.Component<PlayerBarProps, PlayerBarState> {

  private updateInterval: number;

  // Elements
  private barRef: HTMLDivElement | null = null;

  constructor(props: PlayerBarProps) {
    super(props);
    this.state = {
      dragging: false,
      trackPosition: 0
    };

    // Bind callbacks & event listeners
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  public componentDidMount() {
    this.updateFromPlayState(this.props.playState);
  }

  public componentWillReceiveProps(nextProps: PlayerBarProps) {
    // Only call updateFromPlayState if playState has changed
    if (this.props.playState !== nextProps.playState)
      this.updateFromPlayState(nextProps.playState);
  }

  public render() {
    const className =
      (this.props.className ? this.props.className : '') +
      (this.state.dragging ? ' dragging' : '') +
      (this.props.playState.isNone() ? ' disabled' : '');
    const fillWidth = (util.restrict(this.state.trackPosition, 0, 1) * 100) + '%';
    const buttonPosition = this.props.scrubbingPosition.caseOf({
      just: scrubbingPosition => scrubbingPosition,
      none: () => this.state.trackPosition
    });
    const buttonLeft = (util.restrict(buttonPosition, 0, 1) * 100) + '%';
    return (
      <div className={className}>
        <div className="zoom" style={{
          left: this.props.zoom.startPoint * 100 + '%',
          right: (1 - this.props.zoom.endPoint) * 100 + '%'
          }}>
        </div>
        <div className="bar" ref={bar => this.barRef = bar}>
          <div className="fill" style={{width: fillWidth}} />
        </div>
        <div className="button" style={{left: buttonLeft}} />
        <div className="hit"
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
          onMouseOut={this.onMouseUp}
        ></div>
      </div>
    );
  }

  private calculateBarPosition(e: React.MouseEvent<HTMLDivElement>) {
    if (!this.barRef) return 0;
    const $bar = $(this.barRef);
    const position = (e.pageX - $bar.offset().left) / $bar.width();
    return util.restrict(position, 0, 1);
  }

  private onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    // Only allow dragging if playing
    if (this.props.playState.isNone())
      return;
    e.preventDefault();
    this.setState({
      dragging: true
    });
    this.props.updateScrubbingPosition(func.just(this.calculateBarPosition(e)));
  }

  private onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!this.state.dragging)
      return;
    e.preventDefault();
    this.props.updateScrubbingPosition(func.just(this.calculateBarPosition(e)));
  }

  private onMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (!this.state.dragging)
      return;
    e.preventDefault();
    const position = this.calculateBarPosition(e);
    this.props.playState.fmap(state => {
      state.controls.goToTime(state.durationMillis * position);
    });
    this.setState({
      dragging: false
    });
    this.props.updateScrubbingPosition(func.none());
  }

  private updateFromPlayState(playState: PlayState) {
    cancelAnimationFrame(this.updateInterval);
    this.updateInterval = -1;
    playState.caseOf({
      just: state => {
        state.state.caseOf<void>({
          left: pausedState => this.updateBarPosition(pausedState.timeMillis / state.durationMillis),
          right: playingState => this.initUpdateInterval(state, playingState)
        });
      },
      none: () => {
        this.updateBarPosition(0);
      }
    });
  }

  private initUpdateInterval(playState: PlayStateData, playingState: MediaPlaying) {
    let nextFrame: number;
    const updater = () => {
      // HACK: For some reason cancelAnimationFrame() alone isn't working here...
      if (nextFrame !== this.updateInterval) return;
      const now = new Date().getTime();
      const elapsed = now - playingState.effectiveStartTimeMillis;
      this.updateBarPosition(elapsed / playState.durationMillis);
      nextFrame = this.updateInterval = requestAnimationFrame(updater);
    };
    nextFrame = this.updateInterval = requestAnimationFrame(updater);
  }

  private updateBarPosition(trackPosition: number) {
    this.setState({trackPosition});
  }

}

const buttonHeightPx = 16;
const buttonWidthPx = 6;
const buttonBorderPx = 1;
const barWidthPx = 2;
const barBorderPx = 1;

const StyledPlayerBar = styled(PlayerBar)`
  position: relative;
  flex-grow: 1;
  height: ${buttonHeightPx}px;
  margin: 0 ${buttonWidthPx / 2}px;
  cursor: pointer;

  .bar {
    position: absolute;
    left: 0;
    right: 0;
    top: ${(buttonHeightPx - barWidthPx - barBorderPx * 2) / 2}px;
    height: ${barWidthPx}px;
    background-color: ${p => p.theme.borderDark};
    border: 1px solid ${p => p.theme.borderDark};

    .fill {
      background-color: ${p => p.theme.borderLight};
      position: absolute;
      height: 100%;
      width: 50%;
    }
  }

  .button {
    box-sizing: border-box;
    position: absolute;
    top: 0;
    left: 0;
    margin-left: ${-buttonWidthPx / 2 - buttonBorderPx}px;
    width: ${buttonWidthPx}px;
    height: ${buttonHeightPx}px;
    border-radius: ${buttonHeightPx}px;
    border: ${buttonBorderPx}px solid ${p => p.theme.borderDark};
    background: ${p => p.theme.bg};
  }

  // Increase hit-area
  .hit {
    position: absolute;
    top: -5px;
    right: -15px;
    bottom: -5px;
    left: -15px;
  }

  .zoom {
    position: absolute;
    top: 0;
    bottom: 0;
    border-right: 1px solid ${p => p.theme.borderDark};
    border-left: 1px solid ${p => p.theme.borderDark};
    background: ${p => p.theme.bg};
  }

  &:hover {
    .bar {
      border-color: ${p => p.theme.hintDark1};

      .fill {
        background: ${p => p.theme.hintDark1};
      }
    }

    .button {
      border-color: ${p => p.theme.hintDark1};
    }
  }

  &.dragging {
    .bar {
      border-color: ${p => p.theme.hint};

      .fill {
        background: ${p => p.theme.hint};
      }
    }

    .button {
      border-color: ${p => p.theme.hint};
      background: ${p => p.theme.bg};
    }

    // Expand hit area to whole screen while dragging
    .hit {
      top: -100vh;
      right: -10vw;
      left: -10vw;
      bottom: -50px;
    }
  }

  &.disabled {
    cursor: default;

    .bar {
      background-color: ${p => p.theme.bg};
      border-color: ${p => p.theme.bg};

      .fill {
        background-color: ${p => p.theme.bg};
      }
    }

    .button {
      display: none;
    }

    .zoom {
      border-color: ${p => p.theme.bg};
    }
  }
`;

export {StyledPlayerBar as PlayerBar};
