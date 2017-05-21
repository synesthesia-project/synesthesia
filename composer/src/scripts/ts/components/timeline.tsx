import {BaseComponent} from "./base";
import * as React from "react";

import * as func from "../data/functional";
import * as playState from "../data/play-state";
import * as stageState from "../data/stage-state";
import * as file from "../data/file";
import * as types from "../util/types";
import * as util from "../util/util";

import Add = require('react-icons/lib/md/add');

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
  updateMouseHover: (pos: func.Maybe<number>) => void;
  mousePosition: func.Maybe<number>;
}

export class Timeline extends BaseComponent<TimelineProps, TimelineState> {

  constructor() {
    super();

    // Bind callbacks & event listeners
    this.addLayerClicked = this.addLayerClicked.bind(this);
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseEnterOrMove = this.mouseEnterOrMove.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
  }

  render() {
    const zoomMargin = stageState.relativeZoomMargins(this.props.zoom);

    const playerPosition = this.props.positionMillis / this.props.file.lengthMillis;

    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="styles/components/timeline.css"/>
          <div className="side left">
            <span className="add-button" onClick={this.addLayerClicked}><Add /></span>
          </div>
          <div className="side right" />
          <div className="timeline">
            <div className="timeline-zoom" style={{
                left: (- zoomMargin.left * 100) + '%',
                right: (- zoomMargin.right * 100) + '%'
              }}
              onMouseDown={this.mouseDown}
              onMouseEnter={this.mouseEnterOrMove}
              onMouseMove={this.mouseEnterOrMove}
              onMouseLeave={this.mouseLeave}
              >
              <div className="marker player-position" style={{left: playerPosition * 100 + '%'}}/>
              {this.props.mousePosition.caseOf({
                just: position => <div className="marker mouse" style={{left: position * 100 + '%'}}/>,
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

  /**
   * Get the position of the mouse within the file (0-1);
   */
  private getMousePosition(e: React.MouseEvent<{}>) {
    const $timelineZoom = this.$().find('.timeline-zoom');
    const pos = (e.pageX - $timelineZoom.offset().left) / $timelineZoom.width();
    return util.restrict(pos, 0, 1);
  }

  /*
   * Jump to this position
   */
  private mouseDown(e: React.MouseEvent<{}>) {
    const pos = this.getMousePosition(e);
    this.props.playState.fmap(state => state.controls.goToTime(state.durationMillis * pos));
  }

  private mouseEnterOrMove(e: React.MouseEvent<{}>) {
    this.props.updateMouseHover(func.just(this.getMousePosition(e)));
  }

  private mouseLeave(e: React.MouseEvent<{}>) {
    this.props.updateMouseHover(func.none());
  }

}
