import { CueFile } from '@synesthesia-project/core/lib/file';
import { ConnectionMetadataManager } from '@synesthesia-project/core/lib/protocols/util/connection-metadata';
import { PingingEndpoint } from '@synesthesia-project/core/lib/protocols/util/endpoint';

import {
  IntegrationSettings,
  PlayStateData,
  FileState,
  Request,
  Response,
  Notification,
  IntegrationMessage,
} from '../../../../dist/integration/shared';
import { PlayStateControls } from '../data/play-state';

import { Source } from './source';

export class ComposerEndpoint extends PingingEndpoint<
  Request,
  Response,
  Notification
> {
  private readonly playStateUpdated: (state: PlayStateData | null) => void;
  private readonly cueFileUpdated: (
    id: string,
    state: CueFile,
    fileState: FileState
  ) => void;

  public constructor(
    sendMessage: (msg: IntegrationMessage) => void,
    playStateUpdated: (state: PlayStateData | null) => void,
    cueFileUpdated: (id: string, file: CueFile, fileState: FileState) => void,
    connectionMetadata: ConnectionMetadataManager
  ) {
    super(sendMessage, {
      connectionType: 'composer:upstream',
      connectionMetadata,
    });
    this.playStateUpdated = playStateUpdated;
    this.cueFileUpdated = cueFileUpdated;
  }

  protected handleRequest(_request: never): Promise<never> {
    return new Promise((_resolve, reject) => {
      reject(new Error('unknown request type'));
    });
  }

  protected handleNotification(notification: Notification) {
    console.log('handleNotification', notification);
    switch (notification.type) {
      case 'state': {
        if (notification.data === null) {
          this.playStateUpdated(null);
          return;
        }
        // Adjust play state based on offset
        const ping = this.getLatestGoodPing();
        if (!ping) {
          console.error('No offset yet, unable to handle updated play state');
          return;
        }
        const diff = ping.diff;
        const state: PlayStateData = {
          ...notification.data,
          state:
            notification.data.state.type === 'paused'
              ? notification.data.state
              : {
                  type: 'playing',
                  effectiveStartTimeMillis:
                    notification.data.state.effectiveStartTimeMillis + diff,
                  playSpeed: notification.data.state.playSpeed,
                },
        };
        this.playStateUpdated(state);
        return;
      }
      case 'cue-file-modified':
        if (notification.fileState) {
          this.cueFileUpdated(
            notification.id,
            notification.file,
            notification.fileState
          );
          return;
        } else {
          console.error('notification missing fileState:', notification);
          return;
        }
    }
    console.error('unknown notification:', notification);
  }

  protected handleClosed() {
    this.playStateUpdated(null);
    console.log('connection closed');
  }

  public request(request: Request) {
    return this.sendRequest(request);
  }

  protected pingReq(): Request {
    return { type: 'ping' };
  }

  protected getPingResp(resp: Response) {
    if (resp.type === 'pong') return resp;
    throw new Error('unexpected response');
  }
}

export type StateListener = (
  state: 'not_connected' | 'connecting' | 'connected' | 'error'
) => void;

export type CueFileListener = (
  id: string,
  file: CueFile,
  state: FileState
) => void;

export class IntegrationSource extends Source {
  private readonly settings: IntegrationSettings;
  private readonly connectionMetadata: ConnectionMetadataManager;

  private readonly stateListeners = new Set<StateListener>();
  private readonly cueFileListeners = new Set<CueFileListener>();

  private connection: {
    socket: WebSocket;
    endpoint: ComposerEndpoint | null;
  } | null = null;

  public constructor(
    settings: IntegrationSettings,
    connectionMetadata: ConnectionMetadataManager
  ) {
    super();
    this.settings = settings;
    this.connectionMetadata = connectionMetadata;
    this.connect();
  }

  public getSettings() {
    return this.settings;
  }

  public sourceKind(): 'integration' {
    return 'integration';
  }

  public connect() {
    if (this.connection) this.connection.socket.close();
    const socket = new WebSocket(this.settings.composerWsUrl);
    const connection: typeof this.connection = (this.connection = {
      socket,
      endpoint: null,
    });
    for (const l of this.stateListeners) l('connecting');
    socket.addEventListener('message', (msg) => {
      connection.endpoint?.recvMessage(JSON.parse(msg.data));
    });
    socket.addEventListener('close', () => {
      if (this.connection !== connection) return;
      for (const l of this.stateListeners) l('not_connected');
      connection.endpoint?.closed();
      this.connection = null;
    });
    socket.addEventListener('error', () => {
      if (this.connection !== connection) return;
      for (const l of this.stateListeners) l('error');
      connection.endpoint?.closed();
      this.connection = null;
    });
    socket.addEventListener('open', () => {
      if (this.connection !== connection) return;
      connection.endpoint = new ComposerEndpoint(
        (msg) => socket.send(JSON.stringify(msg)),
        (playState) => this.playStateUpdated(playState),
        (id, cueFile, fileState) =>
          this.cueFileListeners.forEach((l) => l(id, cueFile, fileState)),
        this.connectionMetadata
      );
      for (const l of this.stateListeners) l('connected');
    });
  }

  protected controls(): PlayStateControls {
    // TODO: notify the user when a request has failed
    return {
      toggle: () => this.sendRequest({ type: 'toggle' }),
      pause: () => this.sendRequest({ type: 'pause' }),
      goToTime: (positionMillis: number) =>
        this.sendRequest({ type: 'go-to-time', positionMillis }),
      setPlaySpeed: (playSpeed: number) =>
        this.sendRequest({ type: 'play-speed', playSpeed }),
    };
  }

  public sendRequest(request: Request) {
    if (this.connection) return this.connection.endpoint?.request(request);
    return Promise.reject(new Error('connection not active'));
  }

  public addListener(event: 'state', listener: StateListener): void;
  public addListener(event: 'new-cue-file', listener: CueFileListener): void;

  public addListener(
    event: 'state' | 'new-cue-file',
    listener: StateListener | CueFileListener
  ) {
    if (event === 'state') {
      const l = listener as StateListener;
      if (this.connection) {
        switch (this.connection.socket.readyState) {
          case WebSocket.CONNECTING:
            l('connecting');
            break;
          case WebSocket.CLOSED:
            l('not_connected');
            break;
          case WebSocket.CLOSING:
          case WebSocket.OPEN:
            l('connected');
            break;
        }
      }
      this.stateListeners.add(l);
    } else if (event === 'new-cue-file') {
      this.cueFileListeners.add(listener as CueFileListener);
    }
  }

  public removeListener(event: 'state', listener: StateListener): void;
  public removeListener(event: 'new-cue-file', listener: CueFileListener): void;

  public removeListener(
    event: 'state' | 'new-cue-file',
    listener: StateListener | CueFileListener
  ) {
    if (event === 'state') {
      this.stateListeners.delete(listener as StateListener);
    } else if (event === 'new-cue-file') {
      this.cueFileListeners.delete(listener as CueFileListener);
    }
  }

  public disconnect(): void {
    if (this.connection) this.connection.socket.close();
  }

  public sendCueFile(id: string, cueFile: CueFile | null) {
    // Only send cue files if not blank (i.e. not initialized from timestamp only)
    // TODO: implement a request that will handle "clearing" the current file
    if (this.connection && cueFile && cueFile.layers.length > 0)
      this.connection.endpoint?.sendNotification({
        id,
        type: 'cue-file-modified',
        file: cueFile,
        fileState: null,
      });
  }
}
