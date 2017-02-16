import {BaseComponent} from "./base";
import * as React from "react";

import * as file from "../data/file";

export interface TimelineState { }

export interface TimelineProps {
  cueFile: file.CueFile;
  updateCueFile: (file: file.CueFile) => void;
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
    this.props.updateCueFile(file.addLayer(this.props.cueFile));
  }

}
