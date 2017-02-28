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

/**
 * Conversion of the underlying file state to a collection of states that can be visualized
 */
export interface VisualisedState {
  brightness: number;
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
      })
      console.debug("processed", this.currentLayer, this.processedLayerEvents);
    }
  }

  private processPercussionLayerEvents(layer: file.PercussionLayer):
      file.CueFileEvent<VisualisedState>[] {
    const defaultPercussionStates: file.CueFileEventState<VisualisedState>[] = [
      {millisDelta: 0, values: {brightness: 1}},
      {millisDelta: layer.settings.defaultLengthMillis, values: {brightness: 0}}
    ];
    return util.deepFreeze(
      layer.events
      .map(event => {
        return {
          timestampMillis: event.timestampMillis,
          states: event.states.length > 0 ?
            event.states.map(s => ({
              millisDelta: s.millisDelta,
              values: {brightness: s.values.amplitude}
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
    const active: file.CueFileEvent<VisualisedState>[] = [];
    for (let i = 0; i < this.processedLayerEvents.length; i++) {
      const event = this.processedLayerEvents[i];
      if (event.timestampMillis > this.props.positionMillis)
        break;
      const lastTimestamp = event.timestampMillis + event.states[event.states.length - 1].millisDelta;
      if (lastTimestamp > this.props.positionMillis)
        active.push(event);
    }
    return active;
  }

  /**
   * TODO: Change this to a sample period rather than the current point in time
   */
  private getCurrentState(event: file.CueFileEvent<VisualisedState>): VisualisedState {
    // Find the segment we are currently in
    for (let j = 1; j < event.states.length; j++) {
      const s1 = event.states[j - 1];
      const s2 = event.states[j];
      const time = this.props.positionMillis;
      const s1time = event.timestampMillis + s1.millisDelta;
      if (s1time > time)
        continue;
      const s2time = event.timestampMillis + s2.millisDelta;
      if (s2time < time)
        break;
      // Position within this segment
      const position = (time - s1time) / (s2time - s1time);
      const brightness = s1.values.brightness * (1 - position) + s2.values.brightness * position;
      return {
        brightness
      };
    }
    throw new Error("getCurrentState() called for inactive event");
  }

  render() {
    this.processLayerIfNeeded();
    const states = this.getCurrentEvents().map(e => this.getCurrentState(e));
    const brightness = states.length == 0 ? 0 : Math.max.apply(null, states.map(s => s.brightness));
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/layer-visualization.css"/>
          <div className="box" style={{opacity: brightness}} />
        </div>
      </externals.ShadowDOM>
    );
  }

}
