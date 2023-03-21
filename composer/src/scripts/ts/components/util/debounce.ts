import { useState, useRef } from 'react';

export const useDebouncedState = <T>(init: T): [T, (newValue: T) => void] => {
  const [state, setState] = useState(init);
  const frame = useRef<number>(-1);

  return [
    state,
    (newValue) => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => setState(newValue));
    },
  ];
};
