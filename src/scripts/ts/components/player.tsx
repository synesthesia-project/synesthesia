import * as React from "react";
import * as ReactDOM from "react-dom";

import * as func from "../data/functional";
import {PlayState, MediaPlaying} from "../data/play-state";
import {displayMillis} from "../display/timing";

export interface PlayerProps {
  playState: PlayState;
}

export class Player extends React.Component<PlayerProps, {}> {

  private updateInterval: any;

  constructor() {
    super();

    // Bind callbacks & event listeners
    this.playPauseClicked = this.playPauseClicked.bind(this);
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
          <link rel="stylesheet" type="text/css" href="dist/styles/components/player.css"/>
          <span className="play-pause" onClick={this.playPauseClicked}></span>
          <span className="elapsed-time"></span>
          <div className="bar"></div>
          <span className="duration"></span>
        </div>
      </externals.ShadowDOM>
    );
  }

  private playPauseClicked() {
    this.props.playState.fmap(state => state.controls.toggle());
  }

  private $() {
    return $((ReactDOM.findDOMNode(this) as any).shadowRoot);
  }

  private elapsedTimeElement() {
    return this.$().find('.elapsed-time');
  }

  private durationElement() {
    return this.$().find('.duration');
  }

  private updatePlayerDisplay() {
    clearInterval(this.updateInterval);
    this.props.playState.caseOf({
      just: state => {
        this.durationElement().text(displayMillis(state.durationMillis));
        state.state.caseOf<void>({
          left: pausedState => this.elapsedTimeElement().text(displayMillis(pausedState.timeMillis)),
          right: playingState => this.initUpdateInterval(playingState)
        });
      },
      none: () => {
        // Gray out controls
        this.elapsedTimeElement().text('---');
        this.durationElement().text('---');
      }
    });
  }

  private initUpdateInterval(playingState: MediaPlaying) {
    const updater = () => {
      const now = new Date().getTime();
      const elapsed = now - playingState.effectiveStartTimeMillis;
      this.elapsedTimeElement().text(displayMillis(elapsed));
    }
    // Pick a nice interval that will show the milliseconds updating
    this.updateInterval = setInterval(updater, 53);
    updater();
  }



}
