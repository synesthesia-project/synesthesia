import * as func from '../data/functional';

import {Source, SourceInitialisationFailed} from './source';

import {PlayStateDataOnly, PlayState, PlayStateControls, MediaPaused, MediaPlaying} from '../data/play-state';

type CompanionPlayState = Synesthesia.Companion.PlayState;

// Start a long-running conversation:
export class CompanionSource extends Source {

  private readonly port: chrome.runtime.Port;

  public constructor() {
    super();

    // Bind Methods
    this.onReceiveMessage = this.onReceiveMessage.bind(this);
    this.onDisconnect = this.onDisconnect.bind(this);

    // Connect to port
    try {
      this.port = chrome.runtime.connect();
      this.port.onMessage.addListener(this.onReceiveMessage);
      this.port.onDisconnect.addListener(this.onDisconnect);

      // Send initial message
      const initMessage: Synesthesia.Companion.InitMessage = {mode: 'composer'};
      this.port.postMessage(initMessage);
      this.port.postMessage({foo: 'bar'});
    } catch (e) {
      throw new SourceInitialisationFailed();
    }
  }

  private onReceiveMessage(msg: Object) {
    this.playStateUpdated(
      func.maybeFrom(msg as CompanionPlayState | null)
      .fmap(state => {
        const playState: PlayStateDataOnly = {
          durationMillis: state.length,
          state: state.state === 'paused' ?
          func.left({timeMillis: state.stateValue}) :
          func.right({effectiveStartTimeMillis: state.stateValue})
        };
        return playState;
      })
    );
  }

  private onDisconnect() {
    this.disconnected();
  }

  public sourceKind(): 'companion' {
    return 'companion';
  }

  protected disconnect() {
    this.port.disconnect();
    this.onDisconnect();
  }

  protected controls(): PlayStateControls {
    return {
      toggle: () => console.debug('toggle()'),
      pause: () => console.debug('pause()'),
      goToTime: (timeMillis: number) => console.debug('goToTime(' + timeMillis + ')')
    };
  }

}
