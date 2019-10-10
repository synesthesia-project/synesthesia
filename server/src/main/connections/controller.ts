import * as WebSocket from 'ws';

import { ServerEndpoint } from '@synesthesia-project/core/lib/protocols/control';
import { PlayStateData } from '@synesthesia-project/core/lib/protocols/control/messages';

interface ControllerConnectionListener {
  playStateUpdated(state: PlayStateData): void;
  closed(): void;
}

export class ControllerConnection extends ServerEndpoint {

  private readonly listeners = new Set<ControllerConnectionListener>();

  public constructor(ws: WebSocket) {
    super(
      msg => ws.send(JSON.stringify(msg)),
      state => this.listeners.forEach(l => l.playStateUpdated(state))
    );

    ws.on('message', msg => this.recvMessage(JSON.parse(msg.toString())));
    ws.on('close', () => this.closed());
  }

  protected handleClosed() {
    this.listeners.forEach(l => l.closed());
  }

  public addListener(listener: ControllerConnectionListener) {
    this.listeners.add(listener);
  }

  public removeListener(listener: ControllerConnectionListener) {
    this.listeners.delete(listener);
  }

}
