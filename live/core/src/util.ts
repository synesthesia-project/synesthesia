export const isDefined = <T>(v: T | undefined | null): v is T =>
  v !== undefined && v !== null;
