import {Endpoint} from './common';
import {Message, Request, Response} from './messages';

/**
 * The ControllerEndpoint is the side of the protocol that shares synesthesia
 * information.
 */
export class ControllerEndpoint extends Endpoint {

  public constructor(sendMessage: (msg: Message) => void) {
    super(sendMessage);
  }

  protected handleRequest(request: Request) {
    return new Promise<Response>((resolve, reject) => {
      switch (request.type) {
        case 'ping': {
          const response: Response = {
            type: 'pong',
            timestampMillis: new Date().getTime()
          };
          resolve(response);
          return;
        }
      }
      reject(new Error('unknown request type'));
    });
  }

}
