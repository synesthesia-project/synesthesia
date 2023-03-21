import { styled } from './styling';
import { Layer } from './layer';
import { Timeline } from './timeline';
import * as React from 'react';
import * as file from '@synesthesia-project/core/lib/file';
import * as selection from '../data/selection';
import * as util from '@synesthesia-project/core/lib/util';
import * as stageState from '../data/stage-state';
import { PlayState, PlayStateData } from '../data/play-state';

export interface LayersAndTimelineProps {
  // Properties
  className?: string;
  selection: selection.Selection;
  file: file.CueFile | null;
  state: stageState.StageState;
  playState: PlayState;
  bindingLayer: number | null;
  midiLayerBindings: { input: string; note: number; layer: number }[];
  // Callbacks
  timelineRef: (ref: HTMLDivElement | null) => void;
  layersRef: (ref: HTMLDivElement | null) => void;
  updateCueFile: util.Mutator<file.CueFile>;
  updateSelection: util.Mutator<selection.Selection>;
  requestBindingForLayer: (layerKey: number | null) => void;
  openLayerOptions: (layerKey: number) => void;
  toggleZoomPanLock: () => void;
}

const LayersAndTimeline: React.FunctionComponent<LayersAndTimelineProps> = ({
  className,
  selection,
  file,
  state,
  playState,
  bindingLayer,
  midiLayerBindings,
  timelineRef,
  layersRef,
  updateCueFile,
  updateSelection,
  requestBindingForLayer,
  openLayerOptions,
  toggleZoomPanLock,
}) => {
  const nextUpdate = React.useRef<{
    animationFrame: number;
    playState: PlayState;
  }>({
    animationFrame: -1,
    playState,
  });
  /**
   * Current position in milliseconds, updated every so often based on frame-rate
   */
  const [positionMillis, setPositionMillis] = React.useState<number>(0);
  // TODO: set up some kind of debouncer for this to take it at framerate
  const [mousePosition, setMousePosition] = React.useState<number | null>(null);
  /**
   * If the user is currently dragging the selected elements, then
   * this is the difference in milliseconds
   */
  const [selectionDraggingDiff, setSelectionDraggingDiff] = React.useState<
    number | null
  >(null);

  const updatePosition = (playState: PlayStateData) => {
    const time =
      playState.state.type === 'paused'
        ? playState.state.positionMillis
        : (performance.now() - playState.state.effectiveStartTimeMillis) *
          playState.state.playSpeed;
    // Update positionMillis with time if different enough
    setPositionMillis((current) =>
      time < current - 10 || time > current + 10 ? time : current
    );
  };

  React.useEffect(() => {
    const update = () => {
      if (nextUpdate.current.playState) {
        updatePosition(nextUpdate.current.playState);
      }
      nextUpdate.current.animationFrame = requestAnimationFrame(update);
    };
    nextUpdate.current.animationFrame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(nextUpdate.current.animationFrame);
    };
  }, []);

  React.useEffect(() => {
    nextUpdate.current.playState = playState;
    if (playState) {
      updatePosition(playState);
    }
  }, [playState]);

  const layers = file
    ? file.layers.map((layer, i) => (
        <Layer
          {...{
            key: i,
            file,
            layer,
            layerKey: i,
            zoom: state.zoomPan,
            selection,
            positionMillis,
            bindingLayer,
            midiLayerBindings,
            selectionDraggingDiff,
            updateSelection,
            updateCueFile,
            requestBindingForLayer,
            updateSelectionDraggingDiff: setSelectionDraggingDiff,
            openLayerOptions,
          }}
        />
      ))
    : null;

  const playerPosition = file ? positionMillis / file.lengthMillis : null;

  const zoomMargin = stageState.relativeZoomMargins(
    state.zoomPan,
    playerPosition || 0
  );

  return (
    <div className={className}>
      <div className="layers" ref={layersRef}>
        {layers}
        <div className="overlay">
          <div
            className="zoom"
            style={{
              left: -zoomMargin.left * 100 + '%',
              right: -zoomMargin.right * 100 + '%',
            }}
          >
            {playerPosition !== null && (
              <div
                className="marker player-position"
                style={{ left: playerPosition * 100 + '%' }}
              />
            )}
            {mousePosition !== null && (
              <div
                className="marker mouse"
                style={{ left: mousePosition * 100 + '%' }}
              />
            )}
          </div>
        </div>
      </div>
      {file && (
        <Timeline
          {...{
            timelineRef,
            updateCueFile,
            file,
            zoom: state.zoomPan,
            positionMillis,
            playState,
            updateMouseHover: setMousePosition,
            mousePosition,
            toggleZoomPanLock,
          }}
        />
      )}
    </div>
  );
};

const StyledLayersAndTimeline = styled(LayersAndTimeline)`
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  > .layers {
    flex-grow: 1;
    position: relative;
    overflow-y: hidden;

    &::before,
    &::after {
      box-sizing: border-box;
      content: '';
      display: block;
      background: ${(p) => p.theme.layerSideBg};
      position: absolute;
      height: 100%;
      top: 0;
      z-index: -100;
      opacity: 0.6;
      box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.3);
    }

    &::before {
      width: ${(p) => p.theme.layerSideColumnWidthPx}px;
      left: 0;
      border-right: 1px solid ${(p) => p.theme.borderLight};
    }

    &::after {
      width: ${(p) => p.theme.visualizationWidthPx}px;
      right: 0;
      border-left: 1px solid ${(p) => p.theme.borderLight};
    }

    > .overlay {
      position: absolute;
      pointer-events: none;
      top: 0;
      bottom: 0;
      left: ${(p) => p.theme.layerSideColumnWidthPx}px;
      right: ${(p) => p.theme.visualizationWidthPx}px;
      overflow: hidden;

      > .zoom {
        position: absolute;
        top: 0;
        bottom: 0;
        right: 50%;
        left: -50%;

        > .marker {
          position: absolute;
          height: 100%;
          width: 1px;

          &.player-position {
            background: rgba(255, 255, 255, 0.2);
          }

          &.mouse {
            background: rgba(255, 255, 255, 0.4);
          }
        }
      }
    }
  }
`;

export { StyledLayersAndTimeline as LayersAndTimeline };
