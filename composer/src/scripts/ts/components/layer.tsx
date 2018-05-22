import {styled, rectButton, buttonPressed} from './styling';
import {LayerItems} from './layer-items';
import {LayerVisualization} from './layer-visualization';
import * as func from '../data/functional';
import * as React from 'react';
import * as file from '../shared/file/file';
import * as selection from '../data/selection';
import * as types from '../shared/util/types';
import * as stageState from '../data/stage-state';

import Keyboard = require('react-icons/lib/md/keyboard');
import MusicNote = require('react-icons/lib/md/music-note');
import Settings = require('react-icons/lib/md/settings');

export interface LayerState { }

export interface LayerProps {
  // Properties
  className?: string;
  selection: selection.Selection;
  file: file.CueFile;
  layer: file.AnyLayer;
  layerKey: number;
  zoom: stageState.ZoomState;
  positionMillis: number;
  bindingLayer: func.Maybe<number>;
  midiLayerBindings: {input: string, note: number, layer: number}[];
  selectionDraggingDiff: number | null;
  // Callbacks
  updateSelection: types.Mutator<selection.Selection>;
  updateCueFile: types.Mutator<file.CueFile>;
  requestBindingForLayer: (layerKey: number | null) => void;
  updateSelectionDraggingDiff: (diffMillis: number | null) => void;
  openLayerOptions: (layerKey: number) => void;
}

class Layer extends React.Component<LayerProps, LayerState> {

  constructor(props: LayerProps) {
    super(props);

    // Bind callbacks & event listeners
    this.toggleSelect = this.toggleSelect.bind(this);
    this.toggleRequestBind = this.toggleRequestBind.bind(this);
    this.openLayerOptions = this.openLayerOptions.bind(this);
  }

  private isSelected() {
    return this.props.selection.layers.indexOf(this.props.layerKey) >= 0;
  }

  private isBinding() {
    return this.props.bindingLayer.caseOf({
      just: layerKey => layerKey === this.props.layerKey,
      none: () => false
    });
  }

  public render() {
    const zoomMargin = stageState.relativeZoomMargins(this.props.zoom);
    let binding = '';
    this.props.midiLayerBindings.map(b => {
      if (b.layer === this.props.layerKey)
        binding = b.note.toString();
    });

    return (
      <div className={this.props.className}>
        <div className="side">
          <span
            className={'button' + (this.isSelected() ? ' selected' : '')}
            title="Bind to Keyboard"
            onClick={this.toggleSelect}><Keyboard /></span>
          <span className="column">
            <span className={'button' + (this.isBinding() ? ' selected' : '')} onClick={this.toggleRequestBind}>
              <span>MIDI{binding ? (': ' + binding) : ''}</span>
            </span>
            <span className="button grow" title="Settings" onClick={this.openLayerOptions}><Settings /></span>
          </span>
        </div>
        <LayerVisualization layer={this.props.layer} positionMillis={this.props.positionMillis} />
        <div className="timeline">
          <div className="timeline-selector" />
          <div className="timeline-zoom" style={{
              left: (- zoomMargin.left * 100) + '%',
              right: (- zoomMargin.right * 100) + '%'
            }}>
            <LayerItems
              file={this.props.file}
              layer={this.props.layer}
              layerKey={this.props.layerKey}
              selection={this.props.selection}
              updateSelection={this.props.updateSelection}
              updateCueFile={this.props.updateCueFile}
              selectionDraggingDiff={this.props.selectionDraggingDiff}
              updateSelectionDraggingDiff={this.props.updateSelectionDraggingDiff}
              />
          </div>
        </div>
      </div>
    );
  }

  private toggleSelect() {
    this.props.updateSelection(s => selection.toggleLayer(s, this.props.layerKey));
  }

  private toggleRequestBind() {
    return this.props.bindingLayer.caseOf({
      just: layerKey => this.props.requestBindingForLayer(
        layerKey === this.props.layerKey ? null : this.props.layerKey
      ),
      none: () => this.props.requestBindingForLayer(this.props.layerKey)
    });
  }

  private openLayerOptions() {
    this.props.openLayerOptions(this.props.layerKey);
  }

}

const layerBarHeightPx = 60;

const StyledLayer = styled(Layer)`
  box-sizing: border-box;
  display: block;
  height:  ${p => layerBarHeightPx}px;
  border-bottom: 1px solid ${p => p.theme.borderLight};
  position: relative;

  > .side {
    box-sizing: border-box;
    background: ${p => p.theme.layerSideBg};
    display: flex;
    flex-direction: row;
    align-items: center;
    position: absolute;
    width: ${p => p.theme.layerSideColumnWidthPx}px;
    height: 100%;
    top: 0;
    left: 0;
    border-right: 1px solid ${p => p.theme.borderLight};

    > .button, .column > .button {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 -1px 0 0;
      height: 100%;
      ${rectButton}
      border-radius: 0;
      padding: 6px;
      font-size: 24px;

      > span {
        font-size: 12px;
      }

      &.selected {
        ${buttonPressed}
      }

      &:first-child {
        border-top: none;
      }
    }

    > .column {
      height: 100%;
      flex-grow: 1;
      display: flex;
      flex-direction: column;

      > .button {
        height: initial;
        width: 100%;
        margin-bottom: -1px;
        font-size: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        &.grow {
          flex-grow: 1;
        }
      }
    }
  }

  > .timeline {
    display: block;
    margin-left: ${p => p.theme.layerSideColumnWidthPx}px;
    margin-right: ${p => p.theme.visualizationWidthPx}px;
    height: 100%;
    position: relative;
    overflow: hidden;

    > .timeline-zoom {
      position: absolute;
      top: 0;
      bottom: 0;
    }
  }
`;

export {StyledLayer as Layer};
