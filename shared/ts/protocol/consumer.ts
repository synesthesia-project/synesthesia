import {Endpoint} from './common';
import {Message, Request, Response} from './messages';

/**
 * The ConsumerEndpoint is the side of the protocol that receives synesthesia
 * information.
 */
export class ConsumerEndpoint extends Endpoint {

  public constructor(sendMessage: (msg: Message) => void) {
    super(sendMessage);

    this.sendRequest({type: 'ping'}).then(resp => {
      console.log('got response:', resp);
    });
  }

  protected handleRequest(request: Request) {
    return new Promise<Response>((resolve, reject) => {
      reject(new Error('unknown request type'));
    });
  }

}
