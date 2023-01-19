import * as React from 'react';
import universalParse from 'id3-parser/lib/universal';

import { ControllerEndpoint } from '@synesthesia-project/core/lib/protocols/control';
import { DEFAULT_SYNESTHESIA_PORT } from '@synesthesia-project/core/lib/constants';

import PreciseAudio from '@synesthesia-project/precise-audio';
import { ConnectionMetadataManager } from '../../../../lib/protocols/util/connection-metadata';

declare global {
  interface Window {
    a: PreciseAudio;
  }
}

export class Stage extends React.Component<
  Record<string, never>,
  Record<string, never>
> {
  private endpoint: Promise<ControllerEndpoint> | null = null;
  private readonly audio = new PreciseAudio();
  private meta: {
    title: string;
    artist?: string;
    album?: string;
  } | null = null;

  public constructor(props: Record<string, never>) {
    super(props);
    this.state = {};

    this.audio.addEventListener('play', this.updatePlayState);
    this.audio.addEventListener('pause', this.updatePlayState);
    this.audio.addEventListener('ended', this.updatePlayState);
    this.audio.addEventListener('seeked', this.updatePlayState);
    this.audio.addEventListener('error', (event) => {
      console.log('LOADING ERROR!', event.error);
    });

    this.audio.adjustPitchWithPlaybackRate = false;

    window.a = this.audio;

    setInterval(this.updatePlayState, 1000);
  }

  private getEndpoint(): Promise<ControllerEndpoint> {
    if (!this.endpoint) {
      const endpointPromise = (this.endpoint = new Promise(
        (resolve, reject) => {
          const ws = new WebSocket(
            `ws://localhost:${DEFAULT_SYNESTHESIA_PORT}/control`
          );
          const endpoint = new ControllerEndpoint(
            (msg) => ws.send(JSON.stringify(msg)),
            {
              connectionType: 'controller:upstream',
              connectionMetadata: new ConnectionMetadataManager(
                'core-example-controller'
              ),
            }
          );
          ws.addEventListener('open', () => {
            endpoint.setRequestHandler(async (req) => {
              switch (req.type) {
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

  private loadAudioFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (files) {
      const file = files[0];
      const parseID3 = () => {
        universalParse(file).then((tag) => {
          if (tag.title) {
            this.meta = {
              title: tag.title,
              artist: tag.artist,
              album: tag.album,
            };
            this.updatePlayState();
          }
        });
      };
      this.audio.updateTracks(file);
      this.audio.addEventListener('canplaythrough', parseID3);
    } else {
      console.error('no files');
    }
    ev.target.value = '';
  };

  private updatePlayState = () => {
    console.log(this.meta);
    this.getEndpoint().then((endpoint) => {
      if (!this.meta) return;
      endpoint.sendState({
        layers: [
          {
            // TODO: optionally send file path instead of meta
            file: {
              type: 'meta' as const,
              title: this.meta.title,
              artist: this.meta.artist,
              album: this.meta.album,
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
  };

  private playPause = () => {
    this.audio.paused ? this.audio.play() : this.audio.pause();
  };

  public render() {
    return (
      <div>
        <input id="file_picker" type="file" onChange={this.loadAudioFile} />
        <div>
          <button onClick={this.playPause}>Play / Pause</button>
        </div>
      </div>
    );
  }
}
