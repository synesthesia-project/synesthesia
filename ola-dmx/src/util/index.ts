export function randomInt(min: number, max: number) {
  if (min > max) return min;
  return Math.round(Math.random() * (max - min) + min);
}
