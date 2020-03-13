import * as React from 'react';
import universalParse from 'id3-parser/lib/universal';

import { ControllerEndpoint } from '@synesthesia-project/core/lib/protocols/control';
import { DEFAULT_SYNESTHESIA_PORT } from '@synesthesia-project/core/lib/constants';

import PreciseAudio from '@synesthesia-project/precise-audio';

interface Meta {
  title: string;
  artist?: string;
  album?: string;
}


interface State {
  tracks: File[];
  meta: Map<File, Meta>;
}

export class Stage extends React.Component<{}, State> {

  private endpoint: Promise<ControllerEndpoint> | null = null;
  private readonly audio = new PreciseAudio();

  public constructor(props: {}) {
    super(props);
    this.state = {
      tracks: [],
      meta: new Map()
    };

    this.loadAudioFile = this.loadAudioFile.bind(this);
    this.updatePlayState = this.updatePlayState.bind(this);
    this.playPause = this.playPause.bind(this);

    this.audio.addEventListener('play', this.updatePlayState);
    this.audio.addEventListener('pause', this.updatePlayState);
    this.audio.addEventListener('ended', this.updatePlayState);
    this.audio.addEventListener('next', () => {
      console.log('next track!', this.audio.tracks());
    });
    this.audio.addEventListener('seeked', this.updatePlayState);
    this.audio.addEventListener('error', event => {
      console.log('LOADING ERROR!', event.error);
    });

    this.audio.adjustPitchWithPlaybackRate = false;

    (window as any).a = this.audio;

    setInterval(this.updatePlayState, 1000);
  }

  private getEndpoint(): Promise<ControllerEndpoint> {
    if (!this.endpoint) {
      const endpointPromise = this.endpoint = new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${DEFAULT_SYNESTHESIA_PORT}/control`);
        const endpoint = new ControllerEndpoint(msg => ws.send(JSON.stringify(msg)));
        ws.addEventListener('open', () => {
          endpoint.setRequestHandler(async req => {
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
    const files = ev.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.setState(state => {
          const s = {
            tracks: state.tracks.slice()
          };
          s.tracks.push(file);
          this.tracksUpdated(s.tracks);
          return s;
        });

        universalParse(file).then(tag => {
          if (tag.title) {
            const meta: Meta = {
              title: tag.title,
              artist: tag.artist,
              album: tag.album
            };
            this.setState(state => {
              const s = {
                meta: new Map(state.meta)
              };
              s.meta.set(file, meta);
              this.updatePlayState();
              return s;
            });
          }
        });
      }
    } else {
      console.error('no files');
    }
    ev.target.value = '';
  }

  /**
   * Called when a user action has triggered the list of tracks to change
   */
  private tracksUpdated(tracks: File[]) {
    console.log('list of tracks has been updated');
    // TODO: send updated list to precise audio
    // this.audio.loadTrack(file); ...
    this.audio.updateTracks(...tracks);
    console.log('tracks', this.audio.tracks());
  }

  private updatePlayState() {
    this.getEndpoint().then(endpoint => {
      const track = this.state.tracks[0];
      if (!track) return;
      const meta = this.state.meta.get(track);
      if (!meta) return;
      endpoint.sendState({layers: [{
        // TODO: optionally send file path instead of meta
        file: {
          type: 'meta' as 'meta',
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          lengthMillis: this.audio.duration * 1000
        },
        state: this.audio.paused ? {
          type: 'paused',
          positionMillis: this.audio.currentTimeMillis
        } : {
          type: 'playing',
            effectiveStartTimeMillis: performance.now() -
            this.audio.currentTimeMillis / this.audio.playbackRate,
          playSpeed: this.audio.playbackRate
        }
      }]});
    });
  }

  private playPause() {
    this.audio.paused ? this.audio.play() : this.audio.pause();
  }

  public render() {
    return (
      <div>
        <div>
          <input id="file_picker" type="file" onChange={this.loadAudioFile} multiple />
          <button onClick={this.playPause}>Play / Pause</button>
        </div>
        <p><strong>Tracks:</strong></p>
        <ul>
          {this.state.tracks.map((track, i) => {
            const meta = this.state.meta.get(track);
            return (
              <li key={i}>
                {track.name}
                {meta && (<span>
                  {' - '}
                  {meta.title}
                  {meta.artist && ` - ${meta.artist}`}
                  {meta.album && ` - ${meta.album}`}
                </span>)}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
