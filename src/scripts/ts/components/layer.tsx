import {BaseComponent} from "./base";
import * as React from "react";
import * as file from "../data/file";
import * as selection from "../data/selection";
import * as types from "../util/types";
import * as stageState from "../data/stage-state";

export interface LayerState { }

export interface LayerProps {
  // Properties
  selection: selection.Selection;
  file: file.CueFile;
  layer: file.CueFileLayer;
  layerKey: number;
  zoom: stageState.ZoomState;
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
    const items = this.props.layer.items.map((item, i) => {
      const style: React.CSSProperties = {
        left: (item.timestampMillis / this.props.file.lengthMillis) * 100 + "%"
      };
      return <div key={i} className="item" style={style}></div>
    });
    const zoomMargin = stageState.relativeZoomMargins(this.props.zoom);
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/layer.css"/>
          <div className="side">
            <span className={"toggle-select-button" + (this.isSelected() ? " selected" : "")} onClick={this.toggleSelect}/>
          </div>
          <div className="timeline">
            <div className="timeline-zoom" style={{
                left: (- zoomMargin.left * 100) + '%',
                right: (- zoomMargin.right * 100) + '%'
              }}>
              {items}
            </div>
          </div>
        </div>
      </externals.ShadowDOM>
    );
  }

  private toggleSelect() {
    this.props.updateSelection(s => selection.toggleLayer(s, this.props.layerKey));
  }

}
