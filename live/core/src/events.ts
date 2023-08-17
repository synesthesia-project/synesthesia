export type EventRegister<T> = {
  getName(): string;
  addEventListener(listener: (value: T) => void): void;
  removeEventListener(listener: (value: T) => void): void;
};

export const createEventEmitter = <T>(name: string) => {
  const listeners = new Set<(value: T) => void>();

  const emit = (value: T) => {
    for (const l of listeners) {
      l(value);
    }
  };

  const register: EventRegister<T> = {
    getName: () => name,
    addEventListener: listeners.add.bind(listeners),
    removeEventListener: listeners.delete.bind(listeners),
  };

  return { emit, register };
};
