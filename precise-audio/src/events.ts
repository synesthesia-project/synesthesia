export type Listener = EventListener | EventListenerObject | null;

export type ErrorListener = (err: ErrorEvent) => void;

export type EventTypes =
  | 'canplay'
  | 'canplaythrough'
  | 'ended'
  | 'error'
  | 'loadeddata'
  // The next track has started playing
  | 'next'
  | 'play'
  | 'pause'
  | 'ratechange'
  | 'seeked'
  | 'timeupdate'
  | 'trackstateupdate'
  | 'volumechange';
