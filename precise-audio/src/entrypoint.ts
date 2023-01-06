import PreciseAudio from '.';

declare global {
  interface Window {
    PreciseAudio: typeof PreciseAudio;
  }
}

window.PreciseAudio = PreciseAudio;
