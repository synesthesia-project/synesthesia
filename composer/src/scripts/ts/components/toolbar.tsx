import * as React from 'react';
import {styled, buttonDisabled, rectButton, buttonPressed} from './styling';

import * as spotifyAuth from '../auth/spotify';
import {SpotifySdk, spotifyWebPlaybackSDKReady} from '../external/spotify-sdk';
import * as file from '../shared/file/file';
import {validateFile} from '../shared/file/file-validation';
import * as func from '../data/functional';
import * as storage from '../util/storage';
import {PlayState} from '../data/play-state';
import {Source} from '../sources/source';
import {CompanionSource} from '../sources/companion-source';
import {FileSource} from '../sources/file-source';
import {SpotifySource} from '../sources/spotify-source';
import {SpotifyLocalSource} from '../sources/spotify-local-source';
import {SpotifyIcon} from './icons/spotify';

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
  source: Source | null;
  companionAllowed: boolean;
  spotifyWebPlaybackSDK: SpotifySdk | null;
}

class Toolbar extends React.Component<FileSourceProps, FileSourceState> {

  constructor(props: FileSourceProps) {
    super(props);
    this.state = {
      source: null,
      companionAllowed: true,
      spotifyWebPlaybackSDK: null
    };

    // Bind callbacks & event listeners
    this.loadAudioFile = this.loadAudioFile.bind(this);
    this.toggleCompanion = this.toggleCompanion.bind(this);
    this.toggleSpotify = this.toggleSpotify.bind(this);
    this.toggleSpotifyLocal = this.toggleSpotifyLocal.bind(this);
    this.saveFile = this.saveFile.bind(this);
    this.openFile = this.openFile.bind(this);
  }

  public componentDidMount() {
    // Automatically connect to extension when starting
    this.toggleCompanion();
    // Check if Spotify SDK is ready and enables
    spotifyWebPlaybackSDKReady.then(spotifyWebPlaybackSDK => this.setState({spotifyWebPlaybackSDK}));
  }

  public saveFile() {
    const filename = this.props.playState.caseOf({
      just: state =>
        state.meta.info ?
        `${state.meta.info.artist} - ${state.meta.info.title}.scue` :
        'song.scue'
      ,
      none: () => 'song.scue'
    });
    this.props.file.fmap(file => {
      storage.saveStringAsFile(JSON.stringify(file), filename);
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
    const source = this.state.source ? this.state.source.sourceKind() : 'none';
    return (
      <div className={this.props.className}>
        <input id="file_picker" type="file" onChange={this.loadAudioFile} />
        <label htmlFor="file_picker"><FolderOpen/> Open Audio File</label>
        <button className={
            'connectToCompanion' +
            (source === 'companion' ? ' pressed' : '') +
            (this.state.companionAllowed ? '' : ' disabled')} onClick={this.toggleCompanion}>
          <Tab/> Connect To Tabs
        </button>
        <button className={source === 'spotify' ? ' pressed' : ''} onClick={this.toggleSpotify}>
          <SpotifyIcon /> Connect To Remote
        </button>
        <button
          className={
            (source === 'spotify-local' ? ' pressed' : '') +
            (this.state.spotifyWebPlaybackSDK !== null ? '' : ' disabled')}
          onClick={this.toggleSpotifyLocal}
          title={
            this.state.spotifyWebPlaybackSDK === null ?
            'Spotify Local Play is not possible when Synesthesia is run as an extension' : undefined}>
          <SpotifyIcon /> Play Locally
        </button>
        <span className="description">{this.getTrackDescription()}</span>
        <span className="grow"/>
        <ConnectionButton file={this.props.file} playState={this.props.playState} />
        <button onClick={this.openFile} title="Open"><FolderOpen/></button>
        <button className={this.props.file.isJust() ? '' : 'disabled'} onClick={this.saveFile} title="Save"><Save/></button>
      </div>
    );
  }

  private getTrackDescription() {
    return this.props.playState.caseOf({
      just: state =>
        state.meta.info ?
        `${state.meta.info.artist} - ${state.meta.info.title}` :
        state.meta.id
      ,
      none: () => null
    });
  }

  private setNewSource(source: Source) {
    if (this.state.source) {
      this.state.source.dispose();
    }
    this.setState({source});
    source.addStateListener(this.props.playStateUpdated);
    source.addDisconnectedListener(() => {
      this.setState({source: null});
      this.props.playStateUpdated(func.none());
    });
  }

  private loadAudioFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const source = new FileSource(ev.target);
    this.setNewSource(source);
    ev.target.value = '';
  }

  private toggleCompanion() {
    if (this.state.source && this.state.source.sourceKind() === 'companion') {
      this.state.source.dispose();
    } else {
      try {
        this.setNewSource(new CompanionSource());
      } catch (e) {
        console.warn(e);
        this.setState({companionAllowed: false});
      }
    }
  }

  private toggleSpotify() {
    if (this.state.source && this.state.source.sourceKind() === 'spotify') {
      this.state.source.dispose();
    } else {
      spotifyAuth.authSpotify(true).then(
        token => {
          this.setNewSource(new SpotifySource(token));
        },
        err => {
          alert(err);
        }
      );
    }
  }

  private toggleSpotifyLocal() {
    if (this.state.spotifyWebPlaybackSDK === null) return;
    if (this.state.source && this.state.source.sourceKind() === 'spotify-local') {
      this.state.source.dispose();
    } else {
      spotifyAuth.authSpotify(true).then(
        token => {
          if (this.state.spotifyWebPlaybackSDK === null) return;
          this.setNewSource(new SpotifyLocalSource(this.state.spotifyWebPlaybackSDK, token));
        },
        err => {
          alert(err);
        }
      );
    }
  }
}

const StyledToolbar = styled(Toolbar)`
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
  }
`;

export {StyledToolbar as Toolbar};

