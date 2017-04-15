import {BaseComponent} from "./base";
import {Layer} from "./layer";
import {Timeline} from "./timeline";
import * as React from "react";
import * as func from "../data/functional";
import * as file from "../data/file";
import * as selection from "../data/selection";
import * as types from "../util/types";
import * as stageState from "../data/stage-state";
import * as playState from "../data/play-state";

export interface LayersAndTimelineProps {
  // Properties
  selection: selection.Selection;
  file: func.Maybe<file.CueFile>;
  state: stageState.StageState;
  playState: playState.PlayState;
  // Callbacks
  timelineRef: (ref: Timeline) => void;
  layersRef: (ref: HTMLDivElement) => void;
  updateCueFile: types.Mutator<file.CueFile>;
  updateSelection: types.Mutator<selection.Selection>;
}

export interface LayersAndTimelineState {
  /** Current position in milliseconds, updated every so often based on frame-rate */
  positionMillis: number;
  mousePosition: func.Maybe<number>;
}

export class LayersAndTimeline extends BaseComponent<LayersAndTimelineProps, LayersAndTimelineState> {

  private updateInterval: number;

  constructor() {
    super();
    this.state = {
      positionMillis: 0,
      mousePosition: func.none()
    }
    this.updateMouseHover = this.updateMouseHover.bind(this);
  }

  componentDidMount() {
    this.updatePositionInterval(this.props);
  }

  componentWillReceiveProps(newProps: LayersAndTimelineProps) {
    this.updatePositionInterval(newProps);
  }

  private updatePositionInterval(newProps: LayersAndTimelineProps) {
    clearInterval(this.updateInterval);
    // Start a re-rendering interval if currently playing
    newProps.playState.fmap(state => state.state.caseOf<void>({
      left: pausedState => {},
      right: playingState => {
        this.updateInterval = window.setInterval(() => this.updatePosition(newProps), 20)
      }
    }));
    this.updatePosition(newProps);
  }

  private updatePosition(newProps: LayersAndTimelineProps) {
    newProps.file.fmap(file => {
      newProps.playState
        // Extract current time
        .fmap(state => state.state.caseOf({
          left: pausedState => pausedState.timeMillis,
          right: playingState => new Date().getTime() - playingState.effectiveStartTimeMillis
        }))
        // Update positionMillis with time if different enough
        .fmap(time => {
          if (time < this.state.positionMillis - 10 || time > this.state.positionMillis + 10)
            this.setState({positionMillis: time});
        });
    });
  }

  private updateMouseHover(mousePosition: func.Maybe<number>) {
    this.setState({mousePosition});
  }

  render() {
    let layers = this.props.file.caseOf({
      just: cueFile => cueFile.layers.map((layer, i) =>
        <Layer
          key={i}
          file={cueFile}
          layerKey={i}
          layer={layer}
          zoom={this.props.state.zoom}
          selection={this.props.selection}
          positionMillis={this.state.positionMillis}
          updateSelection={this.props.updateSelection}
          />
      ),
      none: () => []
    });

    const zoomMargin = stageState.relativeZoomMargins(this.props.state.zoom);

    const playerPosition = this.props.file.fmap(file => this.state.positionMillis / file.lengthMillis);

    return (
      <div id="main">
        <div
          className="layers"
          ref={layers => this.props.layersRef(layers)}>
          {layers}
          <div className="overlay">
            <div className="zoom" style={{
                left: (- zoomMargin.left * 100) + '%',
                right: (- zoomMargin.right * 100) + '%'
              }}>
              {playerPosition.caseOf({
                just: position => <div className="marker player-position" style={{left: position * 100 + '%'}}/>,
                none: () => null
              })}
              {this.state.mousePosition.caseOf({
                just: position => <div className="marker mouse" style={{left: position * 100 + '%'}}/>,
                none: () => null
              })}
            </div>
          </div>
        </div>
        {this.props.file.caseOf({
          just: cueFile => <Timeline
            ref={timeline => this.props.timelineRef(timeline)}
            updateCueFile={this.props.updateCueFile}
            file={cueFile}
            zoom={this.props.state.zoom}
            positionMillis={this.state.positionMillis}
            playState={this.props.playState}
            updateMouseHover={this.updateMouseHover}
            mousePosition={this.state.mousePosition}
            />,
          none: () => null
        })}
      </div>
    );
  }

}
