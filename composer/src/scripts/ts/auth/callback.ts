import * as spotify from './spotify';

export function start() {

  // Extract
  const hash = window.location.hash;
  if (!hash) return;

  const result: {[index: string]: string} = {};

  for (const param of hash.substr(1).split('&')) {
    const spl = param.split('=', 2);
    if (spl.length === 2)
      result[spl[0]] = spl[1];
  }

  if (spotify.isValidAuth(result))
    spotify.sendAuthToComposer(result);

  window.close();

}
