import * as WebSocket from 'ws';
import {ConsumerEndpoint} from '../shared/protocol';

export class SynesthesiaConsumerProtocol {

  private readonly ws: WebSocket;

  public constructor(ws: WebSocket) {
    console.log('Initialising SynesthesiaConsumerProtocol');

    this.ws = ws;

    const endpoint = new ConsumerEndpoint(
      msg => ws.send(JSON.stringify(msg)),
      state => console.log('play state updated', state)
    );
    ws.onclose = () => endpoint.closed();
    ws.onmessage = msg => endpoint.recvMessage(JSON.parse(msg.data));
  }
}
