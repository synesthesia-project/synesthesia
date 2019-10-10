export type IncomingConsumerMessage = {
  type: 'new-server';
  /**
   * The local port of the websocket the server is listening on
   */
  port: number;
};
