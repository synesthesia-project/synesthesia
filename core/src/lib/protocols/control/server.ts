import { PingingEndpoint } from '../util/endpoint';
import {
  ControlMessage,
  Notification,
  PlayStateData,
  Request,
  Response,
} from './messages';

/**
 * The ServerEndpoint is the side of the control protocol that should
 * be used by the synesthesia server
 */
export class ServerEndpoint extends PingingEndpoint<
  Request,
  Response,
  Notification
> {
  private readonly playStateUpdated: (state: PlayStateData) => void;
  /**
   * Set when we're unable to process a play state due to missing ping data.
   */
  private unprocessedPlayState: PlayStateData | null = null;

  public constructor(
    sendMessage: (msg: ControlMessage) => void,
    playStateUpdated: (state: PlayStateData) => void
  ) {
    super(sendMessage);
    this.playStateUpdated = playStateUpdated;
  }

  protected handleRequest(_request: Request): Promise<Response> {
    return new Promise((_resolve, reject) => {
      reject(new Error('unknown request type'));
    });
  }

  private processPlayStateData(data: PlayStateData, diff: number) {
    const state: PlayStateData = {
      layers: data.layers.map((l) => ({
        file: l.file,
        state:
          l.state.type === 'paused'
            ? l.state
            : {
                type: 'playing',
                effectiveStartTimeMillis:
                  l.state.effectiveStartTimeMillis + diff,
                playSpeed: l.state.playSpeed,
              },
      })),
    };
    this.playStateUpdated(state);
  }

  protected handleNotification(notification: Notification) {
    switch (notification.type) {
      case 'state': {
        // Adjust play state based on offset
        const ping = this.getLatestGoodPing();
        if (!ping) {
          console.log('No offset yet, unable to handle updated play state');
          this.unprocessedPlayState = notification.data;
          return;
        }
        this.processPlayStateData(notification.data, ping.diff);
        return;
      }
      default: {
        const n: never = notification.type;
        console.error('unknown notification type:', n);
      }
    }
  }

  protected pingReq(): Request {
    return { request: 'ping' };
  }

  protected getPingResp(resp: Response) {
    if (resp.type === 'pong') return resp;
    throw new Error('unexpected response');
  }

  protected newPing(): void {
    const ping = this.getLatestGoodPing();
    if (this.unprocessedPlayState && ping) {
      this.processPlayStateData(this.unprocessedPlayState, ping.diff);
      this.unprocessedPlayState = null;
    }
  }
}
