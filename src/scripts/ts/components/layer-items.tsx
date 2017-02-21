import {BaseComponent} from "./base";
import * as React from "react";
import * as file from "../data/file";
import * as selection from "../data/selection";
import * as types from "../util/types";
import * as stageState from "../data/stage-state";

export interface LayerItemsProps {
  // Properties
  selection: selection.Selection;
  file: file.CueFile;
  layer: file.CueFileLayer;
  layerKey: number;
}

export class LayerItems extends BaseComponent<LayerItemsProps, {}> {

  constructor() {
    super();
  }

  render() {
    const items = this.props.layer.items.map((item, i) => {
      const style: React.CSSProperties = {
        left: (item.timestampMillis / this.props.file.lengthMillis) * 100 + "%"
      };
      return <div key={i} className="item" style={style}></div>
    });
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/layer-items.css"/>
          {items}
        </div>
      </externals.ShadowDOM>
    );
  }

}
