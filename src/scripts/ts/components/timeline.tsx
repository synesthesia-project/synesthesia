import {BaseComponent} from "./base";
import * as React from "react";

import * as func from "../data/functional";
import * as playState from "../data/play-state";
import * as stageState from "../data/stage-state";
import * as file from "../data/file";
import * as types from "../util/types";

export interface TimelineState { }

export interface TimelineProps {
  // Properties
  file: file.CueFile;
  playState: playState.PlayState;
  zoom: stageState.ZoomState;
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
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/timeline.css"/>
          <div className="side">
            <span className="add-button" onClick={this.addLayerClicked}/>
          </div>
        </div>
      </externals.ShadowDOM>
    );
  }

  private addLayerClicked() {
    this.props.updateCueFile(cueFile => file.addLayer(cueFile));
  }

}
