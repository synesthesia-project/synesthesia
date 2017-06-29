import * as messages from './messages';

export abstract class Endpoint {

  protected readonly sendMessage: (msg: messages.Message) => void;

  protected constructor(sendMessage: (msg: messages.Message) => void) {
    this.sendMessage = sendMessage;
  }

  public abstract recvMessage(msg: messages.Message): void;

}
