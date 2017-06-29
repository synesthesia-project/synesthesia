import {ProtocolEndpoint} from './common';
import {Message} from './messages';

/**
 * The ConsumerEndpoint is the side of the protocol that receives synesthesia
 * information.
 */
export class ConsumerEndpoint {

  private readonly endpoint: ProtocolEndpoint;

  public constructor(endpoint: ProtocolEndpoint) {
    this.endpoint = endpoint;
    this.onRecvMessage = this.onRecvMessage.bind(this);
    this.endpoint.setOnReceiveMessage(this.onRecvMessage);

    this.endpoint.sendMessage({type: 'request', request: 'foo'});
  }

  private onRecvMessage(message: Message) {
    console.log('recv:', message);
  }

}
