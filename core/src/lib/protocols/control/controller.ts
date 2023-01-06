import { Endpoint } from '../util/endpoint';
import {
  ControlRequest,
  ControlMessage,
  Notification,
  PlayStateData,
  Request,
  Response,
} from './messages';
import performance from '../util/performance';

interface SimpleControlResponse {
  success: boolean;
}

/**
 * The ControllerEndpoint is the side of the control protocol that should
 * be used by a controller application (e.g. a music player)
 */
export class ControllerEndpoint extends Endpoint<
  Request,
  Response,
  Notification
> {
  private requestHandler:
    | ((req: ControlRequest) => Promise<SimpleControlResponse>)
    | null = null;

  public constructor(sendMessage: (msg: ControlMessage) => void) {
    super(sendMessage);
  }

  protected handleNotification(notification: Notification) {
    console.error('unknown notification:', notification);
  }

  protected handleClosed() {
    console.log('connection closed');
  }

  public sendState(state: PlayStateData) {
    this.sendMessage({
      type: 'notification',
      notification: {
        type: 'state',
        data: state,
      },
    });
  }

  protected handleRequest(request: Request): Promise<Response> {
    return new Promise((resolve, reject) => {
      switch (request.request) {
        case 'ping': {
          const response: Response = {
            type: 'pong',
            timestampMillis: performance.now(),
          };
          resolve(response);
          return;
        }
        default: {
          if (this.requestHandler) {
            resolve(
              this.requestHandler(request).then((resp) => ({
                type: 'result',
                ...resp,
              }))
            );
          } else {
            reject(new Error('No requestHandler set()'));
          }
          return;
        }
      }
      reject(new Error('unknown request type'));
    });
  }

  public setRequestHandler(
    handler: (req: ControlRequest) => Promise<SimpleControlResponse>
  ) {
    this.requestHandler = handler;
  }
}
