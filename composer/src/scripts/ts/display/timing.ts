/**
 * Display the given number of milliseconds in a nice format to the user
 */
export function displayMillis(totalMilliseconds: number): string {
  let remaining = totalMilliseconds;
  const mins = (remaining / 60000) | 0;
  remaining -= mins * 60000;
  const seconds = (remaining / 1000) | 0;
  remaining -= seconds * 1000;
  const millis = remaining | 0;
  return (
    mins +
    ':' +
    (seconds < 10 ? '0' : '') +
    seconds +
    ':' +
    (millis < 10 ? '00' : millis < 100 ? '0' : '') +
    millis
  );
}
