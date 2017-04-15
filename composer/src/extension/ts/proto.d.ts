declare namespace Synesthesia {
  namespace Companion {
    interface PlayState {
      length: number;
      title: string | null;
      artist: string | null;
      album: string | null;
      state: 'playing' | 'paused';
      /**
       * If state == playing -> stateValue is the effective start timestamp (in millis)
       * If state == paused -> stateValue is the position in millis in the song
       */
      stateValue: number;
    }

    interface MediaTab {
      state: PlayState | null;
      art: string | null;
    }

    interface InitMessage {
      mode: "tab" | "composer";
    }

    interface TabMessage {
      updatePlayState?: {
        state: PlayState | null;
      };
      updateAlbumArt?: {
        art: string | null;
      };
    }

    interface ComposerMessage {

    }
  }
}
