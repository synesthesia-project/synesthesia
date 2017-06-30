import {Endpoint} from './common';
import {Message, Request, Response} from './messages';

/**
 * The ConsumerEndpoint is the side of the protocol that receives synesthesia
 * information.
 */
export class ConsumerEndpoint extends Endpoint {

  private latestGoodPing: {ping: number, requestTime: number} | null = null;

  public constructor(sendMessage: (msg: Message) => void) {
    super(sendMessage);

    setInterval(() => this.updateTimeDifference(), 10000);
    this.updateTimeDifference();
  }

  protected handleRequest(request: Request) {
    return new Promise<Response>((resolve, reject) => {
      reject(new Error('unknown request type'));
    });
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
          ping, requestTime
        };
        // TODO: actually store diff somewhere
        console.log('updating time difference:', diff);
      }
      console.log('ping:', ping);
    });
  }

}
