
type PlayState = 
  {
    state: 'paused',
    positionMillis: number
  } |
  {
    state: 'playing',
    source: AudioBufferSourceNode,
    effectiveStartTimeMillis: number
  }

/**
 * An audio player that can seek and provide timestamps with millisecond
 * accuracy.
 * 
 * In contract to the <audio> tag, this class will load an entire track
 * into memory as a raw waveform, as otherwise, with most codecs,
 * it's impossible to seek to accurate locations in songs.
 */
export class PreciseAudio {

  private readonly context = new AudioContext();
  private song: {
    buffer: AudioBuffer;
    state: PlayState;
  } | null = null;

  private loadFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => {
        resolve(ev.target?.result as ArrayBuffer);
      };
      reader.onerror = ev => {
        reader.abort();
        reject(reader.error);
      }
      reader.readAsArrayBuffer(file);
    });
  }

  public async loadAudioFile(file: File) {
    const fileBuffer = await this.loadFile(file);
    const buffer = await this.context.decodeAudioData(fileBuffer);
    this.song = {
      buffer,
      state: {
        state: 'paused', positionMillis: 0
      }
    };
  }

  public play() {
    if (this.context.state === 'suspended')
      this.context.resume();
    if (this.song && this.song.state.state === 'paused') {
      const now = this.context.currentTime;
      const source = this.context.createBufferSource();
      source.connect(this.context.destination);
      source.buffer = this.song.buffer;
      // TODO (copy to buffer when non-zero)
      
      source.start();
      this.song.state = {
        state: 'playing',
        source,
        effectiveStartTimeMillis: now - this.song.state.positionMillis
      }
    }
  }

  public pause() {
    if (this.context.state === 'suspended')
      this.context.resume();
    if (this.song && this.song.state.state === 'playing') {
      const now = this.context.currentTime;
      this.song.state.source.stop();
      this.song.state = {
        state: 'paused',
        positionMillis: now - this.song.state.effectiveStartTimeMillis
      }
    }
  }

  public get paused() {
    return this.song?.state.state === 'paused';
  }

  public get currentTime() {
    // TODO
    return 0;
  }

  public set currentTime(positionMillis: number) {
    // TODO
  }

  public set playbackRate(playbackRate: number) {
    // TODO
  }

}