import * as Spotify from 'spotify-web-api-js';

import { Source } from './source';

const UPDATE_INTERVAL_MS = 2000;

// HACK: this is required to allow us to have a type for an instance of the Spotify API
const s = new Spotify();

// Unimplemented Methods
interface ExtendedSpotifyApi {
  getMyCurrentPlaybackState(): Promise<{
    is_playing: boolean;
    progress_ms: number;
    timestamp: number;
    item?: {
      id: string;
      name: string;
      duration_ms: number;
      album: {
        name: string;
      };
      artists: {
        name: string;
      }[];
    };
  }>;
  play(options: Record<string, never>): Promise<unknown>;
  pause(options: Record<string, never>): Promise<unknown>;
  seek(positionMs: number, options: Record<string, never>): Promise<unknown>;
}
type SpotifyApi = typeof s & ExtendedSpotifyApi;

export class SpotifySource extends Source {
  private api: SpotifyApi;

  private interval: number;

  constructor(token: string) {
    super();

    this.update = this.update.bind(this);

    this.api = new Spotify() as SpotifyApi;
    this.api.setAccessToken(token);
    this.interval = window.setInterval(this.update, UPDATE_INTERVAL_MS);
    this.update();
  }

  private update() {
    this.api.getMyCurrentPlaybackState().then((state) => {
      console.log('Spotify State', state);
      this.playStateUpdated(
        state.item
          ? {
              durationMillis: state.item.duration_ms,
              state: !state.is_playing
                ? {
                    type: 'paused' as const,
                    positionMillis: state.progress_ms,
                  }
                : {
                    type: 'playing' as const,
                    playSpeed: 1,
                    effectiveStartTimeMillis:
                      performance.now() - state.progress_ms,
                  },
              meta: {
                id: state.item.id,
                info: {
                  artist: state.item.artists.map((a) => a.name).join(' & '),
                  title: state.item.name,
                },
              },
            }
          : null
      );
    });
  }

  public sourceKind(): 'spotify' {
    return 'spotify';
  }

  protected controls() {
    return {
      toggle: () => {
        const lastState = this.getLastState();
        const playing = lastState && lastState.state.type === 'playing';
        this.api[playing ? 'pause' : 'play']({}).then(this.update);
        this.update();
      },
      pause: () => this.api.pause({}).then(this.update),
      goToTime: (positionMs: number) =>
        this.api.seek(Math.round(positionMs), {}).then(this.update),
      setPlaySpeed: () =>
        console.log('play speed not supported in spotify-source'),
    };
  }

  protected disconnect() {
    clearInterval(this.interval);
  }
}
