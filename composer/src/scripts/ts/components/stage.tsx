import {BaseComponent} from "./base";
import * as React from "react";
import * as ReactDOM from "react-dom";

import * as func from "../data/functional";
import {PlayState} from "../data/play-state";

import {FileSource} from "./file-source";
import {Player} from "./player";
import {LayersAndTimeline} from "./layers-and-timeline";
import {Timeline} from "./timeline";
import {EventProperties} from "./item-properties";

import * as file from "../data/file";
import * as selection from "../data/selection";
import * as types from "../util/types";
import * as stageState from "../data/stage-state"
import * as fileManipulation from "../data/file-manipulation";
import * as midi from "../midi/midi";
import {KEYCODES} from "../util/input";


export interface StageProps {  }
export interface StageState {
  playState: PlayState;
  cueFile: func.Maybe<file.CueFile>;
  selection: selection.Selection;
  state: stageState.StageState;
}

export class Stage extends BaseComponent<StageProps, StageState> {

  private readonly midi = new midi.Midi();

  // Refd Elements (used for event geometry)
  private timeline: Timeline;
  private player: Player;
  private layers: HTMLDivElement;

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
    this.updateCueFileAndSelection = this.updateCueFileAndSelection.bind(this);
  }

  componentDidMount() {
    // Called by react when mounted
    this.setupWindowListeners();
    this.midi.init();
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
      // Clear Selected Events
      if (e.keyCode == KEYCODES.ESC) {
        this.updateSelection(s => selection.clearSelectedEvents(s));
        e.preventDefault();
        return;
      }
      // Delete Selected Events (if not focussed on something else)
      if (e.keyCode == KEYCODES.DEL && document.activeElement === document.body) {
        this.updateCueFileAndSelection(([f, s]) => [
          fileManipulation.deleteSelectedEvents(f, s),
          selection.clearSelectedEvents(s)
        ]);
        e.preventDefault();
        return;
      }
      console.debug('keyup', e, e.keyCode);
    });

    $(window).on('wheel', e => {
      // Prevent all default mouse wheel behaviour
      e.preventDefault();

      // Don't do any zoom behaviour if timeline isn't setup
      if (!this.timeline)
        return;

      // Work out where the mouse is currently positioned
      const paddingLeft = 100; // width of the side bar
      const mousePosition =
        e.pageY > this.player.getOffset().top ? 'player' :
        e.pageX > paddingLeft && e.pageY > this.timeline.getOffset().top ? 'timeline' :
        e.pageX > paddingLeft && e.pageY > $(this.layers).offset().top ? 'layers' : 'none';

      const deltaY = (e.originalEvent as WheelEvent).deltaY;
      const deltaX = (e.originalEvent as WheelEvent).deltaX;

      let state: stageState.StageState;

      // Handle zooming in + out

      if ((mousePosition === 'layers' || mousePosition === 'timeline') && e.ctrlKey && deltaY !== 0) {
        // Work out position of mouse on stage for zoom origin
        const pos = (e.pageX - paddingLeft) / ($(window).width() - paddingLeft);

        if (deltaY < 0)
          this.setState({state: stageState.zoomIn(this.state.state, pos)} as StageState);
        else
          this.setState({state: stageState.zoomOut(this.state.state, pos)} as StageState);
        return;
      }

      // Handle horizontal scrolling

      if ((mousePosition === 'layers' || mousePosition === 'timeline')  && deltaY !== 0) {
        if (deltaY < 0)
          this.setState({state: stageState.zoomMoveLeft(this.state.state)} as StageState);
        else
          this.setState({state: stageState.zoomMoveRight(this.state.state)} as StageState);
        return;
      }

      if (mousePosition === 'layers' && deltaX !== 0) {
        if (deltaX < 0)
          this.setState({state: stageState.zoomMoveLeft(this.state.state)} as StageState);
        else
          this.setState({state: stageState.zoomMoveRight(this.state.state)} as StageState);
        return;
      }
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

  private updateCueFileAndSelection(mutator: (current: [file.CueFile, selection.Selection]) => [file.CueFile, selection.Selection]) {
    this.state.cueFile.fmap(cueFile => {
      const result = mutator([cueFile, this.state.selection]);
      this.setState({cueFile: func.just(result[0]), selection: result[1]} as StageState);
    })
  }

  render() {

    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="styles/components/stage.css"/>
          <FileSource
            file={this.state.cueFile}
            playStateUpdated={this.playStateUpdated}
            />
          <LayersAndTimeline
            file={this.state.cueFile}
            playState={this.state.playState}
            selection={this.state.selection}
            state={this.state.state}
            updateSelection={this.updateSelection}
            timelineRef={timeline => this.timeline = timeline}
            layersRef={layers => this.layers = layers}
            updateCueFile={this.updateCueFile}
            />
          {this.state.cueFile.caseOf({
            just: file => <EventProperties
              file={file}
              selection={this.state.selection}
              updateCueFileAndSelection={this.updateCueFileAndSelection} />,
            none: () => null
          })}
          <Player
            ref={player => this.player = player}
            zoom={this.state.state.zoom}
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
