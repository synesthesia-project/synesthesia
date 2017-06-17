/**
 * Restrict the given value to a value between the two numbers given (inclusive)
 */
export function restrict(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function deepFreeze<T>(o: T): T {
  Object.freeze(o);

  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (
        o.hasOwnProperty(prop)
        && o[prop] !== null
        && (typeof o[prop] === 'object' || typeof o[prop] === 'function')
        && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });

  return o;
}
