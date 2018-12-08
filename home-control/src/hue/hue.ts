import * as hue from 'node-hue-api';

const LOCAL_LOOKUP_TIMEOUT = 5000;

export async function discoverBridges() {
  console.log('Searching for Hue Bridges');
  let bridges = await hue.nupnpSearch();
  if (bridges.length === 0) {
    console.warn('nupnp search failed, performing local search');
    let bridges = await hue.upnpSearch(LOCAL_LOOKUP_TIMEOUT);
  }
  if (bridges.length === 0) {
    console.error('Failed to find a hue device');
    return;
  }
  const host = bridges[0].ipaddress;
  const api = new hue.HueApi();
  const token = await api.registerUser(host, 'Synesthesia Home Control');
  console.log('token:', token);
}

export function getHue(host: string, token: string) {
  return new hue.HueApi(host, token);
}
