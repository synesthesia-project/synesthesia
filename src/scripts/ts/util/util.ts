/**
 * Restrict the given value to a value between the two numbers given (inclusive)
 */
export function restrict(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
