import * as WebSocket from 'ws';
import * as constants from '@synesthesia-project/core/constants';
import {ConsumerEndpoint, messages} from '@synesthesia-project/core/protocol';

export type StateListener = (state: messages.PlayStateData | null) => void;

class SynesthesiaConsumerProtocol {

  private readonly ws: WebSocket;

  public constructor(ws: WebSocket, stateUpdated: StateListener) {
    console.log('Initialising SynesthesiaConsumerProtocol');

    this.ws = ws;

    const endpoint = new ConsumerEndpoint(
      msg => ws.send(JSON.stringify(msg)),
      state => stateUpdated(state)
    );
    ws.onclose = () => {
      endpoint.closed();
      stateUpdated(null);
    };
    ws.onmessage = msg => endpoint.recvMessage(JSON.parse(msg.data));
  }
}

export class SynesthesiaConsumerServer {
  public constructor(stateUpdated: StateListener) {
    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: constants.DEFAULT_SYNESTHESIA_PORT
    });

    wss.on('connection', connection => {
      const url = connection.upgradeReq.url;
      if (url === constants.SYNESTHESIA_WEBSOCKET_PATH) {
        const proto = new SynesthesiaConsumerProtocol(connection, stateUpdated);
        return;
      }
      console.error('unrecognized websocket url: ', url);
      connection.close();
    });
  }
}

export class SynesthesiaListener {
  public constructor(stateUpdated: StateListener) {
    const server = new SynesthesiaConsumerServer(stateUpdated);
  }
}
