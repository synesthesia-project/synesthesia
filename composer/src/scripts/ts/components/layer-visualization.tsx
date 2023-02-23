import { styled } from './styling';
import * as React from 'react';
import * as file from '@synesthesia-project/core/lib/file';
import {
  getActiveEvents,
  getCurrentEventStateValue,
} from '@synesthesia-project/core/lib/file/file-usage';
import * as util from '@synesthesia-project/core/lib/util';

export interface LayerVisualizationProps {
  className?: string;
  layer: file.AnyLayer;
  positionMillis: number;
}

/**
 * Conversion of the underlying file state to a collection of states that can be visualized
 */
export interface VisualisedState {
  width: number;
}

const processPercussionLayerEvents = (
  layer: file.PercussionLayer
): file.CueFileEvent<VisualisedState>[] => {
  const defaultPercussionStates: file.CueFileEventState<VisualisedState>[] = [
    { millisDelta: 0, values: { width: 1 } },
    { millisDelta: layer.settings.defaultLengthMillis, values: { width: 0 } },
  ];
  return util.deepFreeze(
    layer.events
      .map((event) => {
        return {
          timestampMillis: event.timestampMillis,
          states:
            event.states.length > 0
              ? event.states.map((s) => ({
                  millisDelta: s.millisDelta,
                  values: { width: s.values.amplitude },
                }))
              : defaultPercussionStates,
        };
      })
      .sort((a, b) => a.timestampMillis - b.timestampMillis)
  );
};

const LayerVisualization: React.FunctionComponent<LayerVisualizationProps> = ({
  className,
  layer,
  positionMillis,
}) => {
  const [processedLayerEvents, setProcessedLayerEvents] = React.useState<Array<
    file.CueFileEvent<VisualisedState>
  > | null>(null);

  React.useEffect(() => {
    setProcessedLayerEvents(
      file.switchLayer(layer, {
        percussion: processPercussionLayerEvents,
        tones: (_layer) => [],
      })
    );
  }, [layer]);

  /**
   * Return the events that are active for the current timestamp
   */
  const getCurrentEvents = (): file.CueFileEvent<VisualisedState>[] => {
    if (!processedLayerEvents) return [];
    return getActiveEvents(processedLayerEvents, positionMillis);
  };

  const getCurrentState = (
    event: file.CueFileEvent<VisualisedState>
  ): VisualisedState => {
    return {
      width: getCurrentEventStateValue(event, positionMillis, (s) => s.width),
    };
  };

  const states = getCurrentEvents().map((e) => getCurrentState(e));
  const width =
    states.length === 0
      ? 0
      : Math.max.apply(
          null,
          states.map((s) => s.width)
        );
  return (
    <div className={className}>
      <div className="box" style={{ width: width * 100 + '%' }} />
    </div>
  );
};

const StyledLayerVisualization = styled(LayerVisualization)`
  width: ${(p) => p.theme.visualizationWidthPx}px;
  box-sizing: border-box;
  background: ${(p) => p.theme.layerSideBg};
  display: block;
  position: absolute;
  height: 100%;
  top: 0;
  right: 0;
  border-left: 1px solid ${(p) => p.theme.borderLight};

  .box {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: #fff;
    width: 0;
  }
`;

export { StyledLayerVisualization as LayerVisualization };
