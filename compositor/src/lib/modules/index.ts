import { PlayStateData } from '@synesthesia-project/core/lib/protocols/broadcast/messages';
import { CueFile } from '@synesthesia-project/core/lib/file';
import { RGBAColor } from '../color';

/**
 * Meta information about the pixel map
 */
export interface PixelMap {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface PixelInfo<Data> {
  x: number;
  y: number;
  data: Data;
}

export type RenderMethod = (
  map: PixelMap,
  pixels: PixelInfo<unknown>[]
) => RGBAColor[];

export interface CompositorModule {
  render: RenderMethod;
}

export interface SynesthesiaPlayState {
  playState: PlayStateData;
  files: Map<string, CueFile>;
}
