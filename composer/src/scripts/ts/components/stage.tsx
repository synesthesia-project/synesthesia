import {BaseComponent} from './base';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {styled, ThemeProvider, defaultTheme} from './styling';

import * as shared from '../shared';

import * as func from '../data/functional';
import {PlayState, PlayStateData} from '../data/play-state';

import {Overlays} from './overlays';
import {Toolbar} from './toolbar';
import {Player} from './player';
import {LayersAndTimeline} from './layers-and-timeline';
import {Timeline} from './timeline';
import {EventProperties} from './item-properties';

import * as file from '../shared/file/file';
import * as selection from '../data/selection';
import * as stageState from '../data/stage-state';
import * as fileManipulation from '../data/file-manipulation';
import * as midi from '../midi/midi';
import {KEYCODES} from '../util/input';

import {prepareSpotifySDKListener} from '../external/spotify-sdk';


export interface StageProps {
  className?: string;
}

export interface StageState {
  playState: PlayState;
  cueFile: func.Maybe<file.CueFile>;
  selection: selection.Selection;
  state: stageState.StageState;
  bindingLayer: func.Maybe<number>;
  midiLayerBindings: {input: string, note: number, layer: number}[];
}

export class Stage extends BaseComponent<StageProps, StageState> {

  private readonly midi = new midi.Midi();

  // Refd Elements (used for event geometry)
  private timeline: HTMLDivElement | null = null;
  private player: Player | null = null;
  private layers: HTMLDivElement | null = null;

  constructor(props: StageProps) {
    super(props);
    this.state = {
      playState: func.none(),
      cueFile: func.none(),
      selection: selection.initialSelection(),
      state: stageState.initialState(),
      bindingLayer: func.none(),
      midiLayerBindings: []
    };

    // Bind callbacks & event listeners
    this.playStateUpdated = this.playStateUpdated.bind(this);
    this.fileLoaded = this.fileLoaded.bind(this);
    this.updateCueFile = this.updateCueFile.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.updateCueFileAndSelection = this.updateCueFileAndSelection.bind(this);
    this.requestBindingForLayer = this.requestBindingForLayer.bind(this);

    shared.protocol.messages.test();
  }

  public componentDidMount() {
    // Called by react when mounted
    this.setupWindowListeners();
    this.setupMIDIListeners();
    this.midi.init();
  }

  public componentWillUnmount() {
    // Called by react when about to be unmounted
  }

  private setupWindowListeners() {

    $(window).on('keydown', (e) => {
      // Add items to selected layers
      if (e.keyCode === KEYCODES.ENTER) {
        this.addItemsToSelectedLayers();
        e.preventDefault();
        return;
      }
      console.debug('keydown', e, e.keyCode);
    });

    $(window).on('keyup', (e) => {
      // Toggle Play / Pause
      if (e.keyCode === KEYCODES.SPACE) {
        this.state.playState.fmap(state => state.controls.toggle());
        e.preventDefault();
        return;
      }
      // Clear Selected Events
      if (e.keyCode === KEYCODES.ESC) {
        this.updateSelection(s => selection.clearSelectedEvents(s));
        e.preventDefault();
        return;
      }
      // Delete Selected Events (if not focussed on something else)
      if (e.keyCode === KEYCODES.DEL && document.activeElement === document.body) {
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

      // Don't do any zoom behaviour if any required component
      if (!this.timeline || !this.player || !this.layers)
        return;

      // Work out where the mouse is currently positioned
      const paddingLeft = 100; // width of the side bar
      const mousePosition =
        e.pageY > this.player.getOffset().top ? 'player' :
        e.pageX > paddingLeft && e.pageY > $(this.timeline).offset().top ? 'timeline' :
        e.pageX > paddingLeft && e.pageY > $(this.layers).offset().top ? 'layers' : 'none';

      const deltaY = (e.originalEvent as WheelEvent).deltaY;
      const deltaX = (e.originalEvent as WheelEvent).deltaX;

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
    });
  }

  private setupMIDIListeners() {
    this.midi.addListener({
      inputRemoved: input => console.debug('inputRemoved', input),
      noteOn: (input, note, velocity) => {
        this.state.bindingLayer.caseOf({
          just: layerKey => {
            // Bind this note to that layer
            this.setState({
              bindingLayer: func.none(),
              midiLayerBindings: this.state.midiLayerBindings
                // Remove existing bindings for this layer or note
                .filter(b => b.layer !== layerKey && (b.input !== input || b.note !== note))
                .concat({input, note, layer: layerKey})
            });
          },
          none: () => {
            this.state.midiLayerBindings.map(b => {
              if (b.input === input && b.note === note) {
                this.state.playState.fmap(state => {
                  const timestampMillis = this.currentTimestamp(state);
                  this.state.cueFile.fmap(cueFile => {
                    this.setState({cueFile: func.just(
                      fileManipulation.addLayerItem(cueFile, b.layer, timestampMillis)
                    )});
                  });
                });
              }
            });
          }
        });
      },
      noteOff: (input, note) => console.debug('stage noteOff', input, note)
    });
  }

  private addItemsToSelectedLayers() {
    this.state.playState.fmap(state => {
      const timestampMillis = this.currentTimestamp(state);
      this.state.cueFile.fmap(cueFile => {
        for (const i of this.state.selection.layers) {
          cueFile = fileManipulation.addLayerItem(cueFile, i, timestampMillis);
        }
        this.setState({cueFile: func.just(cueFile)} as StageState);
      });
    });
  }

  private currentTimestamp(state: PlayStateData) {
    return state.state.caseOf({
      left: pausedState => pausedState.timeMillis,
      right: playingState => new Date().getTime() - playingState.effectiveStartTimeMillis
    });
  }

  private playStateUpdated(playState: PlayState) {
    console.log('playStateUpdated', playState);
    this.setState({playState} as StageState);
    // If a file is loaded, update the length of the cue file
    playState.fmap(playState => {
      const cueFile = func.just(this.state.cueFile.caseOf({
        // Create new Cue File
        none: () => file.emptyFile(playState.durationMillis),
        // TODO: add user prompt to confirm if they want to change length of cue file
        just: existingFile => fileManipulation.setLength(existingFile, playState.durationMillis)
      }));
      this.setState({cueFile} as StageState);
    });
  }

  private fileLoaded(file: file.CueFile): void {
    this.setState({cueFile: func.just(file)});
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
    });
  }

  private requestBindingForLayer(layerKey: number | null) {
    this.setState({bindingLayer: func.maybeFrom(layerKey)});
  }

  public render() {

    return (
      <div className={this.props.className}>
        <Overlays />
        <Toolbar
          file={this.state.cueFile}
          playState={this.state.playState}
          playStateUpdated={this.playStateUpdated}
          fileLoaded={this.fileLoaded}
          />
        <LayersAndTimeline
          file={this.state.cueFile}
          playState={this.state.playState}
          selection={this.state.selection}
          state={this.state.state}
          bindingLayer={this.state.bindingLayer}
          midiLayerBindings={this.state.midiLayerBindings}
          updateSelection={this.updateSelection}
          timelineRef={timeline => this.timeline = timeline}
          layersRef={layers => this.layers = layers}
          updateCueFile={this.updateCueFile}
          requestBindingForLayer={this.requestBindingForLayer}
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
    );
  }
}

const StyledStage = styled(Stage)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export function setup() {
  // Needs to be called before the promise is used
  prepareSpotifySDKListener();
  // Run App
  ReactDOM.render(
    <ThemeProvider theme={defaultTheme}>
      <StyledStage />
    </ThemeProvider>,
    document.getElementById('root')
  );
}
