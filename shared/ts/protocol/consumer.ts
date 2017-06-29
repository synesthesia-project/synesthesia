import {Endpoint} from './common';
import {Message} from './messages';

/**
 * The ConsumerEndpoint is the side of the protocol that receives synesthesia
 * information.
 */
export class ConsumerEndpoint extends Endpoint {

  public constructor(sendMessage: (msg: Message) => void) {
    super(sendMessage);

    sendMessage({type: 'request', request: 'foo'});
  }

  public recvMessage(message: Message) {
    console.log('recv:', message);
  }

}
