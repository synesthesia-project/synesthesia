import {ProtocolEndpoint} from './common';
import {Message} from './messages';

/**
 * The ControllerEndpoint is the side of the protocol that shares synesthesia
 * information.
 */
export class ControllerEndpoint {

  private readonly endpoint: ProtocolEndpoint;

  public constructor(endpoint: ProtocolEndpoint) {
    this.endpoint = endpoint;
    this.onRecvMessage = this.onRecvMessage.bind(this);
    this.endpoint.setOnReceiveMessage(this.onRecvMessage);
  }

  private onRecvMessage(message: Message) {
    console.log('recv:', message);
    switch (message.type) {
      case 'request': {
        this.endpoint.sendMessage({
          type: 'response',
          response: message.request + '-' + message.request
        });
        break;
      }
    }
  }

}
