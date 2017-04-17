import * as WebSocket from 'ws';

import {StripBehavior} from "../behavior/behavior";

export class StripControllerProtocol {

  private readonly ws: WebSocket;
  private readonly behavior: StripBehavior;

  public constructor(ws: WebSocket, behavior: StripBehavior) {
    console.log('Initialising StripControllerProtocol');

    this.ws = ws;
    this.behavior = behavior;

    // Bind Callbacks / Listeners
    this.onWebsocketClosed = this.onWebsocketClosed.bind(this);


    // Setup Listeners
    this.setupListeners();
  }

  private onWebsocketClosed() {
    this.removeListeners();
  }

  private setupListeners() {
    // behavior listeners
    // TODO
    // websocket listeners
    // TODO
    this.ws.onclose = this.onWebsocketClosed;
  }

  private removeListeners() {
    // behavior listeners
    // TODO
    // websocket listeners
    // TODO
    console.log('removeListeners()')
  }
}
