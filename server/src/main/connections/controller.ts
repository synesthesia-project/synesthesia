import * as WebSocket from 'ws';

import { ServerEndpoint } from '@synesthesia-project/core/lib/protocols/control';
import { PlayStateData } from '@synesthesia-project/core/lib/protocols/control/messages';
import { ConnectionMetadataManager } from '@synesthesia-project/core/lib/protocols/util/connection-metadata';

interface ControllerConnectionListener {
  playStateUpdated(state: PlayStateData): void;
  closed(): void;
}

export class ControllerConnection extends ServerEndpoint {
  private readonly listeners = new Set<ControllerConnectionListener>();

  public constructor(
    ws: WebSocket,
    connectionMetadata: ConnectionMetadataManager
  ) {
    super(
      (msg) => ws.send(JSON.stringify(msg)),
      (state) => this.listeners.forEach((l) => l.playStateUpdated(state)),
      {
        connectionMetadata,
        connectionType: 'controller:downstream',
      }
    );

    ws.on('message', (msg) => this.recvMessage(JSON.parse(msg.toString())));
    ws.on('close', () => this.closed());
  }

  protected handleClosed() {
    this.listeners.forEach((l) => l.closed());
  }

  public addListener(listener: ControllerConnectionListener) {
    this.listeners.add(listener);
  }

  public removeListener(listener: ControllerConnectionListener) {
    this.listeners.delete(listener);
  }
}
