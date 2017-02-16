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


export interface StageProps {  }
export interface StageState {
  playState: PlayState;
  cueFile: CueFile;
}

export class Stage extends BaseComponent<StageProps, StageState> {

  private timerId: number;

  constructor(props: StageProps) {
    super(props);
    this.state = {
      playState: func.none(),
      cueFile: emptyFile()
    }

    // Bind callbacks & event listeners
    this.playStateUpdated = this.playStateUpdated.bind(this);
    this.updateCueFile = this.updateCueFile.bind(this);
  }

  componentDidMount() {
    // Called by react when mounted
  }

  componentWillUnmount() {
    // Called by react when about to be unmounted
  }

  private playStateUpdated(state: PlayState) {
    this.setState({
      playState: state
    } as StageState);
  }

  private updateCueFile(file: CueFile) {
    this.setState({
      cueFile: file
    } as StageState);
  }

  render() {

    let layers = this.state.cueFile.layers.map((layer, i) =>
      <Layer
        key={i}
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
              cueFile={this.state.cueFile}
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
