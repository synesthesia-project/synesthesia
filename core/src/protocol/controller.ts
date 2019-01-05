import {Endpoint} from './common';
import {Message, Request, Response, PlayStateData, Notification} from './messages';

/**
 * The ControllerEndpoint is the side of the protocol that shares synesthesia
 * information.
 */
export class ControllerEndpoint extends Endpoint {

  private readonly recvPingData: (ping: number, diff: number) => void;

  public constructor(
      sendMessage: (msg: Message) => void,
      recvPingData: (ping: number, diff: number) => void) {
    super(sendMessage);
    this.recvPingData = recvPingData;
  }

  protected handleRequest(request: Request): Promise<Response> {
    return new Promise((resolve, reject) => {
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

  protected handleNotification(notification: Notification) {
    switch (notification.type) {
      case 'ping': {
        this.recvPingData(notification.ping, notification.diff);
        break;
      }
      default:
        console.error('unknown notification:', notification);
    }
  }

  protected handleClosed() {
    console.log('connection closed');
  }

  public sendState(state: PlayStateData | null) {
    this.sendMessage({
      type: 'notification',
      notification: state ? {
        type: 'playing',
        data: state
      } : {
        type: 'stopped'
      }
    });
  }

}
