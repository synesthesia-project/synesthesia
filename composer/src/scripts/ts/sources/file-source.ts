import universalParse from 'id3-parser/lib/universal';

import {Source} from './source';

import {PlayStateDataOnly} from '../data/play-state';
import {just, none, left, right} from '../data/functional';

export class FileSource extends Source {

  private readonly audio: HTMLAudioElement;

  constructor(file: HTMLInputElement) {
    super();
    this.audio = document.createElement('audio');

    this.updatePlayState = this.updatePlayState.bind(this);

    // Initiate listeners
    this.audio.addEventListener('canplay', this.updatePlayState);
    this.audio.addEventListener('playing', this.updatePlayState);
    this.audio.addEventListener('pause', this.updatePlayState);

    // Initiate Audio
    const files = file.files;
    if (files) {
      const file = files[0];
      this.audio.src = URL.createObjectURL(file);
      this.audio.playbackRate = 1;
      universalParse(this.audio.src).then(tag => {
        console.log(tag);
      });
    } else {
      console.error('no files');
    }
  }

  /**
   * Update the play state from the audio element, and send it up.
   */
  private updatePlayState() {
    if (!this.audio) throw new Error('refs not set');
    const audio = this.audio;
    const state: PlayStateDataOnly = {
      durationMillis: this.audio.duration * 1000,
      state: (
        this.audio.paused ?
        left({
          timeMillis: this.audio.currentTime * 1000
        }) :
        right({
          effectiveStartTimeMillis: new Date().getTime() - this.audio.currentTime * 1000
        })
      )
    };
    this.playStateUpdated(just(state));
  }

  public sourceKind(): 'file' {
    return 'file';
  }

  protected disconnect() {
    this.audio.pause();
    this.audio.removeEventListener('canplay', this.updatePlayState);
    this.audio.removeEventListener('playing', this.updatePlayState);
    this.audio.removeEventListener('pause', this.updatePlayState);
  }

  protected controls() {
    return {
      toggle: () => {
        if (this.audio.paused)
          this.audio.play();
        else
          this.audio.pause();
      },
      pause: () =>
        this.audio.pause()
      ,
      goToTime: (timeMillis: number) => {
        this.audio.currentTime = timeMillis / 1000;
      }
    };
  }
}
