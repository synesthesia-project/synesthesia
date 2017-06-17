export type Mutator<T> = (mutator: (orig: T) => T) => void;
