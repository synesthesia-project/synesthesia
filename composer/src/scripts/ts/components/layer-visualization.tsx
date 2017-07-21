import {BaseComponent} from './base';
import * as React from 'react';
import * as file from '../shared/file/file';
import {getActiveEvents, getCurrentEventStateValue} from '../shared/file/file-usage';
import * as util from '../shared/util/util';

export interface LayerVisualizationProps {
  layer: file.AnyLayer;
  positionMillis: number;
}

/**
 * Conversion of the underlying file state to a collection of states that can be visualized
 */
export interface VisualisedState {
  width: number;
}

export class LayerVisualization extends BaseComponent<LayerVisualizationProps, {}> {

  /** The current layer that we have processed */
  private currentLayer: file.AnyLayer;

  /** The normalized layer event data */
  private processedLayerEvents: file.CueFileEvent<VisualisedState>[];

  constructor() {
    super();
  }

  private processLayerIfNeeded() {
    if (this.currentLayer !== this.props.layer) {
      this.currentLayer = this.props.layer;
      this.processedLayerEvents = file.switchLayer(this.currentLayer, {
        percussion: this.processPercussionLayerEvents,
        tones: layer => []
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
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="styles/components/layer-visualization.css"/>
          <div className="box" style={{width: (width * 100) + '%'}} />
        </div>
      </externals.ShadowDOM>
    );
  }

}
