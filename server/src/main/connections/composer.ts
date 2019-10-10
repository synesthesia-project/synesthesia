import * as WebSocket from 'ws';

import { RequestHandlerEndpoint } from '@synesthesia-project/core/lib/protocols/util/endpoint';

import { Request, Response, Notification, PlayStateData } from '@synesthesia-project/composer/dist/integration/shared';

/**
 * Server side of the connection to the composer
 */
export class ComposerConnection extends RequestHandlerEndpoint<Request, Response, Notification> {

  private closeListeners = new Set<() => void>();
  private notificationListeners = new Set<(notif: Notification) => void>();

  public constructor(ws: WebSocket) {
      super(msg => ws.send(JSON.stringify(msg)));

      ws.on('message', msg => this.recvMessage(JSON.parse(msg.toString())));
      ws.on('close', () => this.closed());
  }

  protected handleNotification(notification: Notification) {
    this.notificationListeners.forEach(l => l(notification));
  }

  protected handleClosed() {
    this.closeListeners.forEach(l => l());
  }

  public sendPlayState(data: PlayStateData | null) {
    this.sendNotification({
      type: 'state', data
    });
  }

  public addListener(event: 'close', listener: () => void): void;
  public addListener(event: 'notification', listener: (notif: Notification) => void): void;

  public addListener(event: 'close' | 'notification', listener: (() => void) | ((notif: Notification) => void)) {
    switch (event) {
      case 'close':
        this.closeListeners.add(listener as (() => void));
        break;
      case 'notification':
        this.notificationListeners.add(listener);
        break;
    }
  }

  public removeListener(_event: 'close', listener: () => void) {
    this.closeListeners.delete(listener);
  }

}
