import {BaseComponent} from "./base";
import * as React from "react";

import * as util from "../util/util";

import * as func from "../data/functional";
import * as stageState from "../data/stage-state";
import {PlayState, PlayStateData, MediaPlaying} from "../data/play-state";

export interface PlayerBarState {
  /**
   * True iff the user is currently dragging the button
   */
  dragging: boolean;
}

export interface PlayerBarProps {
  // Properties
  playState: PlayState;
  scrubbingPosition: func.Maybe<number>;
  zoom: stageState.ZoomState;
  // Callbacks
  updateScrubbingPosition: (position: func.Maybe<number>) => void;
}

export class PlayerBar extends BaseComponent<PlayerBarProps, PlayerBarState> {

  private updateInterval: any;

  // Elements
  private _$bar: JQuery;
  private _$fill: JQuery;
  private _$button: JQuery;

  constructor() {
    super();
    this.state = {
      dragging: false
    };

    // Bind callbacks & event listeners
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
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
          <link rel="stylesheet" type="text/css" href="styles/components/player-bar.css"/>
          <div className="zoom" style={{
            left: this.props.zoom.startPoint * 100 + '%',
            right: (1 - this.props.zoom.endPoint) * 100 + '%'
            }}>
          </div>
          <div className="bar"><div className="fill"></div></div>
          <div className="button"></div>
          <div className="hit"
            onMouseDown={this.onMouseDown}
            onMouseMove={this.onMouseMove}
            onMouseUp={this.onMouseUp}
            onMouseOut={this.onMouseUp}
          ></div>
        </div>
      </externals.ShadowDOM>
    );
  }

  private calculateBarPosition(e: React.MouseEvent<HTMLDivElement>) {
    const $bar = this.$bar();
    const position = (e.pageX - $bar.offset().left) / $bar.width();
    return util.restrict(position, 0, 1);
  }

  private onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    // Only allow dragging if playing
    if (this.props.playState.isNone())
      return;
    e.preventDefault();
    this.setState({
      dragging: true
    });
    this.$reactRoot().addClass('dragging');
    this.props.updateScrubbingPosition(func.just(this.calculateBarPosition(e)));
  }

  private onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!this.state.dragging)
      return;
    e.preventDefault();
    this.props.updateScrubbingPosition(func.just(this.calculateBarPosition(e)));
  }

  private onMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (!this.state.dragging)
      return;
    e.preventDefault();
    const position = this.calculateBarPosition(e);
    this.props.playState.fmap(state => {
      state.controls.goToTime(state.durationMillis * position);
    });
    this.setState({
      dragging: false
    });
    this.$reactRoot().removeClass('dragging');
    this.props.updateScrubbingPosition(func.none());
  }

  private $bar() {
    if (!this._$bar)
      this._$bar = this.$().find('.bar');
    return this._$bar;
  }

  private $fill() {
    if (!this._$fill)
      this._$fill = this.$().find('.fill');
    return this._$fill;
  }

  private $button() {
    if (!this._$button)
      this._$button = this.$().find('.button');
    return this._$button;
  }

  private updatePlayerDisplay() {
    clearInterval(this.updateInterval);
    this.props.playState.caseOf({
      just: state => {
        this.$reactRoot().removeClass('disabled');
        state.state.caseOf<void>({
          left: pausedState => this.updateBarPosition(pausedState.timeMillis / state.durationMillis),
          right: playingState => this.initUpdateInterval(state, playingState)
        });
      },
      none: () => {
        this.$reactRoot().addClass('disabled');
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

  private updateBarPosition(trackPosition: number) {
    // Use scrubbing position if set for button
    let buttonPosition = this.props.scrubbingPosition.caseOf({
      just: scrubbingPosition => scrubbingPosition,
      none: () => trackPosition
    });
    this.$fill().css('width', (util.restrict(trackPosition, 0, 1) * 100) + '%');
    this.$button().css('left', (util.restrict(buttonPosition, 0, 1) * 100) + '%');
  }



}
