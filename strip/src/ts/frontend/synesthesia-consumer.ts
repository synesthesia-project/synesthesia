import * as WebSocket from 'ws';
import {ConsumerEndpoint} from '../shared/protocol';

import {StripBehavior} from '../behavior/behavior';

export class SynesthesiaConsumerProtocol {

  private readonly ws: WebSocket;

  public constructor(ws: WebSocket, behavior: StripBehavior) {
    console.log('Initialising SynesthesiaConsumerProtocol');

    this.ws = ws;

    const endpoint = new ConsumerEndpoint(
      msg => ws.send(JSON.stringify(msg)),
      state => behavior.updateSynesthesiaPlayState(state)
    );
    ws.onclose = () => {
      endpoint.closed();
      behavior.updateSynesthesiaPlayState(null);
    };
    ws.onmessage = msg => endpoint.recvMessage(JSON.parse(msg.data));
  }
}
