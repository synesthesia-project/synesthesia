import * as React from "react";
import * as ReactDOM from "react-dom";

import * as func from "../data/functional";
import {PlayState, PlayStateData, MediaPlaying} from "../data/play-state";

export interface PlayerBarProps {
  playState: PlayState;
}

export class PlayerBar extends React.Component<PlayerBarProps, {}> {

  private updateInterval: any;

  // Elements
  private _fillElement: JQuery;
  private _buttonElement: JQuery;

  constructor() {
    super();

    // Bind callbacks & event listeners
  }

  componentDidMount() {
    this.updatePlayerDisplay();
  }

  componentDidUpdate() {
    this.updatePlayerDisplay();
  }

  render() {
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/player-bar.css"/>
          <div className="bar"><div className="fill"></div></div>
          <div className="button"><div className="hit"></div></div>
        </div>
      </externals.ShadowDOM>
    );
  }

  private $() {
    return $((ReactDOM.findDOMNode(this) as any).shadowRoot);
  }

  private fillElement() {
    if (!this._fillElement)
      this._fillElement = this.$().find('.fill');
    return this._fillElement;
  }

  private buttonElement() {
    if (!this._buttonElement)
      this._buttonElement = this.$().find('.button');
    return this._buttonElement;
  }

  private updatePlayerDisplay() {
    clearInterval(this.updateInterval);
    this.props.playState.caseOf({
      just: state => {
        state.state.caseOf<void>({
          left: pausedState => this.updateBarPosition(pausedState.timeMillis / state.durationMillis),
          right: playingState => this.initUpdateInterval(state, playingState)
        });
      },
      none: () => {
        // TODO: Gray out controls
        this.updateBarPosition(0);
      }
    });
  }

  private initUpdateInterval(playState: PlayStateData, playingState: MediaPlaying) {
    const updater = () => {
      const now = new Date().getTime();
      const elapsed = now - playingState.effectiveStartTimeMillis;
      this.updateBarPosition(elapsed / playState.durationMillis);
    }
    // Pick a nice interval that will show the milliseconds updating
    this.updateInterval = setInterval(updater, 16);
    updater();
  }

  private updateBarPosition(position: number) {
    // Bound Position between [0, 1]
    position = Math.max(0, Math.min(1, position))
    this.fillElement().css('width', (position * 100) + '%');
    this.buttonElement().css('left', (position * 100) + '%');
  }



}
