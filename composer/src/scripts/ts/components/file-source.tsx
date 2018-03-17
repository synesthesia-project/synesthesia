import {BaseComponent} from './base';
import * as React from 'react';
import {styled, buttonDisabled, rectButton, buttonPressed} from './styling';

import * as spotify from '../auth/spotify';
import * as file from '../shared/file/file';
import {validateFile} from '../shared/file/file-validation';
import * as func from '../data/functional';
import * as storage from '../util/storage';
import {PlayStateData, PlayState, PlayStateControls, MediaPaused, MediaPlaying} from '../data/play-state';
import {getSpotifySource} from '../sources/spotify-source';
import {CompanionConnection} from '../util/companion';

import Save = require('react-icons/lib/md/save');
import FolderOpen = require('react-icons/lib/md/folder-open');
import Tab = require('react-icons/lib/md/tab');

import {ConnectionButton} from './connection-button';

export interface FileSourceProps {
  className?: string;
  file: func.Maybe<file.CueFile>;
  playState: PlayState;
  // Callbacks
  playStateUpdated: (value: PlayState) => void;
  fileLoaded: (file: file.CueFile) => void;
}

interface FileSourceState {
  companion: func.Maybe<CompanionConnection>;
  companionAllowed: boolean;
  description: string;
}

class FileSource extends BaseComponent<FileSourceProps, FileSourceState> {

  private controls: PlayStateControls;

  constructor(props: FileSourceProps) {
    super(props);
    this.state = {
      companion: func.none(),
      companionAllowed: true,
      description: ''
    };

    // Initialise Controls
    this.controls = {
      toggle: () => {
        const audio = this.$audio();
        if (audio.paused)
          audio.play();
        else
          audio.pause();
      },
      pause: () => {
        this.$audio().pause();
      },
      goToTime: (timeMillis: number) => {
        this.$audio().currentTime = timeMillis / 1000;
      }
    };

    // Bind callbacks & event listeners
    this.loadAudioFile = this.loadAudioFile.bind(this);
    this.updatePlayState = this.updatePlayState.bind(this);
    this.toggleCompanion = this.toggleCompanion.bind(this);
    this.saveFile = this.saveFile.bind(this);
    this.openFile = this.openFile.bind(this);
  }

  public componentDidMount() {
    // Automatically connect to extension when starting
    this.toggleCompanion();
  }

  public saveFile() {
    this.props.file.fmap(file => {
      storage.saveStringAsFile(JSON.stringify(file), 'song.scue');
    });
  }

  public openFile() {
    storage.loadFileAsString().then(fileString => {
      const obj = JSON.parse(fileString);
      const validatedFile = validateFile(obj);
      this.props.fileLoaded(validatedFile);
    });
  }

  public render() {
    return (
      <div className={this.props.className}>
        <input id="file_picker" type="file" onChange={this.loadAudioFile} />
        <label htmlFor="file_picker"><FolderOpen/> Open Audio File</label>
        <audio id="audio"
          onCanPlay={this.updatePlayState}
          onPlaying={this.updatePlayState}
          onPause={this.updatePlayState}
          />
        <button className={
            'connectToCompanion' +
            (this.state.companion.isJust() ? ' pressed' : '') +
            (this.state.companionAllowed ? '' : ' disabled')} onClick={this.toggleCompanion}>
          <Tab/> Connect To Tabs
        </button>
        <button className={'connectToSpotify'} onClick={this.connectToSpotify}>
          Connect To Spotify
        </button>
        {this.state.companionAllowed ?
          null :
          <span className="companionDisabled" title="Run as a chrome extension to enable.">Tab Connector Disabled</span>
        }
        <span className="description">{this.state.description}</span>
        <span className="grow"/>
        <ConnectionButton file={this.props.file} playState={this.props.playState} />
        <button onClick={this.openFile} title="Open"><FolderOpen/></button>
        <button className={this.props.file.isJust() ? '' : 'disabled'} onClick={this.saveFile} title="Save"><Save/></button>
      </div>
    );
  }

  private $fileInput() {
    return this.$().find('input').get(0) as HTMLInputElement;
  }

  private $audio() {
    return this.$().find('audio').get(0) as HTMLAudioElement;
  }

  private loadAudioFile() {
    const files = this.$fileInput().files;
    if (files) {
      const file = files[0];
      const audio = this.$audio();
      audio.src = URL.createObjectURL(file);
      audio.playbackRate = 1;
    } else {
      console.error('no files');
    }
  }

  /**
   * Update the play state from the audio element, and send it up.
   */
  private updatePlayState() {
    const audio = this.$audio();
    const state: PlayStateData = {
      durationMillis: audio.duration * 1000,
      state: (
        audio.paused ?
        func.left<MediaPaused, MediaPlaying>({
          timeMillis: audio.currentTime * 1000
        }) :
        func.right<MediaPaused, MediaPlaying>({
          effectiveStartTimeMillis: new Date().getTime() - audio.currentTime * 1000
        })
      ),
      controls: this.controls
    };
    this.clearCompanion();
    this.props.playStateUpdated(func.just(state));
  }

  private toggleCompanion() {
    this.state.companion.caseOf({
      just: companion => companion.disconnect(),
      none: () => {
        let failed = false;
        const companion = new CompanionConnection(
          // On Disconnect
          () => {
            this.setState({companion: func.none(), description: ''});
            this.props.playStateUpdated(func.none());
          },
          // On State Changed
          state => {
            // Update play state
            this.props.playStateUpdated(state.fmap(state => {
              const playState: PlayStateData = {
                durationMillis: state.length,
                state: state.state === 'paused' ?
                  func.left({timeMillis: state.stateValue}) :
                  func.right({effectiveStartTimeMillis: state.stateValue}),
                controls: companion.getControls()
              };
              return playState;
            }));
            // Update description
            this.setState({description: state.caseOf({
              just: state => state.title + ' - ' + state.artist,
              none: () => ''
            })});
          },
          // Called when the companion failed to initialise because it
          // couldn't connect to extension
          () => failed = true
        );
        if (failed) {
          this.setState({companionAllowed: false});
        } else {
          this.setState({companion: func.just(companion)});
        }
      }
    });
  }

  private clearCompanion() {
    this.state.companion.fmap(companion => companion.disconnect());
  }

  private connectToSpotify() {
    spotify.authSpotify(true).then(
      token => {
        console.log('got token', token);
        getSpotifySource(token);
      },
      err => {
        alert(err);
      }
    );
  }
}

const StyledFileSource = styled(FileSource)`
  display: block;
  background-color: ${p => p.theme.bgLight1};
  border-bottom: 1px solid ${p => p.theme.borderDark};
  box-shadow: 0px 1px 8px 0px rgba(0,0,0,0.3);
  z-index:100;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: ${p => p.theme.spacingPx / 2}px;

  input {
  	width: 0.1px;
  	height: 0.1px;
  	opacity: 0;
  	overflow: hidden;
  	position: absolute;
  	z-index: -1;
    margin: ${p => p.theme.spacingPx / 2}px;

    & + label {
      margin: ${p => p.theme.spacingPx / 2}px;
      ${rectButton}

      > svg {
        margin-right: 5px;
      }
    }
  }

  button {
    ${rectButton}
    margin: ${p => p.theme.spacingPx / 2}px;
    outline: none;

    &.pressed {
      ${buttonPressed}
    }

    &.disabled {
      ${buttonDisabled}

      &.connectToCompanion {
        display: none;
      }
    }

    &.connectToCompanion {
      > svg {
        margin-right: 5px;
      }
    }
  }

  > .grow {
    flex-grow: 1;
  }

  > span, > .flex > span {
    margin: ${p => p.theme.spacingPx / 2}px;
    font-size: 14px;
    padding: 0 6px;
    opacity: 0.8;

    &.companionDisabled {
      color: ${p => p.theme.colorRed};
    }
  }
`;

export {StyledFileSource as FileSource};

