import * as React from 'react';
import { isEqual } from 'lodash';
import { styled, buttonDisabled, rectButton, buttonPressed } from './styling';

import * as file from '@synesthesia-project/core/lib/file';
import { validateFile } from '@synesthesia-project/core/lib/file/file-validation';

import {
  IntegrationSettings,
  FileState,
} from '../../../../dist/integration/shared';

import * as spotifyAuth from '../auth/spotify';
import {
  SpotifySdk,
  spotifyWebPlaybackSDKReady,
} from '../external/spotify-sdk';
import * as storage from '../util/storage';
import { PlayState } from '../data/play-state';
import { Source } from '../sources/source';
import { FileSource } from '../sources/file-source';
import { IntegrationSource } from '../sources/integration-source';
import { SpotifySource } from '../sources/spotify-source';
import { SpotifyLocalSource } from '../sources/spotify-local-source';
import { SpotifyIcon } from './icons/spotify';
import { FileController, FileControllerState } from './util/file-controller';

import {
  MdSave,
  MdFolderOpen,
  MdUndo,
  MdRedo,
  MdCloudDownload,
  MdCloudUpload,
  MdClose,
} from 'react-icons/md';

import { IntegrationButton } from './integration-button';
import { ConnectionMetadataManager } from '@synesthesia-project/core/lib/protocols/util/connection-metadata';

interface Window {
  integrationSettings?: IntegrationSettings;
}

export interface FileSourceProps {
  className?: string;
  file: {
    id: string;
    file: file.CueFile;
  } | null;
  playState: PlayState;
  // Callbacks
  playStateUpdated: (value: PlayState) => void;
  fileLoaded: (id: string, file: file.CueFile) => void;
}

type Integration = { source: IntegrationSource; fileState: FileState } | null;

interface FileSourceState {
  integration: Integration;
  source: Source | null;
  fileControllerState: FileControllerState;
  spotifyWebPlaybackSDK: SpotifySdk | null;
}

class Toolbar extends React.Component<FileSourceProps, FileSourceState> {
  private readonly undo: () => void;
  private readonly redo: () => void;
  private readonly save: () => void;

  private readonly connectionMetadata = new ConnectionMetadataManager(
    'composer'
  );

  private readonly localFileController: FileController = new FileController(
    (fileControllerState) => this.setState({ fileControllerState }),
    this.connectionMetadata
  );

  constructor(props: FileSourceProps) {
    super(props);

    let integration: Integration = null;
    const w = window as Window;
    if (w.integrationSettings) {
      integration = {
        source: new IntegrationSource(
          w.integrationSettings,
          this.connectionMetadata
        ),
        fileState: {
          canRedo: false,
          canSave: false,
          canUndo: false,
        },
      };
      integration.source.addListener('new-cue-file', (id, file, fileState) => {
        const currentId = this.props.playState
          ? this.props.playState.meta.id
          : null;
        if (currentId === id) {
          this.props.fileLoaded(id, file);
          console.log(fileState);
          this.setState((state) => {
            let integration: Integration = null;
            if (state.integration) {
              integration = {
                source: state.integration.source,
                fileState,
              };
            }
            return { integration };
          });
        } else {
          console.log('Got cue file for unknown song: ', id);
        }
      });
    }

    console.log('integrationSettings', w.integrationSettings);

    this.state = {
      integration,
      source: null,
      spotifyWebPlaybackSDK: null,
      fileControllerState: { state: 'inactive' },
    };

    // Bind callbacks & event listeners
    this.loadAudioFile = this.loadAudioFile.bind(this);
    this.loadAudioFileAsController = this.loadAudioFileAsController.bind(this);
    this.unloadLocalFileController = this.unloadLocalFileController.bind(this);
    this.toggleSpotify = this.toggleSpotify.bind(this);
    this.toggleSpotifyLocal = this.toggleSpotifyLocal.bind(this);
    this.saveFile = this.saveFile.bind(this);
    this.openFile = this.openFile.bind(this);
    this.undo = this.fileAction('undo');
    this.redo = this.fileAction('redo');
    this.save = this.fileAction('save');

    this.connectionMetadata.addListener((data) => {
      console.log('connectionMetadata', data);
    });
  }

  public componentDidMount() {
    // Check if Spotify SDK is ready and enables
    spotifyWebPlaybackSDKReady.then((spotifyWebPlaybackSDK) =>
      this.setState({ spotifyWebPlaybackSDK })
    );
    // Set source to integration if it's set
    if (this.state.integration) {
      this.setNewSource(this.state.integration.source);
    }
  }

  public saveFile() {
    const state = this.props.playState;
    const filename =
      state && state.meta.info
        ? `${state.meta.info.artist} - ${state.meta.info.title}.scue`
        : 'song.scue';
    if (this.props.file) {
      const file: file.CueFile = this.props.file.file;
      storage.saveStringAsFile(JSON.stringify(file), filename);
    }
  }

  public openFile() {
    storage.loadFileAsString().then((fileString) => {
      if (!this.props.playState) return;
      const obj = JSON.parse(fileString);
      const validatedFile = validateFile(obj);
      this.props.fileLoaded(this.props.playState.meta.id, validatedFile);
    });
  }

  public componentWillReceiveProps(nextProps: FileSourceProps): void {
    if (
      nextProps.file !== this.props.file &&
      this.state.integration &&
      !isEqual(this.props.file, nextProps.file)
    ) {
      // Time to send new song info to the server, as it's changed
      const nextFile = nextProps.file;
      const integration = this.state.integration;
      if (nextFile) {
        integration.source.sendCueFile(nextFile.id, nextFile.file);
      }
    }
  }

  public render() {
    const source = this.state.source ? this.state.source.sourceKind() : 'none';
    if (this.state.integration) {
      return (
        <div className={this.props.className}>
          <IntegrationButton
            integration={this.state.integration.source}
            settings={this.state.integration.source.getSettings()}
          />
          <input
            id="file_picker"
            type="file"
            onChange={this.loadAudioFileAsController}
          />
          <label
            htmlFor="file_picker"
            title="Open Audio File"
            className={
              this.state.fileControllerState.state === 'active' ? 'active' : ''
            }
          >
            <MdFolderOpen />
          </label>
          {this.state.fileControllerState.state === 'active' ? (
            <button onClick={this.unloadLocalFileController} title="Close">
              <MdClose />
            </button>
          ) : null}
          <span className="description">{this.getTrackDescription()}</span>
          <span className="grow" />
          <button
            className={this.props.file ? '' : 'disabled'}
            onClick={this.openFile}
            title="Upload"
          >
            <MdCloudUpload />
          </button>
          <button
            className={this.props.file ? '' : 'disabled'}
            onClick={this.saveFile}
            title="Download"
          >
            <MdCloudDownload />
          </button>
          <button
            className={
              this.state.integration.fileState.canUndo ? '' : 'disabled'
            }
            onClick={this.undo}
            title="Undo"
          >
            <MdUndo />
          </button>
          <button
            className={
              this.state.integration.fileState.canRedo ? '' : 'disabled'
            }
            onClick={this.redo}
            title="Redo"
          >
            <MdRedo />
          </button>
          <button
            className={
              this.state.integration.fileState.canSave ? '' : 'disabled'
            }
            onClick={this.save}
            title="Save"
          >
            <MdSave />
          </button>
        </div>
      );
    } else {
      return (
        <div className={this.props.className}>
          <input id="file_picker" type="file" onChange={this.loadAudioFile} />
          <label htmlFor="file_picker">
            <MdFolderOpen />
            <span>Open Audio File</span>
          </label>
          <button
            className={source === 'spotify' ? ' pressed' : ''}
            onClick={this.toggleSpotify}
          >
            <SpotifyIcon /> Connect To Remote
          </button>
          <button
            className={
              (source === 'spotify-local' ? ' pressed' : '') +
              (this.state.spotifyWebPlaybackSDK !== null ? '' : ' disabled')
            }
            onClick={this.toggleSpotifyLocal}
            title={
              this.state.spotifyWebPlaybackSDK === null
                ? 'Spotify Local Play is not possible when Synesthesia is run as an extension'
                : undefined
            }
          >
            <SpotifyIcon /> Play Locally
          </button>
          <span className="description">{this.getTrackDescription()}</span>
          <span className="grow" />
          <button onClick={this.openFile} title="Open">
            <MdFolderOpen />
          </button>
          <button
            className={this.props.file ? '' : 'disabled'}
            onClick={this.saveFile}
            title="Save"
          >
            <MdSave />
          </button>
        </div>
      );
    }
  }

  private getTrackDescription() {
    const state = this.props.playState;
    if (state) {
      return state.meta.info
        ? state.meta.info.artist
          ? `${state.meta.info.artist} - ${state.meta.info.title}`
          : state.meta.info.title
        : 'Unknown Track';
    }
    return null;
  }

  private setNewSource(source: Source) {
    if (this.state.source) {
      this.state.source.dispose();
    }
    this.setState({ source });
    source.addStateListener(this.props.playStateUpdated);
    source.addDisconnectedListener(() => {
      this.setState({ source: null });
      this.props.playStateUpdated(null);
    });
  }

  private loadAudioFileAsController(ev: React.ChangeEvent<HTMLInputElement>) {
    this.localFileController.loadFile(ev.target);
    ev.target.value = '';
  }

  private unloadLocalFileController() {
    this.localFileController.unload();
  }

  private loadAudioFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const source = new FileSource(ev.target);
    this.setNewSource(source);
    ev.target.value = '';
  }

  private toggleSpotify() {
    if (this.state.source && this.state.source.sourceKind() === 'spotify') {
      this.state.source.dispose();
    } else {
      spotifyAuth.authSpotify().then(
        (token) => {
          this.setNewSource(new SpotifySource(token));
        },
        (err) => {
          alert(err);
        }
      );
    }
  }

  private toggleSpotifyLocal() {
    if (this.state.spotifyWebPlaybackSDK === null) return;
    if (
      this.state.source &&
      this.state.source.sourceKind() === 'spotify-local'
    ) {
      this.state.source.dispose();
    } else {
      spotifyAuth.authSpotify().then(
        (token) => {
          if (this.state.spotifyWebPlaybackSDK === null) return;
          this.setNewSource(
            new SpotifyLocalSource(this.state.spotifyWebPlaybackSDK, token)
          );
        },
        (err) => {
          alert(err);
        }
      );
    }
  }

  private fileAction(action: 'undo' | 'redo' | 'save') {
    return () => {
      if (this.props.playState) {
        if (this.state.integration)
          this.state.integration.source.sendRequest({
            type: 'file-action',
            id: this.props.playState.meta.id,
            action,
          });
      }
    };
  }
}

const StyledToolbar = styled(Toolbar)`
  display: block;
  background-color: ${(p) => p.theme.bgLight1};
  border-bottom: 1px solid ${(p) => p.theme.borderDark};
  box-shadow: 0px 1px 8px 0px rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: ${(p) => p.theme.spacingPx / 2}px;

  input {
    width: 0.1px;
    height: 0.1px;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: -1;
    margin: ${(p) => p.theme.spacingPx / 2}px;

    & + label {
      margin: ${(p) => p.theme.spacingPx / 2}px;
      ${rectButton}

      > span {
        margin-left: 5px;
      }

      &.active {
        > svg {
          color: ${(p) => p.theme.hint};
        }
      }
    }
  }

  button {
    ${rectButton}
    margin: ${(p) => p.theme.spacingPx / 2}px;
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

  > span,
  > .flex > span {
    margin: ${(p) => p.theme.spacingPx / 2}px;
    font-size: 14px;
    padding: 0 6px;
    opacity: 0.8;
  }
`;

export { StyledToolbar as Toolbar };
