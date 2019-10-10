import {Message} from '../util/messages';
import {CueFile} from '../../file';

export type PingRequest = {
  type: 'ping';
};

export type FileRequest = {
  type: 'file';
  fileHash: string;
};

export type PingResponse = {
  type: 'pong';
  timestampMillis: number;
};

export type FileResponse = {
  type: 'file';
  file: CueFile;
};

export type LayerState = {
  fileHash: string;
  effectiveStartTimeMillis: number;
  /**
   * How load a layer is
   * 1 = normal (full volume), 0 = muted.
   */
  amplitude: number;
  /**
   * How fast is the song playing compared to it's natural speed,
   * where 1 = normal, 2 = double speed, 0.5 = half speed
   */
  playSpeed: number;
};

export type PlayStateData = {
  layers: LayerState[];
};

export type PlayState = {
  type: 'playing_state';
  data: PlayStateData;
};

export type PingStateNotification = {
  type: 'ping';
  ping: number;
  diff: number;
};

export type Request = PingRequest | FileRequest;

export type Response = PingResponse | FileResponse;

export type Notification = PlayState | PingStateNotification;

export type BroadcastMessage = Message<Request, Response, Notification>;
