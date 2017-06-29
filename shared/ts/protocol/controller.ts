import {Endpoint} from './common';
import {Message} from './messages';

/**
 * The ControllerEndpoint is the side of the protocol that shares synesthesia
 * information.
 */
export class ControllerEndpoint extends Endpoint {

  public constructor(sendMessage: (msg: Message) => void) {
    super(sendMessage);

    sendMessage({type: 'request', request: 'foo'});
  }

  public recvMessage(message: Message) {
    console.log('recv:', message);
    switch (message.type) {
      case 'request': {
        this.sendMessage({
          type: 'response',
          response: message.request + '-' + message.request
        });
        break;
      }
    }
  }

}
