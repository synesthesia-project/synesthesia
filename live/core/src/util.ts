export const isDefined = <T>(v: T | undefined | null): v is T =>
  v !== undefined && v !== null;

export type ConfigUpdate<T> = (current: T) => T;
export type ConfigUpdater<T> = (update: ConfigUpdate<T>) => Promise<void>;
export type ConfigApplyer<T> = (config: T, oldConfig: T | null) => void;
