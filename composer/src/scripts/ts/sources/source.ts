import {Maybe, none, Either} from '../data/functional';
import {PlayStateDataOnly, PlayState, PlayStateData, PlayStateControls} from '../data/play-state';

export abstract class Source {

  private playState: PlayState = none();
  private playStateListeners: ((state: PlayState) => void)[] = [];
  private disconnectedListeners: (() => void)[] = [];

  public abstract sourceKind(): 'companion';
  protected abstract controls(): PlayStateControls;
  protected abstract disconnect(): void;

  protected playStateUpdated(state: Maybe<PlayStateDataOnly>) {
    const playState: PlayState = state.fmap<PlayStateData>(state => ({
      durationMillis: state.durationMillis,
      state: state.state,
      controls: this.controls()
    }));
    this.playState = playState;
    this.playStateListeners.map(l => l(playState));
  }

  protected disconnected() {
    this.disconnectedListeners.map(l => l());
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
