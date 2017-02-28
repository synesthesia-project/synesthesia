import {BaseComponent} from "./base";
import * as React from "react";
import * as file from "../data/file";
import * as selection from "../data/selection";
import * as types from "../util/types";
import * as stageState from "../data/stage-state";

export interface LayerVisualizationProps {
  layer: file.AnyLayer;
  positionMillis: number;
}

export class LayerVisualization extends BaseComponent<LayerVisualizationProps, {}> {

  constructor() {
    super();
  }

  render() {
    console.debug("render", this.props.positionMillis);
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/layer-visualization.css"/>
        </div>
      </externals.ShadowDOM>
    );
  }

}
