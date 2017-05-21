import {BaseComponent} from "./base";
import {LayerItems} from "./layer-items";
import {LayerVisualization} from "./layer-visualization";
import * as func from "../data/functional";
import * as React from "react";
import * as file from "../data/file";
import * as selection from "../data/selection";
import * as types from "../util/types";
import * as stageState from "../data/stage-state";

import Keyboard = require('react-icons/lib/md/keyboard');
import MusicNote = require('react-icons/lib/md/music-note');

export interface LayerState { }

export interface LayerProps {
  // Properties
  selection: selection.Selection;
  file: file.CueFile;
  layer: file.AnyLayer;
  layerKey: number;
  zoom: stageState.ZoomState;
  positionMillis: number;
  bindingLayer: func.Maybe<number>;
  midiLayerBindings: {input: string, note: number, layer: number}[];
  // Callbacks
  updateSelection: types.Mutator<selection.Selection>;
  requestBindingForLayer: (layerKey: number) => void;
}

export class Layer extends BaseComponent<LayerProps, LayerState> {

  constructor() {
    super();

    // Bind callbacks & event listeners
    this.toggleSelect = this.toggleSelect.bind(this);
    this.requestBind = this.requestBind.bind(this);
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

  render() {
    const zoomMargin = stageState.relativeZoomMargins(this.props.zoom);
    let binding = "";
    this.props.midiLayerBindings.map(b => {
      if (b.layer === this.props.layerKey)
        binding = b.note.toString();
    });

    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="styles/components/layer.css"/>
          <div className="side">
            <span className={"toggle-select-button" + (this.isSelected() ? " selected" : "")} onClick={this.toggleSelect}><Keyboard /></span>
            <span className={"bind-button" + (this.isBinding() ? " binding" : "")} onClick={this.requestBind}>
              <MusicNote/>{binding ? (': ' + binding) : ''}
            </span>
          </div>
          <LayerVisualization layer={this.props.layer} positionMillis={this.props.positionMillis} />
          <div className="timeline">
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
                />
            </div>
          </div>
        </div>
      </externals.ShadowDOM>
    );
  }

  private toggleSelect() {
    this.props.updateSelection(s => selection.toggleLayer(s, this.props.layerKey));
  }

  private requestBind() {
    this.props.requestBindingForLayer(this.props.layerKey);
  }

}
