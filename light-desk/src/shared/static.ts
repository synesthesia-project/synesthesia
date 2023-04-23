export interface AudioFile {
  file: string;
  /** How many copies of this audio file should be made ready */
  poolSize: number;
  volume: number;
  /** At what time in the file should playback start */
  startTime: number;
}

function sample(file: string, poolSize: number, volume: number, startTime: number): AudioFile {
  return {file, poolSize, volume, startTime};
}

export const AUDIO_FILES = {
  touch: sample('freesound/123105__dj-chronos__gui-2.wav', 3, 0.2, 0),
  beep2: sample('freesound/123112__dj-chronos__gui-8.wav', 3, 0.2, 0.1),
  beep3: sample('freesound/220206__gameaudio__beep-space-button.wav', 3, 0.6, 0),
  ready1: sample('freesound/220172__gameaudio__flourish-spacey-2.wav', 1, 0.6, 0),
  powerUp: sample('freesound/264762__farpro__guiclick.ogg', 1, 0.6, 0),
  powerDown: sample('freesound/264763__farpro__guiclick2.ogg', 1, 0.6, 0)
};
