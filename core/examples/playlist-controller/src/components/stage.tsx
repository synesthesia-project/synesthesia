import * as React from 'react';
import universalParse from 'id3-parser/lib/universal';

import { ControllerEndpoint } from '@synesthesia-project/core/lib/protocols/control';
import { DEFAULT_SYNESTHESIA_PORT } from '@synesthesia-project/core/lib/constants';

import PreciseAudio, { TrackState } from '@synesthesia-project/precise-audio';

interface Meta {
  title: string;
  artist?: string;
  album?: string;
}

interface State {
  tracks: File[];
  meta: Map<File, Meta>;
  trackStates: Map<File, TrackState>;
  now: number;
}

declare global {
  interface Window {
    a: PreciseAudio;
  }
}

export class Stage extends React.Component<Record<string, never>, State> {
  private endpoint: Promise<ControllerEndpoint> | null = null;
  private readonly audio = new PreciseAudio();

  public constructor(props: Record<string, never>) {
    super(props);
    this.state = {
      tracks: [],
      meta: new Map(),
      trackStates: new Map(),
      now: performance.now(),
    };

    this.audio.thresholds.basicModeThresholdSeconds = 10;

    this.loadAudioFile = this.loadAudioFile.bind(this);
    this.updatePlayState = this.updatePlayState.bind(this);
    this.playPause = this.playPause.bind(this);

    this.audio.addEventListener('play', this.updatePlayState);
    this.audio.addEventListener('pause', this.updatePlayState);
    this.audio.addEventListener('trackstateupdate', () => {
      const trackStates = new Map<File, TrackState>();
      for (const track of this.audio.trackStates()) {
        trackStates.set(track.src as File, track);
      }
      this.setState({ trackStates });
    });
    this.audio.addEventListener('ended', () => {
      console.log('ended');
      this.updatePlayState();
    });
    this.audio.addEventListener('next', () => {
      // remove track from list
      this.setState((state) => ({
        tracks: state.tracks.slice(1),
      }));
      this.updatePlayState();
    });
    this.audio.addEventListener('seeked', this.updatePlayState);
    this.audio.addEventListener('error', (event) => {
      console.log('LOADING ERROR!', event.error);
    });

    this.audio.adjustPitchWithPlaybackRate = false;

    window.a = this.audio;

    setInterval(this.updatePlayState, 1000);
    requestAnimationFrame(this.updateNow);
  }

  private getEndpoint(): Promise<ControllerEndpoint> {
    if (!this.endpoint) {
      const endpointPromise = (this.endpoint = new Promise(
        (resolve, reject) => {
          const ws = new WebSocket(
            `ws://localhost:${DEFAULT_SYNESTHESIA_PORT}/control`
          );
          const endpoint = new ControllerEndpoint((msg) =>
            ws.send(JSON.stringify(msg))
          );
          ws.addEventListener('open', () => {
            endpoint.setRequestHandler(async (req) => {
              switch (req.request) {
                case 'pause':
                  this.audio.pause();
                  return { success: true };
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
          ws.addEventListener('error', (err) => {
            if (endpointPromise === this.endpoint) this.endpoint = null;
            reject(err);
          });
          ws.addEventListener('close', () => {
            if (endpointPromise === this.endpoint) this.endpoint = null;
          });
          ws.addEventListener('message', (msg) => {
            endpoint.recvMessage(JSON.parse(msg.data));
          });
        }
      ));

      this.endpoint.catch((err) => {
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
      for (const file of files) {
        this.setState((state) => {
          const s = {
            tracks: state.tracks.slice(),
          };
          s.tracks.push(file);
          this.tracksUpdated(s.tracks);
          return s;
        });

        universalParse(file).then((tag) => {
          if (tag.title) {
            const meta: Meta = {
              title: tag.title,
              artist: tag.artist,
              album: tag.album,
            };
            this.setState((state) => {
              const s = {
                meta: new Map(state.meta),
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
    this.getEndpoint().then((endpoint) => {
      const track = this.audio.tracks()[0] as File | undefined;
      if (!track) return;
      const meta = this.state.meta.get(track);
      endpoint.sendState({
        layers: [
          {
            // TODO: optionally send file path instead of meta
            file: {
              type: 'meta' as const,
              title: meta?.title || track.name,
              artist: meta?.artist,
              album: meta?.album,
              lengthMillis: this.audio.duration * 1000,
            },
            state: this.audio.paused
              ? {
                  type: 'paused',
                  positionMillis: this.audio.currentTimeMillis,
                }
              : {
                  type: 'playing',
                  effectiveStartTimeMillis:
                    performance.now() -
                    this.audio.currentTimeMillis / this.audio.playbackRate,
                  playSpeed: this.audio.playbackRate,
                },
          },
        ],
      });
    });
  }

  private playPause() {
    this.audio.paused ? this.audio.play() : this.audio.pause();
  }

  private skip = () => {
    this.audio.skip();
  };

  private skip2 = () => {
    this.audio.skip(2);
  };

  private timeDisplay(millis: number) {
    return `${Math.round(millis / 100) / 10}s`;
  }

  private updateNow = () => {
    requestAnimationFrame(this.updateNow);
    this.setState({ now: performance.now() });
  };

  public render() {
    const now = this.state.now;
    return (
      <div>
        <div>
          <input
            id="file_picker"
            type="file"
            onChange={this.loadAudioFile}
            multiple
          />
          <button onClick={this.playPause}>Play / Pause</button>
          <button onClick={this.skip}>Skip</button>
          <button onClick={this.skip2}>Skip 2</button>
        </div>
        <p>
          <strong>Tracks:</strong>
        </p>
        <ul>
          {this.state.tracks.map((track, i) => {
            const meta = this.state.meta.get(track);
            const state = this.state.trackStates.get(track);
            return (
              <li key={i}>
                {track.name}
                {meta && (
                  <span>
                    {' - '}
                    {meta.title}
                    {meta.artist && ` - ${meta.artist}`}
                    {meta.album && ` - ${meta.album}`}
                  </span>
                )}
                {state && (
                  <span>
                    {' - '}
                    {state.state !== 'download-scheduled' &&
                      state.state !== 'decoding-scheduled' &&
                      state.state}
                    {state.state === 'ready' && ` (${state.mode})`}
                    {state.state === 'download-scheduled' &&
                      `downloading in: ${this.timeDisplay(
                        state.downloadingAt - now
                      )}`}
                    {state.state === 'decoding-scheduled' &&
                      `decoding in: ${this.timeDisplay(
                        state.decodingAt - now
                      )}`}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
