import {RequestHandlerEndpoint} from '../util/endpoint';
import { ControlMessage, Notification, PlayStateData, Request, Response } from './messages';

/**
 * The ControllerEndpoint is the side of the control protocol that should
 * be used by a controller application (e.g. a music player)
 */
export class ControllerEndpoint extends RequestHandlerEndpoint<Request, Response, Notification> {

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

}
