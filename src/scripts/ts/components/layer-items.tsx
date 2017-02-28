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
  layer: file.AnyLayer;
  layerKey: number;
}

export class LayerItems extends BaseComponent<LayerItemsProps, {}> {

  constructor() {
    super();
  }

  render() {
    const items = this.props.layer.events.map((item, i) => {
      let length = 0;
      if (item.states.length !== 0) {
        // Get length of item by last state
        length = item.states[item.states.length - 1].millisDelta;
      } else if (file.isPercussionLayer(this.props.layer)) {
        // Get default length of items
        length = this.props.layer.settings.defaultLengthMillis;
      }
      const style: React.CSSProperties = {
        left: (item.timestampMillis / this.props.file.lengthMillis) * 100 + "%",
        width: (length / this.props.file.lengthMillis) * 100 + "%",
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
