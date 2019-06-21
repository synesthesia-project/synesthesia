export function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? ('1 ' + singular) : (count + ' ' + plural);
}
