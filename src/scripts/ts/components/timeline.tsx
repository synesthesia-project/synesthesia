import {BaseComponent} from "./base";
import * as React from "react";

import * as func from "../data/functional";
import * as playState from "../data/play-state";
import * as stageState from "../data/stage-state";
import * as file from "../data/file";
import * as types from "../util/types";

export interface TimelineState {
}

export interface TimelineProps {
  // Properties
  file: file.CueFile;
  playState: playState.PlayState;
  zoom: stageState.ZoomState;
  // Callbacks
  updateCueFile: types.Mutator<file.CueFile>;
}

export class Timeline extends BaseComponent<TimelineProps, TimelineState> {

  private updateInterval: any;

  constructor() {
    super();

    // Bind callbacks & event listeners
    this.addLayerClicked = this.addLayerClicked.bind(this);
  }

  componentDidUpdate() {
    clearInterval(this.updateInterval);
    // Start a re-rendering interval if currently playing
    this.props.playState.fmap(state => state.state.caseOf<void>({
      left: pausedState => {},
      right: playingState => this.updateInterval = setInterval(() => this.forceUpdate(), 20)
    }));
  }

  render() {
    const zoomMargin = stageState.relativeZoomMargins(this.props.zoom);

    const playerPosition = this.props.playState
      // Extract current time
      .fmap(state => state.state.caseOf({
        left: pausedState => pausedState.timeMillis,
        right: playingState => new Date().getTime() - playingState.effectiveStartTimeMillis
      }))
      // Divide by total file time
      .fmap(time => time / this.props.file.lengthMillis);

    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/timeline.css"/>
          <div className="side">
            <span className="add-button" onClick={this.addLayerClicked}/>
          </div>
          <div className="timeline">
            <div className="timeline-zoom" style={{
                left: (- zoomMargin.left * 100) + '%',
                right: (- zoomMargin.right * 100) + '%'
              }}>
              {playerPosition.caseOf({
                just: pos => <div className="player-position" style={{left: pos * 100 + '%'}}/>,
                none: () => null
              })}
            </div>
          </div>
        </div>
      </externals.ShadowDOM>
    );
  }

  private addLayerClicked() {
    this.props.updateCueFile(cueFile => file.addLayer(cueFile));
  }

}
