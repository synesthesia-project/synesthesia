import {BaseComponent} from "./base";
import * as React from "react";
import * as file from "../data/file";
import * as selection from "../data/selection";
import * as types from "../util/types";
import * as stageState from "../data/stage-state";
import * as util from "../util/util";

export interface LayerVisualizationProps {
  layer: file.AnyLayer;
  positionMillis: number;
}

export class LayerVisualization extends BaseComponent<LayerVisualizationProps, {}> {

  /** The current layer that we have processed */
  private currentLayer: file.AnyLayer;

  /** The normalized layer event data */
  private processedLayerEvents: file.CueFileEvent<file.BasicEventStateValues>[];

  constructor() {
    super();
  }

  private processLayerIfNeeded() {
    if (this.currentLayer !== this.props.layer) {
      this.currentLayer = this.props.layer;
      this.processedLayerEvents = file.switchLayer(this.currentLayer, {
        percussion: this.processPercussionLayerEvents,
        tones: layer => []
      })
      console.debug("processed", this.currentLayer, this.processedLayerEvents);
    }
  }

  private processPercussionLayerEvents(layer: file.PercussionLayer):
      file.CueFileEvent<file.BasicEventStateValues>[] {
    const defaultPercussionStates: file.CueFileEventState<file.BasicEventStateValues>[] = [
      {millisDelta: 0, values: {amplitude: 1}},
      {millisDelta: layer.settings.defaultLengthMillis, values: {amplitude: 0}}
    ];
    return util.deepFreeze(
      layer.events
      .map(event => {
        return {
          timestampMillis: event.timestampMillis,
          states: event.states.length > 0 ? event.states : defaultPercussionStates
        };
      })
      .sort((a, b) => a.timestampMillis - b.timestampMillis)
    );
  }

  render() {
    this.processLayerIfNeeded();
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/layer-visualization.css"/>
        </div>
      </externals.ShadowDOM>
    );
  }

}
