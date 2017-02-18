import {BaseComponent} from "./base";
import * as React from "react";
import * as ReactDOM from "react-dom";

import * as func from "../data/functional";
import {PlayState} from "../data/play-state";

import {FileSource} from "./file-source";
import {Player} from "./player";
import {Layer} from "./layer";
import {Timeline} from "./timeline";

import {CueFile, emptyFile} from "../data/file";
import * as selection from "../data/selection";
import * as types from "../util/types";


export interface StageProps {  }
export interface StageState {
  playState: PlayState;
  cueFile: CueFile;
  selection: selection.Selection;
}

export class Stage extends BaseComponent<StageProps, StageState> {

  private timerId: number;

  constructor(props: StageProps) {
    super(props);
    this.state = {
      playState: func.none(),
      cueFile: emptyFile(),
      selection: selection.initialSelection()
    }

    // Bind callbacks & event listeners
    this.playStateUpdated = this.playStateUpdated.bind(this);
    this.updateCueFile = this.updateCueFile.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
  }

  componentDidMount() {
    // Called by react when mounted
  }

  componentWillUnmount() {
    // Called by react when about to be unmounted
  }

  private playStateUpdated(playState: PlayState) {
    this.setState({playState} as StageState);
  }

  private updateCueFile(mutator: (cueFile: CueFile) => CueFile) {
    this.setState({cueFile: mutator(this.state.cueFile)} as StageState);
  }

  private updateSelection(mutator: (selection: selection.Selection) => selection.Selection) {
    this.setState({selection: mutator(this.state.selection)} as StageState);
  }

  render() {

    let layers = this.state.cueFile.layers.map((layer, i) =>
      <Layer
        key={i}
        layerKey={i}
        layer={layer}
        selection={this.state.selection}
        updateSelection={this.updateSelection}
        />
    );

    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/stage.css"/>
          <FileSource
            playStateUpdated={this.playStateUpdated}
            />
          <div id="main">
            <div className="layers">
              {layers}
            </div>
            <Timeline
              updateCueFile={this.updateCueFile}
              />
          </div>
          <Player
            playState={this.state.playState}
            />
        </div>
      </externals.ShadowDOM>
    );
  }
}

export function setup() {
  ReactDOM.render(
    <Stage />,
    document.getElementById("root")
  );
}
