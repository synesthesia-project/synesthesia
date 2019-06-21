import {isEqual} from 'lodash';

import { PlayStateTrackMeta, PlayStateData as PlayStateDataOnly } from '../../../integration/shared';

export { PlayStateTrackMeta, PlayStateDataOnly };

export interface PlayStateControls {
  /**
   * Toggle Play / Pause
   */
  toggle(): void;
  pause(): void;
  goToTime(timeMillis: number): void;
  setPlaySpeed(playSpeed: number): void;
}

export interface PlayStateData extends PlayStateDataOnly {
  controls: PlayStateControls;
}

export type PlayState = PlayStateData | null;

export function playStateDataEquals(a: PlayStateDataOnly | null, b: PlayStateDataOnly | null) {
  return isEqual(a, b);
}

/** TODO: remove */
export function fromIntegrationData(data: PlayStateDataOnly | null): PlayStateDataOnly | null {
  return data;
}
