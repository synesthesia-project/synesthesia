import universalParse from 'id3-parser/lib/universal';

import { DEFAULT_SYNESTHESIA_PORT } from '@synesthesia-project/core/lib/constants';
import { ControllerEndpoint } from '@synesthesia-project/core/lib/protocols/control';
import { ConnectionMetadataManager } from '@synesthesia-project/core/lib/protocols/util/connection-metadata';
import { IntegrationSettings } from '../../../../../dist/integration/shared';

export type FileControllerState =
  | {
      state: 'active';
      volume: number;
    }
  | {
      state: 'inactive';
    };

function loadAudioFile(audio: HTMLAudioElement, url: string): Promise<void> {
  return new Promise((resolve, _reject) => {
    audio.src = url;
    audio.playbackRate = 1;
    const canPlay = () => {
      resolve();
      audio.removeEventListener('canplay', canPlay);
    };
    audio.addEventListener('canplay', canPlay);
  });
}

export class FileController {
  private readonly audio: HTMLAudioElement = document.createElement('audio');

  private endpoint: Promise<ControllerEndpoint> | null = null;
  private meta: {
    title: string;
    artist?: string;
    album?: string;
  } | null = null;

  constructor(
    private readonly integration: IntegrationSettings | null,
    private readonly listener: (state: FileControllerState) => void,
    private readonly connectionMetadata: ConnectionMetadataManager
  ) {
    this.listener = listener;
    this.connectionMetadata = connectionMetadata;
    this.audio = document.createElement('audio');

    this.audio.addEventListener('playing', this.updatePlayState);
    this.audio.addEventListener('pause', this.updatePlayState);
    this.audio.addEventListener('seeked', this.updatePlayState);
    this.audio.addEventListener('volumechange', this.updateListener);
  }

  public loadFile(file: HTMLInputElement) {
    const files = file.files;
    if (files) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      loadAudioFile(this.audio, url).then(() => {
        if (!this.audio) return;
        this.updateListener();
        universalParse(url).then((tag) => {
          if (tag.title) {
            this.meta = {
              title: tag.title,
              artist: tag.artist,
              album: tag.album,
            };
            this.updatePlayState();
          }
        });
      });
    } else {
      console.error('no files');
    }
  }

  public unload() {
    this.audio.removeAttribute('src');
    this.getEndpoint().then((endpoint) => {
      endpoint.sendState({ layers: [] });
    });
    this.updateListener();
  }

  private getEndpoint(): Promise<ControllerEndpoint> {
    if (!this.endpoint) {
      const endpointPromise = (this.endpoint = new Promise(
        (resolve, reject) => {
          const ws = new WebSocket(
            this.integration?.controllerWsUrl ||
              `ws://localhost:${DEFAULT_SYNESTHESIA_PORT}/control`
          );
          let endpoint: ControllerEndpoint | null = null;
          ws.addEventListener('open', () => {
            endpoint = new ControllerEndpoint(
              (msg) => ws.send(JSON.stringify(msg)),
              {
                connectionType: 'controller:upstream',
                connectionMetadata: this.connectionMetadata,
              }
            );
            endpoint.setRequestHandler(async (req) => {
              if (!this.audio) return { success: false };
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
            endpoint?.closed();
          });
          ws.addEventListener('close', (_err) => {
            if (endpointPromise === this.endpoint) this.endpoint = null;
            endpoint?.closed();
          });
          ws.addEventListener('message', (msg) => {
            endpoint?.recvMessage(JSON.parse(msg.data));
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

  private updateListener = () => {
    if (this.audio.src) {
      console.log(this.audio.src);
      this.listener({ state: 'active', volume: this.audio.volume });
    } else {
      this.listener({ state: 'inactive' });
    }
  };

  private updatePlayState = () => {
    this.getEndpoint().then((endpoint) => {
      if (!this.meta || !this.audio) return;
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
                  positionMillis: this.audio.currentTime * 1000,
                }
              : {
                  type: 'playing',
                  effectiveStartTimeMillis:
                    performance.now() -
                    (this.audio.currentTime * 1000) / this.audio.playbackRate,
                  playSpeed: this.audio.playbackRate,
                },
          },
        ],
      });
    });
  };
}
