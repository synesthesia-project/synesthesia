import {Maybe} from "./functional";

export interface PlayStateData {
  duration: number;
}

export type PlayState = Maybe<PlayStateData>;
