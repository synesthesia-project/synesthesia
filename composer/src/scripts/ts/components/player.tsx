import {BaseComponent} from './base';
import * as React from 'react';

import * as func from '../data/functional';
import * as stageState from '../data/stage-state';
import {PlayState, PlayStateData, MediaPlaying} from '../data/play-state';
import {displayMillis} from '../display/timing';

import {PlayerBar} from './player-bar';

import Pause = require('react-icons/lib/md/pause');
import Play = require('react-icons/lib/md/play-arrow');

const NO_TIME_STRING = '---';

interface PlayerState {
  /**
   * If the user is currently scrubbing the track, this number will be set to
   * a value in the interval [0, 1] that represents where they are strubbing to.
   */
  scrubbingPosition: func.Maybe<number>;
  elapsedTimeText: string | null;
}

interface PlayerProps {
  // Properties
  playState: PlayState;
  zoom: stageState.ZoomState;
  // Callbacks
  playerRef: (player: HTMLDivElement | null) => void;
}

export class Player extends React.Component<PlayerProps, PlayerState> {

  private updateInterval: any;

  constructor(props: PlayerProps) {
    super(props);
    this.state = {
      scrubbingPosition: func.none(),
      elapsedTimeText: null
    };

    // Bind callbacks & event listeners
    this.playPauseClicked = this.playPauseClicked.bind(this);
    this.updateScrubbingPosition = this.updateScrubbingPosition.bind(this);
  }

  public componentWillReceiveProps(nextProps: PlayerProps) {
    // Only call updateFromPlayState if playState has changed
    if (this.props.playState !== nextProps.playState)
      this.updateFromPlayState(nextProps.playState);
  }

  public render() {
    const playing = this.props.playState.caseOf({
      just: state => state.state.caseOf({
        left: () => false,
        right: () => true
      }),
      none: () => false
    });
    const disabled = this.props.playState.isJust();
    const durationText = this.props.playState.caseOf({
      just: state => displayMillis(state.durationMillis),
      none: () => NO_TIME_STRING
    });
    const className = (disabled ? ' disabled' : '');
    return (
      <externals.ShadowDOM>
        <div className={className} ref={div => this.props.playerRef(div)}>
          <link rel="stylesheet" type="text/css" href="styles/components/player.css"/>
          <span className="play-pause" onClick={this.playPauseClicked}>
            { playing ? <Pause /> : <Play /> }
          </span>
          <span className="elapsed-time">{this.state.elapsedTimeText ? this.state.elapsedTimeText : NO_TIME_STRING}</span>
          <PlayerBar
            playState={this.props.playState}
            scrubbingPosition={this.state.scrubbingPosition}
            zoom={this.props.zoom}
            updateScrubbingPosition={this.updateScrubbingPosition}
          ></PlayerBar>
          <span className="duration">{durationText}</span>
        </div>
      </externals.ShadowDOM>
    );
  }

  private playPauseClicked() {
    this.props.playState.fmap(state => state.controls.toggle());
  }

  private updateFromPlayState(playState: PlayState) {
    clearInterval(this.updateInterval);
    playState.caseOf({
      just: state => {
        state.state.caseOf<void>({
          left: pausedState => this.updateElapsedText(state, pausedState.timeMillis),
          right: playingState => this.initUpdateInterval(state, playingState)
        });
      },
      none: () => {
        this.setState({elapsedTimeText: null});
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
    };
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
    this.setState({elapsedTimeText: displayMillis(elapsed)});
  }

  private updateScrubbingPosition(position: func.Maybe<number>) {
    this.setState({
      scrubbingPosition: position
    });
  }




}
