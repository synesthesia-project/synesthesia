import * as React from 'react';
import {
  styled,
  buttonDisabled,
  rectIconButton,
  rectButtonSmall,
  textInput,
} from './styling';

import * as stageState from '../data/stage-state';
import { PlayState } from '../data/play-state';
import { displayMillis } from '../display/timing';

import { PlayerBar } from './player-bar';
import { DropDownButton } from './util/drop-down-button';
import { DelayedPropigationInput } from './util/input';

import { MdPlayArrow, MdPause, MdSlowMotionVideo } from 'react-icons/md';
import { useDebouncedState } from './util/debounce';
import { PlayStateData } from '../../../../dist/integration/shared';

const NO_TIME_STRING = '---';
const CONTROL_HEIGHT_PX = 30;
const CONTROL_HEIGHT = CONTROL_HEIGHT_PX + 'px';

interface PlayerProps {
  // Properties
  className?: string;
  playState: PlayState;
  zoom: stageState.ZoomPanState;
  // Callbacks
  playerRef: (player: HTMLDivElement | null) => void;
}

const Player: React.FunctionComponent<PlayerProps> = ({
  className,
  playState,
  zoom,
  playerRef,
}) => {
  const [
    /**
     * If the user is currently scrubbing the track, this number will be set to
     * a value in the interval [0, 1] that represents where they are strubbing to.
     */
    scrubbingPosition,
    setScrubbingPosition,
  ] = useDebouncedState<number | null>(null);

  const animationFrame = React.useRef(-1);
  const [trackPosition, setTrackPosition] = React.useState(0);

  const initUpdateInterval = (playState: PlayStateData) => {
    let nextFrame: number;
    const updater = () => {
      if (playState.state.type !== 'playing') return;
      // HACK: For some reason cancelAnimationFrame() alone isn't working here...
      if (nextFrame !== animationFrame.current) return;
      const now = performance.now();
      const elapsed =
        (now - playState.state.effectiveStartTimeMillis) *
        playState.state.playSpeed;
      setTrackPosition(elapsed / playState.durationMillis);
      nextFrame = animationFrame.current = requestAnimationFrame(updater);
    };
    nextFrame = animationFrame.current = requestAnimationFrame(updater);
  };

  React.useEffect(() => {
    cancelAnimationFrame(animationFrame.current);
    if (playState) {
      if (playState.state.type === 'paused') {
        setTrackPosition(
          playState.state.positionMillis / playState.durationMillis
        );
      } else {
        initUpdateInterval(playState);
      }
    } else {
      setTrackPosition(0);
    }
  }, [playState]);

  const elapsedTimeText = playState
    ? displayMillis(
        scrubbingPosition !== null
          ? playState.durationMillis * scrubbingPosition
          : playState.state.type === 'playing'
          ? (performance.now() - playState.state.effectiveStartTimeMillis) *
            playState.state.playSpeed
          : playState.state.positionMillis
      )
    : null;

  const setPlaySpeed = (value: string) => {
    console.log('setPlaySpeed', value);
    const playSpeed = parseFloat(value);
    if (isNaN(playSpeed) || !playState) return;
    playState.controls.setPlaySpeed(playSpeed);
  };

  const setPlaySpeed1 = () => {
    setPlaySpeed('1');
  };

  const setPlaySpeedHalf = () => {
    setPlaySpeed('0.5');
  };

  const playing = playState?.state.type === 'playing';
  const disabled = !playState;
  const durationText =
    playState?.state.type === 'playing'
      ? displayMillis(playState.durationMillis)
      : NO_TIME_STRING;
  const playSpeed =
    playState?.state.type === 'playing' ? playState.state.playSpeed : 1;
  return (
    <div className={className + (disabled ? ' disabled' : '')} ref={playerRef}>
      <span className="play-pause" onClick={playState?.controls.toggle}>
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
          <button onClick={setPlaySpeed1}>1x</button>
          <button onClick={setPlaySpeedHalf}>0.5x</button>
          <DelayedPropigationInput
            type="number"
            value={playSpeed.toString()}
            onChange={setPlaySpeed}
          />
        </div>
      </DropDownButton>
      <span className="elapsed-time">{elapsedTimeText || NO_TIME_STRING}</span>
      <PlayerBar
        playState={playState}
        trackPosition={trackPosition}
        scrubbingPosition={scrubbingPosition}
        zoom={zoom}
        updateScrubbingPosition={setScrubbingPosition}
      ></PlayerBar>
      <span className="duration">{durationText}</span>
    </div>
  );
};

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
