import {getRandomHex} from '../util/random';

interface AuthData {
  access_token: string;
  expires_in: string;
  state: string;
}

const SPOTIFY_AUTH_STORAGE_KEY = 'spotify_auth';

const CLIENT_ID = 'b12f679a57f5413fb3688dc9bf4d0d04';
let randomToken: string | null = null;

function redirectUrl() {
  return new URL('auth.html', window.location.href).href;
}

function generateRandomToken() {
  if (!randomToken) {
    randomToken = getRandomHex(16);
  }
  return randomToken;
}

function authURL() {
  return (
    `https://accounts.spotify.com/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${redirectUrl()}` +
    `&scope=user-read-playback-state%20user-modify-playback-state` +
    `&response_type=token&state=${generateRandomToken()}`
  );
}

export function authSpotify(selectTab: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageChangedListener = (event: StorageEvent) => {
      if (event.key !== SPOTIFY_AUTH_STORAGE_KEY || !event.newValue) return;
      const data = JSON.parse(event.newValue);
      if (!isValidAuth(data)) return;
      // Stop listening after first valid message
      window.removeEventListener('storage', storageChangedListener);
      // TODO: Switch back to this tab (will require extension code)
      if (data.state !== randomToken) {
        reject('Tokens did not match');
      } else {
        resolve(data.access_token);
      }
    };
    window.addEventListener('storage', storageChangedListener);

    window.open(authURL());
  });
}

export function isValidAuth(auth: any): auth is AuthData {
  return !!auth.access_token && !!auth.expires_in && !!auth.state;
}

/**
 * Receive the auth data from spotify in a different tab, and send it to the
 * composer tab
 */
export function sendAuthToComposer(data: AuthData) {
  localStorage.setItem(SPOTIFY_AUTH_STORAGE_KEY, JSON.stringify(data));
}
