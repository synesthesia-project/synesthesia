import {Message, Request, Response} from './messages';

export abstract class Endpoint {

  protected readonly sendMessage: (msg: Message) => void;

  private readonly pendingRequests =
    new Map<number, {resolve: (resp: Response) => void}>();
  private nextRequestId = 0;

  protected constructor(sendMessage: (msg: Message) => void) {
    this.sendMessage = sendMessage;
  }

  /**
   * Call this method when the connection receives a message
   */
  public recvMessage(msg: Message): void {
    switch (msg.type) {
      case 'request': {
        this.handleRequest(msg.request)
          .then(response => this.sendMessage({
            type: 'response',
            requestId: msg.requestId,
            response
          }));
        break;
      }
      case 'response': {
        const r = this.pendingRequests.get(msg.requestId);
        if (r) {
          r.resolve(msg.response);
        } else {
          console.error('Got response for unrecognized request:', msg.requestId);
        }
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

  protected abstract handleRequest(request: Request): Promise<Response>;

  protected abstract handleClosed(): void;

  protected sendRequest(request: Request) {
    return new Promise<Response>(resolve => {
      const requestId = this.nextRequestId++;
      this.pendingRequests.set(requestId, {resolve});
      this.sendMessage({
        type: 'request',
        requestId,
        request
      });
    });
  }

}
