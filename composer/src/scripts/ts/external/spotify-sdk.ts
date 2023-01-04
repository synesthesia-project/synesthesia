export type SpotifySdk = typeof Spotify;

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

/**
 * A Promise that resolves the Spotify.Player class when the SDK is ready
 */
export const spotifyWebPlaybackSDKReady = new Promise<SpotifySdk>(resolve => {
  window .onSpotifyWebPlaybackSDKReady = () => resolve(Spotify);
});

/**
 * Prepare a function that listens for when the spotify SDK is ready to use
 */
export function prepareSpotifySDKListener() {
  // No-Op, inclusion of this file defines the function and promise
  console.log('spotifyWebPlaybackSDKReady:', spotifyWebPlaybackSDKReady);
}
