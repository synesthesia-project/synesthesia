import * as messages from './messages';

export interface ProtocolEndpoint {
  sendMessage(msg: messages.Message): void;
  setOnReceiveMessage(handler: (msg: messages.Message) => void): void;
}
