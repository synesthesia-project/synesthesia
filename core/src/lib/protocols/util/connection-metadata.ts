import { ConnectionMetadataNotification } from './messages';

export class ConnectionMetadataManager {
  public acceptNotification = (
    _notification: ConnectionMetadataNotification
  ) => {
    console.log('new connection metadata');
  };
}
