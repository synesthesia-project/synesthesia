import { Message } from './messages';

/**
 * A generic abstract class that uses Promises to simplyfy implementation
 * of endpoints that handle request/response type messages.
 */
export abstract class Endpoint<Req, Res, Notif> {

  protected readonly sendMessage: (msg: Message<Req, Res, Notif>) => void;

  private readonly pendingRequests =
    new Map<number, { resolve: (resp: Res) => void, reject: (error: Error) => void }>();

  private nextRequestId = 0;

  protected constructor(sendMessage: (msg: Message<Req, Res, Notif>) => void) {
    this.sendMessage = sendMessage;
  }

  /**
   * Call this method when the connection receives a message
   */
  public recvMessage(msg: Message<Req, Res, Notif>): void {
    console.log('got msg', msg);
    switch (msg.type) {
      case 'request': {
        this.handleRequest(msg.request)
          .then(response => this.sendMessage({
            type: 'response',
            requestId: msg.requestId,
            response,
          }))
          .catch(err => {
            console.error('Unable to process request', msg.request, 'sending error: ', err);
            this.sendMessage({
              type: 'error_response',
              requestId: msg.requestId,
              message: err.toString(),
            });
          });
        break;
      }
      case 'response': {
        const r = this.pendingRequests.get(msg.requestId);
        if (r) {
          r.resolve(msg.response);
          this.pendingRequests.delete(msg.requestId);
        } else {
          console.error('Got response for unrecognized request:', msg.requestId);
        }
        break;
      }
      case 'error_response': {
        const r = this.pendingRequests.get(msg.requestId);
        if (r) {
          r.reject(new Error('Received error for request: ' + msg.message));
          this.pendingRequests.delete(msg.requestId);
        } else {
          console.error('Got response for unrecognized request:', msg.requestId);
        }
        break;
      }
      case 'notification': {
        this.handleNotification(msg.notification);
        break;
      }
      default:
        console.log('unknown message', msg);
    }
  }

  /**
   * Call this method when the connection has been closed
   */
  public closed(): void {
    this.handleClosed();
  }

  protected abstract handleRequest(request: Req): Promise<Res>;

  protected abstract handleNotification(notification: Notif): void;

  protected abstract handleClosed(): void;

  public sendRequest(request: Req): Promise<Res> {
    return new Promise((resolve, reject) => {
      const requestId = this.nextRequestId++;
      this.pendingRequests.set(requestId, { resolve, reject });
      this.sendMessage({
        type: 'request',
        requestId,
        request,
      });
    });
  }

  public sendNotification(notification: Notif) {
    this.sendMessage({
      type: 'notification',
      notification,
    });
  }

}

/** Base Endpoint that implements an interface for attaching a request handler */
export abstract class RequestHandlerEndpoint<Req, Res, Notif> extends Endpoint<Req, Res, Notif> {

  private requestHandler: ((req: Req) => Promise<Res>) | null = null;

  protected handleRequest(request: Req): Promise<Res> {
    console.log('got a request', request);
    if (this.requestHandler) {
      return this.requestHandler(request);
    }
    return Promise.reject(new Error('no rewquest handler'));
  }

  public setRequestHandler(handler: (req: Req) => Promise<Res>) {
    this.requestHandler = handler;
  }
}
