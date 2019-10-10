
import { CueFile } from '../../file';
import { Endpoint } from '../util/endpoint';
import { BroadcastMessage, LayerState, Notification, PlayStateData, Request, Response } from './messages';

/**
 * The DownstreamEndpoint is the side of the protocol that receives synesthesia
 * information. (e.g. a consumer)
 */
export class DownstreamEndpoint extends Endpoint<Request, Response, Notification> {

  private readonly playStateUpdated: (state: PlayStateData | null) => void;

  private lastPlayState: PlayStateData | null = null;
  private pingInterval: any;
  private latestGoodPing: {ping: number, requestTime: number, diff: number} | null = null;

  public constructor(
    sendMessage: (msg: BroadcastMessage) => void,
    playStateUpdated: (state: PlayStateData | null) => void,
  ) {
    super(sendMessage);
    this.playStateUpdated = playStateUpdated;

    this.pingInterval = setInterval(() => this.updateTimeDifference(), 10000);
    this.updateTimeDifference();
  }

  protected handleRequest(_request: Request): Promise<Response> {
    return new Promise((_resolve, reject) => {
      reject(new Error('unknown request type'));
    });
  }

  protected handleNotification(notification: Notification) {
    switch (notification.type) {
      case 'playing_state': {
        this.lastPlayState = notification.data;
        this.sendPlayState();
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
      const pingDiff = this.latestGoodPing.diff;
      this.playStateUpdated({
        layers: this.lastPlayState.layers.map<LayerState>(layer => ({
          fileHash: layer.fileHash,
          amplitude: layer.amplitude,
          playSpeed: layer.playSpeed,
          effectiveStartTimeMillis: layer.effectiveStartTimeMillis + pingDiff,
        })),
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
      if (resp.type !== 'pong') {
        console.error('Received unexpected response to ping:', resp);
        return;
      }
      const responseTime = new Date().getTime();
      const ping = responseTime - requestTime;
      if (!this.latestGoodPing || this.latestGoodPing.ping > ping) {
        // Update difference
        const thisTimestamp = Math.round(requestTime + ping / 2);
        const diff = thisTimestamp - resp.timestampMillis;
        this.latestGoodPing = {
          ping, requestTime, diff,
        };
        this.sendNotification({type: 'ping', ping, diff});
        console.log('updating time difference:', diff);
        this.sendPlayState();
      }
      console.log('ping:', ping);
    });
  }

  public getFile(fileHash: string): Promise<CueFile> {
    return this.sendRequest({type: 'file', fileHash }).then(response => {
      if (response.type === 'file') return response.file;
      throw new Error('unexpected response');
    });
  }

}
