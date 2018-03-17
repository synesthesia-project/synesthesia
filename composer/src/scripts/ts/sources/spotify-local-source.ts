import {Source} from './source';
import {PlayStateDataOnly} from '../data/play-state';
import {just, none, left, right} from '../data/functional';

import {SpotifySdk} from '../external/spotify-sdk';

const SPOTIFY_PLAYER_NAME = 'Synesthesia Local Player';

export class SpotifyLocalSource extends Source {

  private player: Spotify.SpotifyPlayer;

  constructor(Spotify: SpotifySdk, token: string) {
    super();

    this.player = new Spotify.Player({
      name: SPOTIFY_PLAYER_NAME,
      getOAuthToken: cb => { cb(token); }
    });

    // Error handling
    this.player.addListener('initialization_error', ({ message }) => { console.error(message); });
    this.player.addListener('authentication_error', ({ message }) => { console.error(message); });
    this.player.addListener('account_error', ({ message }) => { console.error(message); });
    this.player.addListener('playback_error', ({ message }) => { console.error(message); });

    // Playback status updates
    this.player.addListener('player_state_changed', state => {
      this.playStateUpdated(
        (state && state.track_window.current_track) ? just<PlayStateDataOnly>({
          durationMillis: state.duration,
          state: state.paused ?
            left({timeMillis: state.position}) :
            right({effectiveStartTimeMillis: new Date().getTime() - state.position})
        }) : none()
      );
    });

    // Ready
    this.player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
    });

    // Connect to the player!
    this.player.connect();
  }

  public sourceKind(): 'spotify-local' {
    return 'spotify-local';
  }

  protected disconnect() {
    this.player.disconnect();
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
        playing ? this.player.pause() : this.player.resume();
      },
      pause: () => this.player.pause(),
      goToTime: (positionMs: number) =>
        this.player.seek(Math.round(positionMs))
    };
  }
}
