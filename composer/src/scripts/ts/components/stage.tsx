import * as jQuery from 'jquery';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { styled, ThemeProvider, defaultTheme } from './styling';

import { PlayState, PlayStateData, currentPosition } from '../data/play-state';

import { Overlays } from './overlays';
import { Toolbar } from './toolbar';
import { Player } from './player';
import { LayersAndTimeline } from './layers-and-timeline';
import { EventProperties } from './item-properties';
import { LayerOptionsPopup } from './popups/layer-options-popup';

import * as file from '@synesthesia-project/core/lib/file';
import * as selection from '../data/selection';
import * as stageState from '../data/stage-state';
import * as fileManipulation from '../data/file-manipulation';
import * as midi from '../midi/midi';
import { KEYCODES } from '../util/input';

import { prepareSpotifySDKListener } from '../external/spotify-sdk';

export interface StageProps {
  className?: string;
}

export interface StageState {
  playState: PlayState;
  cueFile: {
    id: string;
    file: file.CueFile;
  } | null;
  selection: selection.Selection;
  state: stageState.StageState;
  bindingLayer: number | null;
  midiLayerBindings: { input: string; note: number; layer: number }[];
  layerOptionsOpen: number | null;
}

export class Stage extends React.Component<StageProps, StageState> {
  private readonly midi = new midi.Midi();

  // Refd Elements (used for event geometry)
  private timeline: HTMLDivElement | null = null;
  private player: HTMLDivElement | null = null;
  private layers: HTMLDivElement | null = null;

  constructor(props: StageProps) {
    super(props);
    this.state = {
      playState: null,
      cueFile: null,
      selection: selection.initialSelection(),
      state: stageState.initialState(),
      bindingLayer: null,
      midiLayerBindings: [],
      layerOptionsOpen: null,
    };
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
    jQuery(window).on('keydown', (e) => {
      // Add items to selected layers
      if (e.keyCode === KEYCODES.ENTER) {
        this.addItemsToSelectedLayers();
        e.preventDefault();
        return;
      }
      console.debug('keydown', e, e.keyCode);
    });

    jQuery(window).on('keyup', (e) => {
      // Toggle Play / Pause
      if (e.keyCode === KEYCODES.SPACE) {
        if (this.state.playState) this.state.playState.controls.toggle();
        e.preventDefault();
        return;
      }
      // Clear Selected Events
      if (e.keyCode === KEYCODES.ESC) {
        this.updateSelection((s) => selection.clearSelectedEvents(s));
        e.preventDefault();
        return;
      }
      // Delete Selected Events (if not focussed on something else)
      if (
        e.keyCode === KEYCODES.DEL &&
        document.activeElement === document.body
      ) {
        this.updateCueFileAndSelection(([f, s]) => [
          fileManipulation.deleteSelectedEvents(f, s),
          selection.clearSelectedEvents(s),
        ]);
        e.preventDefault();
        return;
      }
      console.debug('keyup', e, e.keyCode);
    });

    window.addEventListener(
      'wheel',
      (e) => {
        // Prevent all default mouse wheel behaviour
        e.preventDefault();

        // Don't do any zoom behaviour if any required component
        if (!this.timeline || !this.player || !this.layers) return;

        // Work out where the mouse is currently positioned
        const paddingLeft = 100; // width of the side bar
        const mousePosition =
          e.pageY > jQuery(this.player).offset().top
            ? 'player'
            : e.pageX > paddingLeft &&
              e.pageY > jQuery(this.timeline).offset().top
            ? 'timeline'
            : e.pageX > paddingLeft &&
              e.pageY > jQuery(this.layers).offset().top
            ? 'layers'
            : 'none';

        const deltaY = e.deltaY;
        const deltaX = e.deltaX;

        // Handle zooming in + out

        if (
          (mousePosition === 'layers' || mousePosition === 'timeline') &&
          e.ctrlKey &&
          deltaY !== 0
        ) {
          // Work out position of mouse on stage for zoom origin
          const pos =
            (e.pageX - paddingLeft) / (jQuery(window).width() - paddingLeft);

          if (deltaY < 0)
            this.setState((prevState) => ({
              state: stageState.zoomIn(prevState.state, pos),
            }));
          else
            this.setState((prevState) => ({
              state: stageState.zoomOut(prevState.state, pos),
            }));
          return;
        }

        // Handle horizontal scrolling

        if (
          (mousePosition === 'layers' || mousePosition === 'timeline') &&
          deltaY !== 0
        ) {
          if (deltaY < 0)
            this.setState((prevState) => ({
              state: stageState.zoomMoveLeft(prevState.state),
            }));
          else
            this.setState((prevState) => ({
              state: stageState.zoomMoveRight(prevState.state),
            }));
          return;
        }

        if (mousePosition === 'layers' && deltaX !== 0) {
          if (deltaX < 0)
            this.setState((prevState) => ({
              state: stageState.zoomMoveLeft(prevState.state),
            }));
          else
            this.setState((prevState) => ({
              state: stageState.zoomMoveRight(prevState.state),
            }));
          return;
        }
      },
      { passive: false }
    );
  }

  private setupMIDIListeners() {
    this.midi.addListener({
      inputRemoved: (input) => console.debug('inputRemoved', input),
      noteOn: (input, note, _velocity) => {
        const layerKey = this.state.bindingLayer;
        if (layerKey) {
          // Bind this note to that layer
          this.setState((prevState) => ({
            bindingLayer: null,
            midiLayerBindings: prevState.midiLayerBindings
              // Remove existing bindings for this layer or note
              .filter(
                (b) =>
                  b.layer !== layerKey && (b.input !== input || b.note !== note)
              )
              .concat({ input, note, layer: layerKey }),
          }));
        } else {
          this.state.midiLayerBindings.map((b) => {
            if (b.input === input && b.note === note && this.state.playState) {
              const timestampMillis = this.currentTimestamp(
                this.state.playState
              );
              this.updateCueFile((file) =>
                fileManipulation.addLayerItem(file, b.layer, timestampMillis)
              );
            }
          });
        }
      },
      noteOff: (input, note) => console.debug('stage noteOff', input, note),
    });
  }

  private addItemsToSelectedLayers() {
    if (!this.state.playState) return;
    const timestampMillis = this.currentTimestamp(this.state.playState);
    this.updateCueFile((cueFile) => {
      for (const i of this.state.selection.layers) {
        cueFile = fileManipulation.addLayerItem(cueFile, i, timestampMillis);
      }
      return cueFile;
    });
  }

  private currentTimestamp(state: PlayStateData) {
    return state.state.type === 'paused'
      ? state.state.positionMillis
      : (performance.now() - state.state.effectiveStartTimeMillis) *
          state.state.playSpeed;
  }

  private playStateUpdated = (playState: PlayState) => {
    this.setState({ playState });
  };

  private fileLoaded = (id: string, file: file.CueFile) => {
    this.setState({ cueFile: { id, file } });
  };

  private updateCueFile = (
    mutator: (cueFile: file.CueFile) => file.CueFile
  ) => {
    this.setState((prevState) => {
      const state = { cueFile: prevState.cueFile };
      if (state.cueFile) {
        state.cueFile = {
          id: state.cueFile.id,
          file: mutator(state.cueFile.file),
        };
      }
      return state;
    });
  };

  private updateSelection = (
    mutator: (selection: selection.Selection) => selection.Selection
  ) => {
    this.setState((prevState) => ({ selection: mutator(prevState.selection) }));
  };

  private updateCueFileAndSelection = (
    mutator: (
      current: [file.CueFile, selection.Selection]
    ) => [file.CueFile, selection.Selection]
  ) => {
    this.setState((prevState) => {
      const state = {
        cueFile: prevState.cueFile,
        selection: prevState.selection,
      };
      if (state.cueFile) {
        const result = mutator([state.cueFile.file, this.state.selection]);
        state.cueFile = { id: state.cueFile.id, file: result[0] };
        state.selection = result[1];
      }
      return state;
    });
  };

  private requestBindingForLayer = (layerKey: number | null) => {
    this.setState({ bindingLayer: layerKey });
  };

  private openLayerOptions = (layerKey: number) => {
    this.setState({ layerOptionsOpen: layerKey });
  };

  private closeLayerOptions = () => {
    this.setState({ layerOptionsOpen: null });
  };

  private toggleZoomPanLock = () => {
    this.setState((state) => ({
      state: {
        zoomPan:
          state.state.zoomPan.type === 'locked'
            ? stageState.unlockZoomAndPan(
                state.state.zoomPan,
                state.playState ? currentPosition(state.playState) : 0
              )
            : stageState.lockZoomAndPan(state.state.zoomPan),
      },
    }));
  };

  public render() {
    const popup =
      this.state.layerOptionsOpen !== null
        ? { element: <LayerOptionsPopup />, dismiss: this.closeLayerOptions }
        : null;
    const cueFile =
      this.state.cueFile &&
      this.state.playState &&
      this.state.cueFile.id === this.state.playState.meta.id
        ? this.state.cueFile.file
        : null;

    return (
      <div className={this.props.className}>
        <Overlays popup={popup} />
        <Toolbar
          file={this.state.cueFile}
          playState={this.state.playState}
          playStateUpdated={this.playStateUpdated}
          fileLoaded={this.fileLoaded}
        />
        <LayersAndTimeline
          file={cueFile}
          playState={this.state.playState}
          selection={this.state.selection}
          state={this.state.state}
          bindingLayer={this.state.bindingLayer}
          midiLayerBindings={this.state.midiLayerBindings}
          updateSelection={this.updateSelection}
          timelineRef={(timeline) => (this.timeline = timeline)}
          layersRef={(layers) => (this.layers = layers)}
          updateCueFile={this.updateCueFile}
          requestBindingForLayer={this.requestBindingForLayer}
          openLayerOptions={this.openLayerOptions}
          toggleZoomPanLock={this.toggleZoomPanLock}
        />
        {cueFile && (
          <EventProperties
            file={cueFile}
            selection={this.state.selection}
            updateCueFileAndSelection={this.updateCueFileAndSelection}
          />
        )}
        <Player
          playerRef={(player) => (this.player = player)}
          zoom={this.state.state.zoomPan}
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
