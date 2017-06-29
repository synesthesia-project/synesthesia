export function test() {
  console.log('hello world');
}

export type RequestMessage = {
  type: 'request';
  request: string;
};

export type ResponseMessage = {
  type: 'response';
  response: string;
};

export type Message = RequestMessage | ResponseMessage;
