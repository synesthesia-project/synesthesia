export function randomInt(min: number, max: number) {
  if (min > max) return min;
  return Math.round(Math.random() * (max - min) + min);
}

export function restrictNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
