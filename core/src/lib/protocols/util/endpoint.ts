import { Message } from './messages';
import performance from './performance';

/**
 * A generic abstract class that uses Promises to simplyfy implementation
 * of endpoints that handle request/response type messages.
 */
export abstract class Endpoint<Req, Res, Notif> {
  protected readonly sendMessage: (msg: Message<Req, Res, Notif>) => void;

  private readonly pendingRequests = new Map<
    number,
    { resolve: (resp: Res) => void; reject: (error: Error) => void }
  >();

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
          .then((response) =>
            this.sendMessage({
              type: 'response',
              requestId: msg.requestId,
              response,
            })
          )
          .catch((err) => {
            console.error(
              'Unable to process request',
              msg.request,
              'sending error: ',
              err
            );
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
          console.error(
            'Got response for unrecognized request:',
            msg.requestId
          );
        }
        break;
      }
      case 'error_response': {
        const r = this.pendingRequests.get(msg.requestId);
        if (r) {
          r.reject(new Error('Received error for request: ' + msg.message));
          this.pendingRequests.delete(msg.requestId);
        } else {
          console.error(
            'Got response for unrecognized request:',
            msg.requestId
          );
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

interface PingResp {
  timestampMillis: number;
}

/**
 * An endpoint that periodically pings the thing it's connected to to
 * calculate the difference between its clocks
 */
export abstract class PingingEndpoint<Req, Res, Notif> extends Endpoint<
  Req,
  Res,
  Notif
> {
  private pingInterval: ReturnType<typeof setInterval>;
  private pingTimeout: ReturnType<typeof setInterval> | null = null;
  private pingBackoff = 10;
  private latestGoodPing: {
    ping: number;
    requestTime: number;
    diff: number;
  } | null = null;

  protected constructor(sendMessage: (msg: Message<Req, Res, Notif>) => void) {
    super(sendMessage);
    this.pingInterval = setInterval(() => this.updateTimeDifference(), 10000);
    this.updateTimeDifference();
  }

  /**
   * Get the current timestamp from the connection, and if the timing
   * information is precise enough, use it to update the time offset.
   */
  private updateTimeDifference() {
    const requestTime = performance.now();
    this.sendRequest(this.pingReq())
      .then((r) => {
        const resp = this.getPingResp(r);
        const responseTime = performance.now();
        const ping = responseTime - requestTime;
        if (!this.latestGoodPing || this.latestGoodPing.ping > ping) {
          // Update difference
          const thisTimestamp = Math.round(requestTime + ping / 2);
          const diff = thisTimestamp - resp.timestampMillis;
          this.latestGoodPing = {
            ping,
            requestTime,
            diff,
          };
          this.newPing();
          console.log('ping diff:', diff);
        }
        console.log('ping:', ping);
      })
      .catch((err) => {
        console.log(
          `Unable to send ping, will try again in ${this.pingBackoff}ms`,
          err
        );
        if (this.pingTimeout) clearInterval(this.pingTimeout);
        this.pingTimeout = setTimeout(
          () => this.updateTimeDifference(),
          this.pingBackoff
        );
        this.pingBackoff *= 2;
      });
  }

  protected handleClosed() {
    console.log('connection closed');
    clearInterval(this.pingInterval);
    if (this.pingTimeout) clearInterval(this.pingTimeout);
  }

  protected getLatestGoodPing() {
    return this.latestGoodPing;
  }

  protected abstract pingReq(): Req;

  protected abstract getPingResp(resp: Res): PingResp;

  /**
   * Overwritable function called when the ping is calculated
   */
  protected newPing(): void {
    /* no-op */
  }
}
