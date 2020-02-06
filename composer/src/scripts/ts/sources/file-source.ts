import universalParse from 'id3-parser/lib/universal';

import {Source} from './source';

import {PlayStateDataOnly, PlayStateTrackMeta} from '../data/play-state';

export class FileSource extends Source {

  private readonly audio: HTMLAudioElement;
  private meta: PlayStateTrackMeta;

  constructor(file: HTMLInputElement) {
    super();
    this.audio = document.createElement('audio');
    this.meta = {
      id: file.value
    };

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
        if (tag.artist && tag.title) {
          this.meta.info = {
            artist: tag.artist,
            title: tag.title
          };
          this.updatePlayState();
        }
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
    const state: PlayStateDataOnly = {
      durationMillis: this.audio.duration * 1000,
      state: (
        this.audio.paused ?
        {
          type: 'paused',
          positionMillis: this.audio.currentTime * 1000
        } :
        {
          type: 'playing',
          playSpeed: this.audio.playbackRate,
          effectiveStartTimeMillis: performance.now() - this.audio.currentTime * 1000
        }
      ),
      meta: this.meta
    };
    this.playStateUpdated(state);
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
      },
      setPlaySpeed: (playSpeed: number) => {
        this.audio.playbackRate = playSpeed;
        this.updatePlayState();
      }
    };
  }
}
