import {BaseComponent} from "./base";
import * as React from "react";

export interface LayerState { }

export interface LayerProps { }

export class Layer extends BaseComponent<LayerProps, LayerState> {

  constructor() {
    super();
  }

  render() {
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/layer.css"/>
          <div className="side"></div>
          <div className="timeline"></div>
        </div>
      </externals.ShadowDOM>
    );
  }

}
