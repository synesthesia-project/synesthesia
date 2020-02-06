
type PlayState = 
  {
    state: 'paused',
    positionMillis: number
  } |
  {
    state: 'playing',
    source: AudioBufferSourceNode,
    effectiveStartTimeMillis: number
  };

type Listener = () => void;
type EventTypes = 'playing' | 'pause' | 'seeked';

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
  private listeners = {
    playing: new Set<Listener>(),
    pause: new Set<Listener>(),
    seeked: new Set<Listener>(),
  };

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
    if (this.song?.state.state === 'playing') {
      this.song.state.source.stop();
    }
    const fileBuffer = await this.loadFile(file);
    const buffer = await this.context.decodeAudioData(fileBuffer);
    this.song = {
      buffer,
      state: {
        state: 'paused', positionMillis: 0
      }
    };
  }

  private playFrom(positionMillis: number) {
    if (this.song) {
      const nowMillis = this.context.currentTime * 1000;
      const source = this.context.createBufferSource();
      source.connect(this.context.destination);
      source.buffer = this.song.buffer;
      source.start(0, positionMillis / 1000);
      this.song.state = {
        state: 'playing',
        source,
        effectiveStartTimeMillis: nowMillis - positionMillis
      }
    }
  }

  public play() {
    if (this.context.state === 'suspended')
      this.context.resume();
    if (this.song && this.song.state.state === 'paused') {
      this.playFrom(this.song.state.positionMillis);
      this.listeners.playing.forEach(l => l());
    }
  }

  public pause() {
    if (this.context.state === 'suspended')
      this.context.resume();
    if (this.song && this.song.state.state === 'playing') {
      const nowMillis = this.context.currentTime * 1000;
      this.song.state.source.stop();
      this.song.state = {
        state: 'paused',
        positionMillis: nowMillis - this.song.state.effectiveStartTimeMillis
      }
      this.listeners.pause.forEach(l => l());
    }
  }

  public get paused() {
    return this.song?.state.state === 'paused';
  }

  public get currentTimeMillis() {
    if (this.song) {
      if (this.song.state.state === 'paused') {
        return this.song.state.positionMillis;
      } else {
        const nowMillis = this.context.currentTime * 1000;
        return nowMillis - this.song.state.effectiveStartTimeMillis;
      }
    }
    return 0;
  }

  public get currentTime() {
    return this.currentTimeMillis / 1000;
  }

  public set currentTime(positionSeconds: number) {
    if (this.song) {
      const positionMillis = positionSeconds * 1000;
      if (this.song.state.state === 'paused') {
        this.song.state.positionMillis = positionMillis;
      } else {
        this.song.state.source.stop();
        this.playFrom(positionMillis);
      }
      this.listeners.seeked.forEach(l => l());
    }
  }

  public set playbackRate(playbackRate: number) {
    // TODO
  }

  public get playbackRate() {
    // TODO
    return 1;
  }

  public get duration() {
    if (this.song) {
      return this.song.buffer.duration;
    }
    return 0;
  }

  public get durationMillis() {
    return this.duration * 1000;
  }

  public addEventListener(event: EventTypes, listener: Listener) {
    this.listeners[event].add(listener);
  }

  public removeEventListener(event: EventTypes, listener: Listener) {
    this.listeners[event].delete(listener);
  }


}
