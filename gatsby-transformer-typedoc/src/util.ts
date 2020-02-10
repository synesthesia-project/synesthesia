export function stripSlashes(str: string) {
  return str.replace(/^\/+|\/+$/g, '');
}
