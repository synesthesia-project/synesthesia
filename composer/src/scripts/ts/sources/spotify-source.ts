import * as Spotify from 'spotify-web-api-js';

import {Source} from './source';
import {PlayStateDataOnly} from '../data/play-state';
import {just, none, left, right} from '../data/functional';

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
    }
  }>;
  play(options: {}): Promise<{}>;
  pause(options: {}): Promise<{}>;
  seek(positionMs: number, options: {}): Promise<{}>;
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
    this.api.getMyCurrentPlaybackState().then(state => {
      console.log('Spotify State', state);
      this.playStateUpdated(
        state.item ? just<PlayStateDataOnly>({
          durationMillis: state.item.duration_ms,
          state: state.is_playing ?
            // Spotify does not provide an accurate way to get the effective start
            // time of the song (it provides timestamp of last play / pause action, and progress)
            right({effectiveStartTimeMillis: new Date().getTime() - state.progress_ms}) :
            left({timeMillis: state.progress_ms}),
          meta: {
            id: state.item.id,
            info: {
              artist: state.item.artists.map(a => a.name).join(' & '),
              title: state.item.name
            }
          }
        }) : none()
      );
    });
  }

  public sourceKind(): 'spotify' {
    return 'spotify';
  }

  protected controls() {
    return {
      toggle: () => {
        const playing = this.getLastState().caseOf({
          just: state => state.state.caseOf({
            left: () => false,
            right: () => true
          }),
          none: () => false
        });
        this.api[playing ? 'pause' : 'play']({}).then(this.update);
        this.update();
      },
      pause: () => this.api.pause({}).then(this.update),
      goToTime: (positionMs: number) =>
        this.api.seek(Math.round(positionMs), {}).then(this.update)
    };
  }

  protected disconnect() {
    clearInterval(this.interval);
  }

}
