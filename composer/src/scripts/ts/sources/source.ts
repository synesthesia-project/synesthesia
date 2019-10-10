import {PlayStateDataOnly, PlayState, PlayStateControls, playStateDataEquals} from '../data/play-state';

export abstract class Source {

  private lastState: PlayStateDataOnly | null = null;
  private playState: PlayState = null;
  private playStateListeners: ((state: PlayState) => void)[] = [];
  private disconnectedListeners: (() => void)[] = [];

  public abstract sourceKind(): 'file' | 'companion' | 'spotify' | 'spotify-local' | 'integration';
  protected abstract controls(): PlayStateControls;
  protected abstract disconnect(): void;

  protected playStateUpdated(state: PlayStateDataOnly | null) {
    console.log('playStateUpdated', state);
    const unchanged = playStateDataEquals(state, this.lastState);
    if (unchanged) return;
    this.lastState = state;
    const playState: PlayState = state ? {
      durationMillis: state.durationMillis,
      state: state.state,
      meta: state.meta,
      controls: this.controls()
    } : null;
    this.playState = playState;
    this.playStateListeners.map(l => l(playState));
  }

  protected disconnected() {
    this.disconnectedListeners.map(l => l());
  }

  protected getLastState(): PlayStateDataOnly | null {
    return this.lastState;
  }

  public dispose() {
    this.disconnect();
    this.disconnected();
    this.playStateListeners = [];
    this.disconnectedListeners = [];
  }

  public addStateListener(l: (state: PlayState) => void) {
    this.playStateListeners.push(l);
    l(this.playState);
  }

  public addDisconnectedListener(l: () => void) {
    this.disconnectedListeners.push(l);
  }

}

export class SourceInitialisationFailed extends Error {}
