import {Endpoint} from '../util/endpoint';
import {BroadcastMessage, Request, Response, PlayStateData, Notification} from './messages';
import {CueFile} from '../../file';

/**
 * The UpstreamEndpoint is the side of the protocol that shares synesthesia
 * information (e.g. a server).
 */
export class UpstreamEndpoint extends Endpoint<Request, Response, Notification> {

  private readonly recvPingData: (ping: number, diff: number) => void;
  private readonly getFile: (hash: string) => Promise<CueFile>;

  public constructor(
      sendMessage: (msg: BroadcastMessage) => void,
      recvPingData: (ping: number, diff: number) => void,
      getFile: (hash: string) => Promise<CueFile>) {
    super(sendMessage);
    this.recvPingData = recvPingData;
    this.getFile = getFile;
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
        case 'file': {
          resolve(
            this.getFile(request.fileHash)
            .then(file => ({ type: 'file', file } as Response))
          );
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

  public sendState(state: PlayStateData) {
    this.sendMessage({
      type: 'notification',
      notification: {
        type: 'playing_state',
        data: state
      }
    });
  }

}
