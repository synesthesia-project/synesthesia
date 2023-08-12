export const INTEGER_REGEX = /^[0-9]+$/;
export const MAX_CHANNEL = 512;
export const MAX_CHANNEL_VALUE = 255;

export const validateChannel = (t: string): number => {
  if (!INTEGER_REGEX.exec(t)) {
    throw new Error(`Channels must be positive integers`);
  }
  const c = parseInt(t);
  if (c < 1 || c > MAX_CHANNEL) {
    throw new Error(`Channels must be between 1 and ${MAX_CHANNEL}`);
  }
  return c;
};

/**
 * Return true if all the given values are set
 */
export const allSet = <T>(values: (T | null | undefined)[]): values is T[] =>
  !values.some((v) => v === null || v === undefined);
