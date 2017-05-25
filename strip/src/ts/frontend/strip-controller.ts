import * as WebSocket from 'ws';

import {Color} from '../data/colors';
import {StripBehavior, StripBehaviorState} from '../behavior/behavior';

export class StripControllerProtocol {

  private readonly ws: WebSocket;
  private readonly behavior: StripBehavior;

  public constructor(ws: WebSocket, behavior: StripBehavior) {
    console.log('Initialising StripControllerProtocol');

    this.ws = ws;
    this.behavior = behavior;

    // Bind Callbacks / Listeners
    this.onWebsocketClosed = this.onWebsocketClosed.bind(this);
    this.onWebsocketMessage = this.onWebsocketMessage.bind(this);
    this.onBehaviourStateChange = this.onBehaviourStateChange.bind(this);


    // Setup Listeners
    this.setupListeners();
  }

  private onWebsocketClosed() {
    this.removeListeners();
  }

  private onWebsocketMessage(event: {data: any}) {
    try {
      const msg: synesthesia.strip_controller_api.ClientMessage = JSON.parse(event.data);
      if (msg.updateState) {
        const state: Partial<StripBehaviorState> = {
          primaryColor: msg.updateState.primaryColor ? Color.fromTriple(msg.updateState.primaryColor) : undefined,
          secondaryColor: msg.updateState.secondaryColor ? Color.fromTriple(msg.updateState.secondaryColor) : undefined,
          sparkleColor: msg.updateState.sparkleColor ? Color.fromTriple(msg.updateState.sparkleColor) : undefined,
          primaryArtifacts: msg.updateState.primaryArtifacts,
          secondaryArtifacts: msg.updateState.secondaryArtifacts,
          sparkliness: msg.updateState.sparkliness
        };
        this.behavior.updateState(state);
      }
    } catch (e) {
      console.error(e);
    }
  }

  private setupListeners() {
    // behavior listeners
    this.behavior.addListener(this.onBehaviourStateChange);
    // websocket listeners
    this.ws.onmessage = this.onWebsocketMessage;
    this.ws.onclose = this.onWebsocketClosed;
  }

  private onBehaviourStateChange(bState: StripBehaviorState) {
    const state: synesthesia.strip_controller_api.StripState = {
      primaryColor: bState.primaryColor.toTriple(),
      secondaryColor: bState.secondaryColor.toTriple(),
      sparkleColor: bState.sparkleColor.toTriple(),
      primaryArtifacts: bState.primaryArtifacts,
      secondaryArtifacts: bState.secondaryArtifacts,
      sparkliness: bState.sparkliness
    };
    this.send({state});
  }

  private send(msg: synesthesia.strip_controller_api.ServerMessage) {
    this.ws.send(JSON.stringify(msg));
  }

  private removeListeners() {
    // behavior listeners
    this.behavior.removeListener(this.onBehaviourStateChange);
    // websocket listeners
    // TODO
    console.log('removeListeners()');
  }
}
