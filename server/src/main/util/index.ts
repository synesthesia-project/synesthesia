export function filterNotNull<T>(list: (T | null)[]): T[] {
  return list.filter(v => v !== null) as T[];
}
