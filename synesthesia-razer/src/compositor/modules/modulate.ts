
import * as usage from '@synesthesia-project/core/lib/file/file-usage';
import { RGBAColor } from '../color';
import { PixelMap, PixelInfo, CompositorModule, SynesthesiaPlayState } from './';

/**
 * Adjust the opacity / alpha of the given module based
 * on the current music playing on synesthesia
 */
export default class SynesthesiaModulateModule<State extends { synesthesia: SynesthesiaPlayState }> implements CompositorModule<State> {

  private readonly child: CompositorModule<State>;

  private readonly idleAlpha = 1;
  private readonly activeMinAlpha = 0.1;
  private readonly activeMaxAlpha = 1;

  public constructor(child: CompositorModule<State>) {
    this.child = child;
  }

  public render(map: PixelMap, pixels: PixelInfo<unknown>[], state: State): RGBAColor[] {
    const timestampMillis = new Date().getTime();
    let alpha: number;
    if (state.synesthesia.playState.layers.length === 0) {
      alpha = this.idleAlpha;
    } else {
      let amplitude = 0;
      for (const layer of state.synesthesia.playState.layers) {
        const f = state.synesthesia.files.get(layer.fileHash);
        if (!f) continue;
        const t = (timestampMillis - layer.effectiveStartTimeMillis) * layer.playSpeed;
        for (const fLayer of f.layers) {
          const activeEvents = usage.getActiveEvents(fLayer.events, t);
          for (const e of activeEvents) {
            const a = usage.getCurrentEventStateValue(e, t, state => state.amplitude);
            amplitude = Math.max(amplitude, a);
          }
        }
      }
      alpha = this.activeMinAlpha + (this.activeMaxAlpha - this.activeMinAlpha) * amplitude;
    }
    const result = this.child.render(map, pixels, state);
    if (alpha === 1) return result;
    return result.map(value => new RGBAColor(value.r, value.g, value.b, value.alpha * alpha));
  }

}
