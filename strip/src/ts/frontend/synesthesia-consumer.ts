import * as WebSocket from 'ws';

export class SynesthesiaConsumerProtocol {
  public constructor(connection: WebSocket) {
    console.log('Initialising SynesthesiaConsumerProtocol');
    connection.onclose = () => console.log('connection closed');
  }
}
