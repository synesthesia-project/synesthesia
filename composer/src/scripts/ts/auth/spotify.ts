import {getRandomHex} from '../util/random';

interface AuthData {
  access_token: string;
  expires_in: string;
  state: string;
}

const SPOTIFY_AUTH_MESSAGE_TYPE = 'SPOTIFY_AUTH';

interface AuthDataMessage {
  message: 'SPOTIFY_AUTH';
  data: AuthData;
}

const CLIENT_ID = 'b12f679a57f5413fb3688dc9bf4d0d04';
let randomToken: string | null = null;

function redirectUrl() {
  return chrome.extension.getURL('auth.html');
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
  if (!chrome.tabs || !chrome.extension) {
    return Promise.reject('Unable to auth Spotify when not running as extension');
  }
  return new Promise((resolve, reject) => {
    const messageHandler = (message: any) => {
      // Ignore invalid message
      if (!isValidAuthMessage(message)) return;
      // Stop listening after first valid message
      chrome.runtime.onMessage.removeListener(messageHandler);
      // Switch back to this tab
      chrome.tabs.getCurrent(tab => {
        if (tab && tab.id) {
          chrome.tabs.update(tab.id, {active: true});
        }
      });
      if (message.data.state !== randomToken) {
        reject('Tokens did not match');
      } else {
        resolve(message.data.access_token);
      }
    };
    chrome.runtime.onMessage.addListener(messageHandler);

    chrome.tabs.create({'url': authURL(), 'selected': selectTab});
  });
}

export function isValidAuth(auth: any): auth is AuthData {
  return !!auth.access_token && !!auth.expires_in && !!auth.state;
}

export function isValidAuthMessage(auth: any): auth is AuthDataMessage {
  return auth.message === SPOTIFY_AUTH_MESSAGE_TYPE && isValidAuth(auth.data);
}

/**
 * Receive the auth data from spotify in a different tab, and send it to the
 * composer tab
 */
export function sendAuthToComposer(data: AuthData) {
  const message: AuthDataMessage = {
    message: SPOTIFY_AUTH_MESSAGE_TYPE,
    data
  };
  chrome.runtime.sendMessage(message);
}
