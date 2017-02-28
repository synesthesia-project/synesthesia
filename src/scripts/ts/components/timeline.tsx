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
  positionMillis: number;
  // Callbacks
  updateCueFile: types.Mutator<file.CueFile>;
}

export class Timeline extends BaseComponent<TimelineProps, TimelineState> {

  constructor() {
    super();

    // Bind callbacks & event listeners
    this.addLayerClicked = this.addLayerClicked.bind(this);
  }

  render() {
    const zoomMargin = stageState.relativeZoomMargins(this.props.zoom);

    const playerPosition = this.props.positionMillis / this.props.file.lengthMillis;

    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/timeline.css"/>
          <div className="side left">
            <span className="add-button" onClick={this.addLayerClicked}/>
          </div>
          <div className="side right" />
          <div className="timeline">
            <div className="timeline-zoom" style={{
                left: (- zoomMargin.left * 100) + '%',
                right: (- zoomMargin.right * 100) + '%'
              }}>
              <div className="player-position" style={{left: playerPosition * 100 + '%'}}/>
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
