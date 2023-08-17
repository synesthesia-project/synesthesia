import { z } from 'zod';

export type Action<T> = {
  getName(): string;
  /**
   * trigger with an input that has been pre-validated as type-safe
   */
  trigger(input: T): void;

  /**
   * Trigger with an input that may or may not be valid,
   * and throw an exception if not
   */
  triggerWith(input: unknown): void;
};

export const createAction = <T>(
  name: string,
  inputType: z.ZodType<T>,
  listener?: (input: T) => void
) => {
  const listeners = new Set<(value: T) => void>();

  listener && listeners.add(listener);

  const addListener = (listener: (value: T) => void) => listeners.add(listener);

  const emit = (value: T) => {
    for (const l of listeners) {
      l(value);
    }
  };

  const action: Action<T> = {
    getName: () => name,
    trigger: (input) => emit(inputType.parse(input)),
    triggerWith: (input) => emit(inputType.parse(input)),
  };

  return { addListener, action };
};
