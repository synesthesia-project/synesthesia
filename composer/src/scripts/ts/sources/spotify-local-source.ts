import {Source} from './source';

import {SpotifySdk} from '../external/spotify-sdk';

export class LocalSpotifySource extends Source {
  public sourceKind(): 'spotify-local' {
    return 'spotify-local';
  }

  protected disconnect() {
    // TODO
  }

  protected controls() {
    // TODO
    return null as any;
  }
}
