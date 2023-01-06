import * as React from 'react';
import {
  styled,
  buttonDisabled,
  rectIconButton,
  rectButtonSmall,
  textInput,
} from './styling';

import * as stageState from '../data/stage-state';
import { PlayState, PlayStateData } from '../data/play-state';
import { displayMillis } from '../display/timing';

import { PlayerBar } from './player-bar';
import { DropDownButton } from './util/drop-down-button';
import { DelayedPropigationInput } from './util/input';

import { MdPlayArrow, MdPause, MdSlowMotionVideo } from 'react-icons/md';

const NO_TIME_STRING = '---';
const CONTROL_HEIGHT_PX = 30;
const CONTROL_HEIGHT = CONTROL_HEIGHT_PX + 'px';

interface PlayerState {
  /**
   * If the user is currently scrubbing the track, this number will be set to
   * a value in the interval [0, 1] that represents where they are strubbing to.
   */
  scrubbingPosition: number | null;
  elapsedTimeText: string | null;
}

interface PlayerProps {
  // Properties
  className?: string;
  playState: PlayState;
  zoom: stageState.ZoomPanState;
  // Callbacks
  playerRef: (player: HTMLDivElement | null) => void;
}

class Player extends React.Component<PlayerProps, PlayerState> {
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  constructor(props: PlayerProps) {
    super(props);
    this.state = {
      scrubbingPosition: null,
      elapsedTimeText: null,
    };

    // Bind callbacks & event listeners
    this.playPauseClicked = this.playPauseClicked.bind(this);
    this.updateScrubbingPosition = this.updateScrubbingPosition.bind(this);
    this.setPlaySpeed = this.setPlaySpeed.bind(this);
    this.setPlaySpeed1 = this.setPlaySpeed1.bind(this);
    this.setPlaySpeedHalf = this.setPlaySpeedHalf.bind(this);
  }

  public componentWillReceiveProps(nextProps: PlayerProps) {
    // Only call updateFromPlayState if playState has changed
    if (this.props.playState !== nextProps.playState)
      this.updateFromPlayState(nextProps.playState);
  }

  private setPlaySpeed(value: string) {
    console.log('setPlaySpeed', value);
    const playSpeed = parseFloat(value);
    if (isNaN(playSpeed) || !this.props.playState) return;
    this.props.playState.controls.setPlaySpeed(playSpeed);
  }

  private setPlaySpeed1() {
    this.setPlaySpeed('1');
  }

  private setPlaySpeedHalf() {
    this.setPlaySpeed('0.5');
  }

  public render() {
    const state = this.props.playState;
    const playing = !!state && state.state.type === 'playing';
    const disabled = !state;
    const durationText =
      state && state.state.type === 'playing'
        ? displayMillis(state.durationMillis)
        : NO_TIME_STRING;
    const className = this.props.className + (disabled ? ' disabled' : '');
    const playSpeed =
      state && state.state.type === 'playing' ? state.state.playSpeed : 1;
    return (
      <div className={className} ref={(div) => this.props.playerRef(div)}>
        <span className="play-pause" onClick={this.playPauseClicked}>
          {playing ? <MdPause /> : <MdPlayArrow />}
        </span>
        <DropDownButton
          icon={MdSlowMotionVideo}
          buttonSizePx={CONTROL_HEIGHT_PX}
          title="Play speed"
          buttonText={playSpeed === 1 ? '' : playSpeed + 'x'}
          active={playSpeed !== 1}
          disabled={disabled}
        >
          <div className="speed-controls">
            <span>Play Speed:</span>
            <button onClick={this.setPlaySpeed1}>1x</button>
            <button onClick={this.setPlaySpeedHalf}>0.5x</button>
            <DelayedPropigationInput
              type="number"
              value={playSpeed.toString()}
              onChange={this.setPlaySpeed}
            />
          </div>
        </DropDownButton>
        <span className="elapsed-time">
          {this.state.elapsedTimeText
            ? this.state.elapsedTimeText
            : NO_TIME_STRING}
        </span>
        <PlayerBar
          playState={this.props.playState}
          scrubbingPosition={this.state.scrubbingPosition}
          zoom={this.props.zoom}
          updateScrubbingPosition={this.updateScrubbingPosition}
        ></PlayerBar>
        <span className="duration">{durationText}</span>
      </div>
    );
  }

  private playPauseClicked() {
    if (this.props.playState) this.props.playState.controls.toggle();
  }

  private updateFromPlayState(playState: PlayState) {
    if (this.updateInterval !== null) clearInterval(this.updateInterval);
    if (playState) {
      if (playState.state.type === 'paused') {
        this.updateElapsedText(playState, playState.state.positionMillis);
      } else {
        this.initUpdateInterval(playState);
      }
    } else {
      this.setState({ elapsedTimeText: null });
    }
  }

  private initUpdateInterval(playState: PlayStateData) {
    const updater = () => {
      if (playState.state.type !== 'playing') return;
      const effectiveStartTimeMillis = playState.state.effectiveStartTimeMillis;
      const playSpeed = playState.state.playSpeed;
      // Check if scrubbing
      const elapsed =
        this.state.scrubbingPosition !== null
          ? playState.durationMillis * this.state.scrubbingPosition
          : (performance.now() - effectiveStartTimeMillis) * playSpeed;
      this.updateElapsedText(playState, elapsed);
    };
    // Pick a nice interval that will show the milliseconds updating
    this.updateInterval = setInterval(updater, 16);
    updater();
  }

  /**
   * Update elapsed text, but if scrubbing display that time instead
   */
  private updateElapsedText(playState: PlayStateData, elapsed: number) {
    elapsed =
      this.state.scrubbingPosition !== null
        ? playState.durationMillis * this.state.scrubbingPosition
        : elapsed;
    this.setState({ elapsedTimeText: displayMillis(elapsed) });
  }

  private updateScrubbingPosition(position: number | null) {
    this.setState({
      scrubbingPosition: position,
    });
  }
}

const StyledPlayer = styled(Player)`
  background-color: ${(p) => p.theme.bgLight1};
  border-top: 1px solid ${(p) => p.theme.borderDark};
  z-index: 100;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: ${(p) => p.theme.spacingPx}px;

  > .play-pause {
    display: block;
    height: ${CONTROL_HEIGHT};
    width: ${CONTROL_HEIGHT};
    ${rectIconButton}
    margin-right: ${(p) => p.theme.spacingPx}px;
  }

  .speed-controls {
    display: flex;
    align-items: center;

    > * {
      margin: ${(p) => p.theme.spacingPx / 2}px;
    }

    > span {
      font-size: 12px;
      height: 12px;
      white-space: nowrap;
    }

    > input {
      width: 30px;
      ${textInput}
    }

    > button {
      outline: none;
      ${rectButtonSmall}
    }
  }

  > .elapsed-time,
  > .duration {
    display: inline-block;
    padding: 0 ${(p) => p.theme.spacingPx}px;
    width: 75px;
    font-size: 15px;
    text-align: center;
  }

  &.disabled {
    > .play-pause {
      opacity: 0.5;
      ${buttonDisabled}
    }

    > .elapsed-time,
    > .duration {
      opacity: 0.5;
    }
  }
`;

export { StyledPlayer as Player };
