import * as WebSocket from 'ws';
import {ConsumerEndpoint} from '../shared/protocol';

export class SynesthesiaConsumerProtocol {

  private readonly ws: WebSocket;

  public constructor(ws: WebSocket) {
    console.log('Initialising SynesthesiaConsumerProtocol');

    this.ws = ws;

    ws.onclose = () => console.log('connection closed');

    const endpoint = new ConsumerEndpoint({
      sendMessage: msg => {
        ws.send(JSON.stringify(msg));
      },
      setOnReceiveMessage: recv => {
        ws.onmessage = msg => {
          recv(JSON.parse(msg.data));
        };
      }});
  }
}
