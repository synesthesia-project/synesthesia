
/**
 * Logic for connecting to the companion extension:
 *
 * https://github.com/samlanning/synesthesia-companion-chrome
 */

// The ID of the extension.
const EXTENSION_ID = "nblfcglicikmahfabcabikgkfbcadndp";

 // Start a long-running conversation:
export class CompanionConnection {

  private readonly port: chrome.runtime.Port;

  private readonly onDisconnectHandler: () => void;

  public constructor(onDisconnectHandler: () => void) {
    this.onDisconnectHandler = onDisconnectHandler;

    // Bind Methods
    this.onReceiveMessage = this.onReceiveMessage.bind(this);
    this.onDisconnect = this.onDisconnect.bind(this);

    // Connect to
    this.port = chrome.runtime.connect(EXTENSION_ID);

    this.port.onMessage.addListener(this.onReceiveMessage);
    this.port.onDisconnect.addListener(this.onDisconnect);

    // Send initial message
    const initMessage: Synesthesia.Companion.InitMessage = {mode: "composer"}
    this.port.postMessage(initMessage);

  }

  private onReceiveMessage(msg: Object) {
    console.debug('onReceiveMessage', msg);
  }

  private onDisconnect() {
    console.debug('onDisconnect');
    this.onDisconnectHandler();
  }

  public disconnect() {
    this.port.disconnect();
    this.onDisconnect();
  }

}
