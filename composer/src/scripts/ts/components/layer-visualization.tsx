import {styled} from './styling';
import * as React from 'react';
import * as file from '@synesthesia-project/core/lib/file';
import { getActiveEvents, getCurrentEventStateValue } from '@synesthesia-project/core/lib/file/file-usage';
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

class LayerVisualization extends React.Component<LayerVisualizationProps, Record<string, never>> {

  /** The current layer that we have processed */
  private currentLayer: file.AnyLayer | null = null;

  /** The normalized layer event data */
  private processedLayerEvents: file.CueFileEvent<VisualisedState>[] | null = null;

  constructor(props: LayerVisualizationProps) {
    super(props);
  }

  private processLayerIfNeeded() {
    if (this.currentLayer !== this.props.layer) {
      this.currentLayer = this.props.layer;
      this.processedLayerEvents = file.switchLayer(this.currentLayer, {
        percussion: this.processPercussionLayerEvents,
        tones: _layer => []
      });
      console.debug('processed', this.currentLayer, this.processedLayerEvents);
    }
  }

  private processPercussionLayerEvents(layer: file.PercussionLayer):
      file.CueFileEvent<VisualisedState>[] {
    const defaultPercussionStates: file.CueFileEventState<VisualisedState>[] = [
      {millisDelta: 0, values: {width: 1}},
      {millisDelta: layer.settings.defaultLengthMillis, values: {width: 0}}
    ];
    return util.deepFreeze(
      layer.events
      .map(event => {
        return {
          timestampMillis: event.timestampMillis,
          states: event.states.length > 0 ?
            event.states.map(s => ({
              millisDelta: s.millisDelta,
              values: {width: s.values.amplitude}
            })) :
            defaultPercussionStates
        };
      })
      .sort((a, b) => a.timestampMillis - b.timestampMillis)
    );
  }

  /**
   * Return the events that are active for the current timestamp
   */
  private getCurrentEvents(): file.CueFileEvent<VisualisedState>[] {
    if (!this.processedLayerEvents) return [];
    return getActiveEvents(this.processedLayerEvents, this.props.positionMillis);
  }

  private getCurrentState(event: file.CueFileEvent<VisualisedState>): VisualisedState {
    return {
      width: getCurrentEventStateValue(event, this.props.positionMillis, s => s.width)
    };
  }

  public render() {
    this.processLayerIfNeeded();
    const states = this.getCurrentEvents().map(e => this.getCurrentState(e));
    const width = states.length === 0 ? 0 : Math.max.apply(null, states.map(s => s.width));
    return (
      <div className={this.props.className}>
        <div className="box" style={{width: (width * 100) + '%'}} />
      </div>
    );
  }

}

const StyledLayerVisualization = styled(LayerVisualization)`
  width: ${p => p.theme.visualizationWidthPx}px;
  box-sizing: border-box;
  background: ${p => p.theme.layerSideBg};
  display: block;
  position: absolute;
  height: 100%;
  top: 0;
  right: 0;
  border-left: 1px solid ${p => p.theme.borderLight};

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

export {StyledLayerVisualization as LayerVisualization};
