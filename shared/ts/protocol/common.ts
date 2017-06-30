import {Message, Request, Response} from './messages';

export abstract class Endpoint {

  protected readonly sendMessage: (msg: Message) => void;

  private readonly pendingRequests =
    new Map<number, {resolve: (resp: Response) => void}>();
  private nextRequestId = 0;

  protected constructor(sendMessage: (msg: Message) => void) {
    this.sendMessage = sendMessage;
  }

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
        console.log('got response:', msg.requestId);
        const r = this.pendingRequests.get(msg.requestId);
        if (r) {
          r.resolve(msg.response);
        } else {
          console.error('Got response for unrecognized request:', msg.requestId);
        }
        break;
      }
    }
  }

  protected abstract handleRequest(request: Request): Promise<Response>;

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
