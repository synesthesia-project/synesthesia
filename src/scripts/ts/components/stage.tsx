import {BaseComponent} from "./base";
import * as React from "react";
import * as ReactDOM from "react-dom";

import * as func from "../data/functional";
import {PlayState} from "../data/play-state";

import {FileSource} from "./file-source";
import {Player} from "./player";
import {Layer} from "./layer";
import {Timeline} from "./timeline";

import * as file from "../data/file";
import * as selection from "../data/selection";
import * as types from "../util/types";
import * as stageState from "../data/stage-state"
import {KEYCODES} from "../util/input";


export interface StageProps {  }
export interface StageState {
  playState: PlayState;
  cueFile: func.Maybe<file.CueFile>;
  selection: selection.Selection;
  state: stageState.StageState;
}

export class Stage extends BaseComponent<StageProps, StageState> {

  private timerId: number;

  constructor(props: StageProps) {
    super(props);
    this.state = {
      playState: func.none(),
      cueFile: func.none(),
      selection: selection.initialSelection(),
      state: stageState.initialState()
    }

    // Bind callbacks & event listeners
    this.playStateUpdated = this.playStateUpdated.bind(this);
    this.updateCueFile = this.updateCueFile.bind(this);
    this.updateSelection = this.updateSelection.bind(this);

    this.setupWindowListeners();
  }

  componentDidMount() {
    // Called by react when mounted
  }

  componentWillUnmount() {
    // Called by react when about to be unmounted
  }

  private setupWindowListeners() {
    $(window).on('keydown', (e) => {
      // Add items to selected layers
      if (e.keyCode == KEYCODES.ENTER) {
        this.addItemsToSelectedLayers();
        e.preventDefault();
        return;
      }
      console.debug('keydown', e, e.keyCode);
    });
    $(window).on('keyup', (e) => {
      // Toggle Play / Pause
      if (e.keyCode == KEYCODES.SPACE) {
        this.state.playState.fmap(state => state.controls.toggle());
        e.preventDefault();
        return;
      }
      console.debug('keyup', e, e.keyCode);
    });
    $(window).on('wheel', e => {
      const delta = (e.originalEvent as WheelEvent).deltaY;
      if (e.ctrlKey) {
        let state: stageState.StageState;
        if (delta > 0)
          state = stageState.zoomIn(this.state.state, 0.3);
        else
          state = stageState.zoomOut(this.state.state, 0.3);
        this.setState({state} as StageState);
      }
      // Mouse wheel either zooms or scrolls
      e.preventDefault();
    })
  }

  private addItemsToSelectedLayers() {
    this.state.playState.fmap(state => {
      const timestampMillis = state.state.caseOf({
        left: pausedState => pausedState.timeMillis,
        right: playingState => new Date().getTime() - playingState.effectiveStartTimeMillis
      });
      this.state.cueFile.fmap(cueFile => {
        for (const i of this.state.selection.layers) {
          cueFile = file.addLayerItem(cueFile, i, timestampMillis);
        }
        this.setState({cueFile: func.just(cueFile)} as StageState);
      });
    })
  }

  private playStateUpdated(playState: PlayState) {
    this.setState({playState} as StageState);
    // If a file is loaded, update the length of the cue file
    playState.fmap(playState => {
      const cueFile = func.just(this.state.cueFile.caseOf({
        // Create new Cue File
        none: () => file.emptyFile(playState.durationMillis),
        // TODO: add user prompt to confirm if they want to change length of cue file
        just: existingFile => file.setLength(existingFile, playState.durationMillis)
      }));
      this.setState({cueFile} as StageState);
    })
  }

  private updateCueFile(mutator: (cueFile: file.CueFile) => file.CueFile) {
    this.state.cueFile.fmap(cueFile => {
      this.setState({cueFile: func.just(mutator(cueFile))} as StageState);
    });
  }

  private updateSelection(mutator: (selection: selection.Selection) => selection.Selection) {
    this.setState({selection: mutator(this.state.selection)} as StageState);
  }

  render() {

    let layers = this.state.cueFile.caseOf({
      just: cueFile => cueFile.layers.map((layer, i) =>
        <Layer
          key={i}
          file={cueFile}
          layerKey={i}
          layer={layer}
          selection={this.state.selection}
          updateSelection={this.updateSelection}
          />
      ),
      none: () => []
    });

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
