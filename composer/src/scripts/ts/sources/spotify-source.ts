import * as Spotify from 'spotify-web-api-js';

export function getSpotifySource(token: string) {
  const s = new Spotify();
  s.setAccessToken(token);
  (s as any).getMyCurrentPlaybackState().then((state: any) => console.log('me', state));
}
