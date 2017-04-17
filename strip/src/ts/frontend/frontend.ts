import * as WebSocket from 'ws';

import {StripBehavior} from "../behavior/behavior";
import {SynesthesiaConsumerProtocol} from "./synesthesia-consumer";
import {StripControllerProtocol} from "./strip-controller";

export class Frontend {

  private readonly behavior: StripBehavior;

  public constructor(behavior: StripBehavior) {
    this.behavior = behavior;
  }

  public start() {
    console.log("Starting Frontend");

    const wss = new WebSocket.Server({
      perMessageDeflate: false,
      port: 8120
    });

    wss.on('connection', connection => {
      const url = connection.upgradeReq.url;
      if (url === '/strip') {
        const proto = new StripControllerProtocol(connection, this.behavior);
        return;
      }
      if (url === '/synesthesia') {
        const proto = new SynesthesiaConsumerProtocol(connection);
        return;
      }
      console.error('unrecognized websocket url: ', url);
      connection.close();
    });
  }

}
