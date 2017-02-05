import {BaseComponent} from "./base";
import * as React from "react";

export interface TimelineState { }

export interface TimelineProps { }

export class Timeline extends BaseComponent<TimelineProps, TimelineState> {

  constructor() {
    super();
  }

  render() {
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/timeline.css"/>
          <div className="side">
            <span className="add-button"/>
          </div>
        </div>
      </externals.ShadowDOM>
    );
  }

}
