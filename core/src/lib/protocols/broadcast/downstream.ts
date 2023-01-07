import { CueFile } from '../../file';
import { MetadataOptions, PingingEndpoint } from '../util/endpoint';
import {
  BroadcastMessage,
  LayerState,
  Notification,
  PlayStateData,
  Request,
  Response,
} from './messages';

/**
 * The DownstreamEndpoint is the side of the protocol that receives synesthesia
 * information. (e.g. a consumer)
 */
export class DownstreamEndpoint extends PingingEndpoint<
  Request,
  Response,
  Notification
> {
  private readonly playStateUpdated: (state: PlayStateData | null) => void;

  private lastPlayState: PlayStateData | null = null;

  public constructor(
    sendMessage: (msg: BroadcastMessage) => void,
    playStateUpdated: (state: PlayStateData | null) => void,
    metadata: MetadataOptions
  ) {
    super(sendMessage, metadata);
    this.playStateUpdated = playStateUpdated;
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

  private sendPlayState() {
    const ping = this.getLatestGoodPing();
    if (this.lastPlayState && ping) {
      const pingDiff = ping.diff;
      this.playStateUpdated({
        layers: this.lastPlayState.layers.map<LayerState>((layer) => ({
          fileHash: layer.fileHash,
          amplitude: layer.amplitude,
          playSpeed: layer.playSpeed,
          effectiveStartTimeMillis: layer.effectiveStartTimeMillis + pingDiff,
        })),
      });
    }
  }

  public getFile(fileHash: string): Promise<CueFile> {
    return this.sendRequest({ type: 'file', fileHash }).then((response) => {
      if (response.type === 'file') return response.file;
      throw new Error('unexpected response');
    });
  }

  protected pingReq(): Request {
    return { type: 'ping' };
  }

  protected getPingResp(resp: Response) {
    if (resp.type === 'pong') return resp;
    throw new Error('unexpected response');
  }
}
