export type TypedMessage = {
  type: string;
};

export type RequestMessage<Request extends TypedMessage> = {
  type: 'request';
  requestId: number;
  request: Request;
};

export type ResponseMessage<Response extends TypedMessage> = {
  type: 'response';
  requestId: number;
  response: Response;
};

export type ErrorResponseMessage = {
  type: 'error_response';
  requestId: number;
  message: string;
};

export type ConnectionMetadataNode = {
  uuid: string;
  name?: string;
  /**
   * UNIX Epoch for last time this data was updated / changed
   */
  lastUpdateMillis: number;
  /**
   * If true,
   * the given node is interested in receiving updates on connection metadata.
   */
  wantsMetadata: boolean;
  distance: number;
  connections: Record<
    string,
    Array<{
      lastPing?: number;
      /**
       * Only set if the node in question is aware of the ID of the node at the other end of the connection.
       */
      uuid?: string;
    }>
  >;
};

export type ConnectionMetadataNotification = {
  type: 'connection-metadata';
  /**
   * The UUID of the node at the other end of the connection.
   */
  ownUuid: string;
  /**
   * Must at least include the information of the node in `ownUuid`.
   */
  nodes: ConnectionMetadataNode[];
};

export const isConnectionMetadataNotification = (
  msg: TypedMessage
): msg is ConnectionMetadataNotification => msg.type === 'connection-metadata';

export type NotificationMessage<Notification extends TypedMessage> = {
  type: 'notification';
  notification: Notification | ConnectionMetadataNotification;
};

/**
 * The type representing the messages that can be sent and received by a particular endpoint.
 */
export type Message<
  Request extends TypedMessage,
  Response extends TypedMessage,
  Notification extends TypedMessage
> =
  | RequestMessage<Request>
  | ResponseMessage<Response>
  | ErrorResponseMessage
  | NotificationMessage<Notification>;
