import {BaseComponent} from "./base";
import * as React from "react";

import * as func from "../data/functional";
import {PlayState, PlayStateData, MediaPlaying} from "../data/play-state";
import {displayMillis} from "../display/timing";

import {PlayerBar} from "./player-bar";

interface PlayerState {
  /**
   * If the user is currently scrubbing the track, this number will be set to
   * a value in the interval [0, 1] that represents where they are strubbing to.
   */
  scrubbingPosition: func.Maybe<number>;
}

interface PlayerProps {
  playState: PlayState;
}

export class Player extends BaseComponent<PlayerProps, PlayerState> {

  private updateInterval: any;

  // Elements
  private _$elapsedTime: JQuery;
  private _$duration: JQuery;

  constructor() {
    super();
    this.state = {
      scrubbingPosition: func.none()
    }

    // Bind callbacks & event listeners
    this.playPauseClicked = this.playPauseClicked.bind(this);
    this.updateScrubbingPosition = this.updateScrubbingPosition.bind(this);
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
          <PlayerBar
            playState={this.props.playState}
            scrubbingPosition={this.state.scrubbingPosition}
            updateScrubbingPosition={this.updateScrubbingPosition}
          ></PlayerBar>
          <span className="duration"></span>
        </div>
      </externals.ShadowDOM>
    );
  }

  private playPauseClicked() {
    this.props.playState.fmap(state => state.controls.toggle());
  }

  private $elapsedTime() {
    if(!this._$elapsedTime)
      this._$elapsedTime = this.$().find('.elapsed-time');
    return this._$elapsedTime;
  }

  private $duration() {
    if (!this._$duration)
      this._$duration = this.$().find('.duration');
    return this._$duration;
  }

  private updatePlayerDisplay() {
    clearInterval(this.updateInterval);
    this.props.playState.caseOf({
      just: state => {
        this.$reactRoot().removeClass('disabled');
        this.$duration().text(displayMillis(state.durationMillis));
        state.state.caseOf<void>({
          left: pausedState => this.updateElapsedText(state, pausedState.timeMillis),
          right: playingState => this.initUpdateInterval(state, playingState)
        });
      },
      none: () => {
        this.$reactRoot().addClass('disabled');
        this.$elapsedTime().text('---');
        this.$duration().text('---');
      }
    });
  }

  private initUpdateInterval(playState: PlayStateData, playingState: MediaPlaying) {
    const updater = () => {
      // Check if scrubbing
      const elapsed = this.state.scrubbingPosition.caseOf({
        just: scrubbingPosition => playState.durationMillis * scrubbingPosition,
        none: () => new Date().getTime() - playingState.effectiveStartTimeMillis
      });
      this.updateElapsedText(playState, elapsed);
    }
    // Pick a nice interval that will show the milliseconds updating
    this.updateInterval = setInterval(updater, 16);
    updater();
  }

  /**
   * Update elapsed text, but if scrubbing display that time instead
   */
  private updateElapsedText(playState: PlayStateData, elapsed: number) {
    elapsed = this.state.scrubbingPosition.caseOf({
      just: scrubbingPosition => playState.durationMillis * scrubbingPosition,
      none: () => elapsed
    });
    this.$elapsedTime().text(displayMillis(elapsed));
  }

  private updateScrubbingPosition(position: func.Maybe<number>) {
    this.setState({
      scrubbingPosition: position
    });
  }




}
