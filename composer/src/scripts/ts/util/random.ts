/**
 * Get a random 4 bytes represented as a hexadecimal string
 * 4294967296 = (2^8)^4
 */
function getRandomHexBytes() {
  return Math.floor(Math.random() * 4294967296).toString(16);
}

/**
 * Get a random string of bytes, represented as a hexadecimal string. The number
 * of bytes myst be a multiple of 4
 */
export function getRandomHex(bytes: number) {
  let str = '';
  for (let i = 0; i < bytes; i += 4) str += getRandomHexBytes();
  return str;
}
