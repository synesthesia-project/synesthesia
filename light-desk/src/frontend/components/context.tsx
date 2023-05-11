import { createContext } from 'react';

import * as proto from '../../shared/proto';

export const StageContext = createContext<{
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}>({
  sendMessage: null,
});
