export type RequestMessage<Request> = {
  type: 'request';
  requestId: number;
  request: Request;
};

export type ResponseMessage<Response> = {
  type: 'response';
  requestId: number;
  response: Response;
};

export type ErrorResponseMessage = {
  type: 'error_response';
  requestId: number;
  message: string;
};

export type NotificationMessage<Notification> = {
  type: 'notification';
  notification: Notification;
};

/**
 * The type representing the messages that can be sent and received by a particular endpoint.
 */
export type Message<Request, Response, Notification> =
  | RequestMessage<Request>
  | ResponseMessage<Response>
  | ErrorResponseMessage
  | NotificationMessage<Notification>;
