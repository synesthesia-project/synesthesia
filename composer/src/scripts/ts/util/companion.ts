import * as func from "../data/functional";
import {PlayStateControls} from "../data/play-state";

type PlayState = Synesthesia.Companion.PlayState;

/**
 * Logic for connecting to the companion extension:
 *
 * https://github.com/samlanning/synesthesia-companion-chrome
 */

 // Start a long-running conversation:
export class CompanionConnection {

  private readonly port: chrome.runtime.Port;

  private readonly onDisconnectHandler: () => void;
  private readonly onPlayStateChanged: (state: func.Maybe<PlayState>) => void;
  private readonly controls: PlayStateControls;

  public constructor(
      onDisconnectHandler: () => void,
      onPlayStateChanged: (state: func.Maybe<PlayState>) => void,
      onConnectionFailed: () => void) {
    this.onDisconnectHandler = onDisconnectHandler;
    this.onPlayStateChanged = onPlayStateChanged;

    // Bind Methods
    this.onReceiveMessage = this.onReceiveMessage.bind(this);
    this.onDisconnect = this.onDisconnect.bind(this);

    // Connect to port
    try {
      this.port = chrome.runtime.connect();
      this.port.onMessage.addListener(this.onReceiveMessage);
      this.port.onDisconnect.addListener(this.onDisconnect);

      // Send initial message
      const initMessage: Synesthesia.Companion.InitMessage = {mode: "composer"}
      this.port.postMessage(initMessage);
      this.port.postMessage({foo: 'bar'});
    } catch(e) {
      onConnectionFailed();
      return;
    }

    // Setup playback controls
    this.controls = {
      toggle: () => console.debug('toggle()'),
      pause: () => console.debug('pause()'),
      goToTime: (timeMillis: number) => console.debug('goToTime(' + timeMillis + ')')
    };


  }

  private onReceiveMessage(msg: Object) {
    console.log('onReceiveMessage', msg);
    this.onPlayStateChanged(func.maybeFrom(msg as PlayState | null));
  }

  private onDisconnect() {
    console.log('onDisconnect');
    this.onDisconnectHandler();
  }

  public disconnect() {
    this.port.disconnect();
    this.onDisconnect();
  }

  public getControls(): PlayStateControls {
    return this.controls;
  }

}
