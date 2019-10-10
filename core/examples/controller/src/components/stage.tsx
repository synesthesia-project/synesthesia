import * as React from 'react';
import universalParse from 'id3-parser/lib/universal';

import { ControllerEndpoint } from '@synesthesia-project/core/lib/protocols/control';
import { DEFAULT_SYNESTHESIA_PORT } from '@synesthesia-project/core/lib/constants';

function loadAudioFile(audio: HTMLAudioElement, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    audio.src = url;
    audio.playbackRate = 1;
    const canPlay = () => {
      resolve();
      audio.removeEventListener('canplay', canPlay);
    };
    audio.addEventListener('canplay', canPlay);
  });
}

export class Stage extends React.Component<{}, {}> {

  private endpoint: Promise<ControllerEndpoint> | null = null;
  private audio: HTMLAudioElement | null = null;
  private meta: {
    title: string, artist?: string, album?: string;
  } | null = null;

  public constructor(props: {}) {
    super(props);
    this.state = {};

    this.loadAudioFile = this.loadAudioFile.bind(this);
    this.updateAudioRef = this.updateAudioRef.bind(this);
    this.updatePlayState = this.updatePlayState.bind(this);
  }

  private getEndpoint(): Promise<ControllerEndpoint> {
    if (!this.endpoint) {
      const endpointPromise = this.endpoint = new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${DEFAULT_SYNESTHESIA_PORT}/control`);
        const endpoint = new ControllerEndpoint(msg => ws.send(JSON.stringify(msg)));
        ws.addEventListener('open', () => {
          endpoint.setRequestHandler(async req => {
            if (!this.audio) return { success: false };
            switch (req.request) {
              case 'pause':
                this.audio.pause();
                return {success: true};
              case 'toggle':
                this.audio.paused ? this.audio.play() : this.audio.pause();
                return { success: true };
              case 'go-to-time':
                this.audio.currentTime = req.positionMillis / 1000;
                return { success: true };
              case 'play-speed':
                this.audio.playbackRate = req.playSpeed;
                this.updatePlayState();
                return { success: true };
            }
          });
          resolve(endpoint);
        });
        ws.addEventListener('error', err => {
          if (endpointPromise === this.endpoint) this.endpoint = null;
          reject(err);
        });
        ws.addEventListener('close', err => {
          if (endpointPromise === this.endpoint) this.endpoint = null;
        });
        ws.addEventListener('message', msg => {
          endpoint.recvMessage(JSON.parse(msg.data));
        });
      });

      this.endpoint.catch(err => {
        console.error(err);
        if (this.endpoint === endpointPromise) {
          // Remove the endpoint so an attempt will be tried again
          this.endpoint = null;
        }
      });
    }

    return this.endpoint;
  }

  private loadAudioFile(ev: React.ChangeEvent<HTMLInputElement>) {
    if (!this.audio) return;
    const files = ev.target.files;
    if (files) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      loadAudioFile(this.audio, url).then(() => {
        if (!this.audio) return;
        universalParse(url).then(tag => {
          if (tag.title) {
            this.meta = {
              title: tag.title,
              artist: tag.artist,
              album: tag.album
            };
            this.updatePlayState();
          }
        });
      });
    } else {
      console.error('no files');
    }
    ev.target.value = '';
  }

  private updatePlayState() {
    console.log(this.meta);
    this.getEndpoint().then(endpoint => {
      if (!this.meta || !this.audio) return;
      endpoint.sendState({layers: [{
        // TODO: optionally send file path instead of meta
        file: {
          type: 'meta' as 'meta',
          title: this.meta.title,
          artist: this.meta.artist,
          album: this.meta.album,
          lengthMillis: this.audio.duration * 1000
        },
        state: this.audio.paused ? {
          type: 'paused',
          positionMillis:
          this.audio.currentTime * 1000
        } : {
          type: 'playing',
          effectiveStartTimeMillis: new Date().getTime() - this.audio.currentTime * 1000 / this.audio.playbackRate,
          playSpeed: this.audio.playbackRate
        }
      }]});
    });
  }

  private updateAudioRef(audio: HTMLAudioElement | null) {
    this.audio = audio;
    if (audio) {
      audio.addEventListener('playing', this.updatePlayState);
      audio.addEventListener('pause', this.updatePlayState);
      audio.addEventListener('seeked', this.updatePlayState);
    }
  }

  public render() {
    return (
      <div>
        <input id="file_picker" type="file" onChange={this.loadAudioFile} />
        <div>
          <audio ref={this.updateAudioRef} controls />
        </div>
      </div>
    );
  }
}
