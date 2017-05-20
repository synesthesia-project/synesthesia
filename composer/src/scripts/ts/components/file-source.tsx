import {BaseComponent} from "./base";
import * as React from "react";

import * as file from "../data/file";
import * as func from "../data/functional";
import * as storage from "../util/storage";
import {PlayStateData, PlayState, PlayStateControls, MediaPaused, MediaPlaying} from "../data/play-state";
import {CompanionConnection} from "../util/companion";

export interface FileSourceProps {
  file: func.Maybe<file.CueFile>;
  // Callbacks
  playStateUpdated: (value: PlayState) => void;
  fileLoaded: (file: file.CueFile) => void;
}

interface FileSourceState {
  companion: func.Maybe<CompanionConnection>;
  companionAllowed: boolean;
  description: string;
}

export class FileSource extends BaseComponent<FileSourceProps, FileSourceState> {

  private controls: PlayStateControls;

  constructor() {
    super();
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
    }

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
    })
  }

  public openFile() {
    storage.loadFileAsString().then(fileString => {
      const obj = JSON.parse(fileString);
      const validatedFile = file.validateFile(obj);
      this.props.fileLoaded(validatedFile);
    });
  }

  render() {
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="styles/components/file-source.css"/>
          <input id="file_picker" type="file" onChange={this.loadAudioFile} />
          <label htmlFor="file_picker">Open Audio File</label>
          <audio id="audio"
            onCanPlay={this.updatePlayState}
            onPlaying={this.updatePlayState}
            onPause={this.updatePlayState}
            />
          <button className={
              "connectToCompanion" +
              (this.state.companion.isJust() ? ' pressed' : '') +
              (this.state.companionAllowed ? '' : ' disabled')} onClick={this.toggleCompanion}>
            Connect To Tabs
          </button>
          {this.state.companionAllowed ? null : <span className="companionDisabled" title="Run as a chrome extension to enable.">Tab Connector Disabled</span> }
          <span className="description">{this.state.description}</span>
          <span className="grow"/>
          <button onClick={this.openFile}>Open</button>
          <button className={this.props.file.isJust() ? '' : 'disabled'} onClick={this.saveFile}>Save</button>
        </div>
      </externals.ShadowDOM>
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
      console.error("no files");
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
}
