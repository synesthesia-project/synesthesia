import {BaseComponent} from "./base";
import * as React from "react";
import * as file from "../data/file";
import * as selection from "../data/selection";
import * as types from "../util/types";

export interface LayerState { }

export interface LayerProps {
  // Properties
  selection: selection.Selection;
  layer: file.CueFileLayer;
  layerKey: number;
  // Callbacks
  updateSelection: types.Mutator<selection.Selection>;
}

export class Layer extends BaseComponent<LayerProps, LayerState> {

  constructor() {
    super();

    // Bind callbacks & event listeners
    this.toggleSelect = this.toggleSelect.bind(this);
  }

  private isSelected() {
    return this.props.selection.layers.indexOf(this.props.layerKey) >= 0;
  }

  render() {
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/layer.css"/>
          <div className="side">
            <span className={"toggle-select-button" + (this.isSelected() ? " selected" : "")} onClick={this.toggleSelect}/>
          </div>
          <div className="timeline"></div>
        </div>
      </externals.ShadowDOM>
    );
  }

  private toggleSelect() {
    this.props.updateSelection(s => selection.toggleLayer(s, this.props.layerKey));
  }

}
