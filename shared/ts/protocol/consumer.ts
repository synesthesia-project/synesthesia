import {Endpoint} from './common';
import {Message, Request, Response, Notification, PlayStateData} from './messages';

/**
 * The ConsumerEndpoint is the side of the protocol that receives synesthesia
 * information.
 */
export class ConsumerEndpoint extends Endpoint {

  private readonly playStateUpdated: (state: PlayStateData | null) => void;

  private lastPlayState: PlayStateData | null;
  private pingInterval: any;
  private latestGoodPing: {ping: number, requestTime: number, diff: number} | null = null;

  public constructor(
    sendMessage: (msg: Message) => void,
    playStateUpdated: (state: PlayStateData | null) => void
  ) {
    super(sendMessage);
    this.playStateUpdated = playStateUpdated;

    this.pingInterval = setInterval(() => this.updateTimeDifference(), 10000);
    this.updateTimeDifference();
  }

  protected handleRequest(request: Request) {
    return new Promise<Response>((resolve, reject) => {
      reject(new Error('unknown request type'));
    });
  }

  protected handleNotification(notification: Notification) {
    switch (notification.type) {
      case 'playing': {
        this.lastPlayState = notification.data;
        this.sendPlayState();
        break;
      }
      case 'stopped': {
        this.playStateUpdated(null);
        break;
      }
      default:
        console.error('unknown notification:', notification);
    }
  }

  protected handleClosed() {
    clearInterval(this.pingInterval);
  }

  private sendPlayState() {
    if (this.lastPlayState && this.latestGoodPing) {
      this.playStateUpdated({
        effectiveStartTimeMillis:
          this.lastPlayState.effectiveStartTimeMillis + this.latestGoodPing.diff,
        file: this.lastPlayState.file
      });
    }
  }

  /**
   * Get the current timestamp from the controller, and if the timing
   * information is precise enough, use it to update the time offset from the
   * controller.
   */
  private updateTimeDifference() {
    const requestTime = new Date().getTime();
    this.sendRequest({type: 'ping'}).then(resp => {
      const responseTime = new Date().getTime();
      const ping = responseTime - requestTime;
      if (!this.latestGoodPing || this.latestGoodPing.ping > ping) {
        // Update difference
        const thisTimestamp = Math.round(requestTime + ping / 2);
        const diff = thisTimestamp - resp.timestampMillis;
        this.latestGoodPing = {
          ping, requestTime, diff
        };
        this.sendNotification({type: 'ping', ping, diff});
        console.log('updating time difference:', diff);
        this.sendPlayState();
      }
      console.log('ping:', ping);
    });
  }

}
