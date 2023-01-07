import * as WebSocket from 'ws';
import { performance } from 'perf_hooks';

import { Endpoint } from '@synesthesia-project/core/lib/protocols/util/endpoint';

import {
  Request,
  Response,
  Notification,
  PlayStateData,
} from '@synesthesia-project/composer/dist/integration/shared';

/**
 * Server side of the connection to the composer
 */
export class ComposerConnection extends Endpoint<
  Request,
  Response,
  Notification
> {
  private closeListeners = new Set<() => void>();
  private notificationListeners = new Set<(notif: Notification) => void>();

  private requestHandler: ((req: Request) => Promise<Response>) | null = null;

  public constructor(ws: WebSocket) {
    super((msg) => ws.send(JSON.stringify(msg)));

    ws.on('message', (msg) => this.recvMessage(JSON.parse(msg.toString())));
    ws.on('close', () => this.closed());
  }

  protected handleNotification(notification: Notification) {
    this.notificationListeners.forEach((l) => l(notification));
  }

  protected handleClosed() {
    this.closeListeners.forEach((l) => l());
  }

  protected async handleRequest(request: Request): Promise<Response> {
    console.log('got a request', request);
    if (request.type === 'ping') {
      return {
        type: 'pong',
        timestampMillis: performance.now(),
      };
    }
    if (this.requestHandler) {
      return this.requestHandler(request);
    }
    return Promise.reject(new Error('no rewquest handler'));
  }

  public sendPlayState(data: PlayStateData | null) {
    this.sendNotification({
      type: 'state',
      data,
    });
  }

  public addListener(event: 'close', listener: () => void): void;
  public addListener(
    event: 'notification',
    listener: (notif: Notification) => void
  ): void;

  public addListener(
    event: 'close' | 'notification',
    listener: (() => void) | ((notif: Notification) => void)
  ) {
    switch (event) {
      case 'close':
        this.closeListeners.add(listener as () => void);
        break;
      case 'notification':
        this.notificationListeners.add(listener);
        break;
    }
  }

  public removeListener(_event: 'close', listener: () => void) {
    this.closeListeners.delete(listener);
  }

  public setRequestHandler(handler: (req: Request) => Promise<Response>) {
    this.requestHandler = handler;
  }
}
