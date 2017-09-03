import {BaseComponent} from './base';
import {Layer} from './layer';
import {Timeline} from './timeline';
import * as React from 'react';
import * as func from '../data/functional';
import * as file from '../shared/file/file';
import * as selection from '../data/selection';
import * as types from '../shared/util/types';
import * as stageState from '../data/stage-state';
import * as playState from '../data/play-state';

export interface LayersAndTimelineProps {
  // Properties
  selection: selection.Selection;
  file: func.Maybe<file.CueFile>;
  state: stageState.StageState;
  playState: playState.PlayState;
  bindingLayer: func.Maybe<number>;
  midiLayerBindings: {input: string, note: number, layer: number}[];
  // Callbacks
  timelineRef: (ref: Timeline) => void;
  layersRef: (ref: HTMLDivElement) => void;
  updateCueFile: types.Mutator<file.CueFile>;
  updateSelection: types.Mutator<selection.Selection>;
  requestBindingForLayer: (layerKey: number | null) => void;
}

export interface LayersAndTimelineState {
  /** Current position in milliseconds, updated every so often based on frame-rate */
  positionMillis: number;
  mousePosition: func.Maybe<number>;
  /**
   * If the user is currently dragging the selected elements, then
   * this is the difference in milliseconds
   */
  selectionDraggingDiff: number | null;
}

export class LayersAndTimeline extends BaseComponent<LayersAndTimelineProps, LayersAndTimelineState> {

  private updateInterval: number;

  constructor() {
    super();
    this.state = {
      positionMillis: 0,
      mousePosition: func.none(),
      selectionDraggingDiff: null
    };
    this.updateMouseHover = this.updateMouseHover.bind(this);
    this.updateSelectionDraggingDiff = this.updateSelectionDraggingDiff.bind(this);
  }

  public componentDidMount() {
    this.updatePositionInterval(this.props);
  }

  public componentWillReceiveProps(newProps: LayersAndTimelineProps) {
    this.updatePositionInterval(newProps);
  }

  private updatePositionInterval(newProps: LayersAndTimelineProps) {
    cancelAnimationFrame(this.updateInterval);
    // Start a re-rendering interval if currently playing
    newProps.playState.fmap(state => state.state.caseOf<void>({
      left: pausedState => { /* do-nothing */ },
      right: playingState => {
        const update = () => {
          this.updatePosition(newProps);
          this.updateInterval = requestAnimationFrame(update);
        };
        this.updateInterval = requestAnimationFrame(update);
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

  private updateSelectionDraggingDiff(selectionDraggingDiff: number | null): void {
    this.setState({selectionDraggingDiff});
  }

  public render() {
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
          bindingLayer={this.props.bindingLayer}
          midiLayerBindings={this.props.midiLayerBindings}
          selectionDraggingDiff={this.state.selectionDraggingDiff}
          updateSelection={this.props.updateSelection}
          updateCueFile={this.props.updateCueFile}
          requestBindingForLayer={this.props.requestBindingForLayer}
          updateSelectionDraggingDiff={this.updateSelectionDraggingDiff}
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
