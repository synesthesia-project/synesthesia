import * as jQuery from 'jquery';
import * as React from 'react';
import { styled } from './styling';

import * as util from '@synesthesia-project/core/lib/util';

import * as stageState from '../data/stage-state';
import { PlayState } from '../data/play-state';

export interface PlayerBarProps {
  // Properties
  className?: string;
  playState: PlayState;
  trackPosition: number;
  scrubbingPosition: number | null;
  zoom: stageState.ZoomPanState;
  // Callbacks
  updateScrubbingPosition: (position: number | null) => void;
}

const PlayerBar: React.FunctionComponent<PlayerBarProps> = ({
  className,
  playState,
  trackPosition,
  scrubbingPosition,
  zoom,
  updateScrubbingPosition,
}) => {
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const calculateBarPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return 0;
    const $bar = jQuery(barRef.current);
    const position = (e.pageX - $bar.offset().left) / $bar.width();
    return util.restrict(position, 0, 1);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging if playing
    if (!playState) return;
    e.preventDefault();
    setDragging(true);
    updateScrubbingPosition(calculateBarPosition(e));
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.preventDefault();
    updateScrubbingPosition(calculateBarPosition(e));
  };

  const onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.preventDefault();
    const position = calculateBarPosition(e);
    if (playState) {
      playState.controls.goToTime(playState.durationMillis * position);
    }
    setDragging(false);
    updateScrubbingPosition(null);
  };

  const finalClassName =
    (className ? className : '') +
    (dragging ? ' dragging' : '') +
    (playState ? '' : ' disabled');
  const fillWidth = util.restrict(trackPosition, 0, 1) * 100 + '%';
  const buttonPosition =
    scrubbingPosition !== null ? scrubbingPosition : trackPosition;
  const buttonLeft = util.restrict(buttonPosition, 0, 1) * 100 + '%';
  const viewport = stageState.getZoomPanViewport(zoom, trackPosition);

  return (
    <div className={finalClassName}>
      <div
        className="zoom"
        style={{
          left: viewport.startPoint * 100 + '%',
          right: (1 - viewport.endPoint) * 100 + '%',
        }}
      ></div>
      <div className="bar" ref={barRef}>
        <div className="fill" style={{ width: fillWidth }} />
      </div>
      <div className="button" style={{ left: buttonLeft }} />
      <div
        className="hit"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseOut={onMouseUp}
      ></div>
    </div>
  );
};

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

  > .bar {
    position: absolute;
    left: 0;
    right: 0;
    top: ${(buttonHeightPx - barWidthPx - barBorderPx * 2) / 2}px;
    height: ${barWidthPx}px;
    background-color: ${(p) => p.theme.borderDark};
    border: 1px solid ${(p) => p.theme.borderDark};

    > .fill {
      background-color: ${(p) => p.theme.borderLight};
      position: absolute;
      height: 100%;
      width: 50%;
    }
  }

  > .button {
    box-sizing: border-box;
    position: absolute;
    top: 0;
    left: 0;
    margin-left: ${-buttonWidthPx / 2 - buttonBorderPx}px;
    width: ${buttonWidthPx}px;
    height: ${buttonHeightPx}px;
    border-radius: ${buttonHeightPx}px;
    border: ${buttonBorderPx}px solid ${(p) => p.theme.borderDark};
    background: ${(p) => p.theme.bg};
  }

  // Increase hit-area
  > .hit {
    position: absolute;
    top: -5px;
    right: -15px;
    bottom: -5px;
    left: -15px;
  }

  > .zoom {
    position: absolute;
    top: 0;
    bottom: 0;
    border-right: 1px solid ${(p) => p.theme.borderDark};
    border-left: 1px solid ${(p) => p.theme.borderDark};
    background: ${(p) => p.theme.bg};
  }

  &:hover {
    .bar {
      border-color: ${(p) => p.theme.hintDark1};

      .fill {
        background: ${(p) => p.theme.hintDark1};
      }
    }

    .button {
      border-color: ${(p) => p.theme.hintDark1};
    }
  }

  &.dragging {
    > .bar {
      border-color: ${(p) => p.theme.hint};

      > .fill {
        background: ${(p) => p.theme.hint};
      }
    }

    > .button {
      border-color: ${(p) => p.theme.hint};
      background: ${(p) => p.theme.bg};
    }

    // Expand hit area to whole screen while dragging
    > .hit {
      top: -100vh;
      right: -10vw;
      left: -10vw;
      bottom: -50px;
    }
  }

  &.disabled {
    cursor: default;

    > .bar {
      background-color: ${(p) => p.theme.bg};
      border-color: ${(p) => p.theme.bg};

      > .fill {
        background-color: ${(p) => p.theme.bg};
      }
    }

    > .button {
      display: none;
    }

    > .zoom {
      border-color: ${(p) => p.theme.bg};
    }
  }
`;

export { StyledPlayerBar as PlayerBar };
