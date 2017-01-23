import {BaseComponent} from "./base";
import * as React from "react";

import * as func from "../data/functional";
import {PlayStateData, PlayState, PlayStateControls, MediaPaused, MediaPlaying} from "../data/play-state";

export interface FileSourceProps {
  playStateUpdated: (value: PlayState) => void;
}

export class FileSource extends BaseComponent<FileSourceProps, {}> {

  private controls: PlayStateControls;

  constructor() {
    super();

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
  }

  render() {
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/file-source.css"/>
          <input id="file_picker" type="file" onChange={this.loadAudioFile} />
          <label htmlFor="file_picker">Open Audio File</label>
          <audio id="audio"
            onCanPlay={this.updatePlayState}
            onPlaying={this.updatePlayState}
            onPause={this.updatePlayState}
            />
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
    this.props.playStateUpdated(func.just(state));
  }
}
