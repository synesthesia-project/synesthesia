export function test() {
  console.log('hello world');
}

export type PingRequest = {
  type: 'ping';
};

export type PingResponse = {
  type: 'pong';
  timestampMillis: number;
};

export type Request = PingRequest;

export type Response = PingResponse;

export type RequestMessage = {
  type: 'request';
  requestId: number;
  request: Request;
};

export type ResponseMessage = {
  type: 'response';
  requestId: number;
  response: Response;
};

export type Message = RequestMessage | ResponseMessage;
