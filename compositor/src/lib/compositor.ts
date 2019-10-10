import { PixelMap, CompositorModule, PixelInfo } from './modules';
import { RGBAColor } from './color';

export interface Config<PixelData, State> {
  root: CompositorModule<State>;
  pixels: PixelInfo<PixelData>[];
}

type RenderResult<PixelData> = { pixel: PixelInfo<PixelData>, output: RGBAColor }[];

export class Compositor<PixelData, State> {

  private readonly config: Config<PixelData, State>;
  private readonly map: PixelMap;

  private state: State;

  public constructor(config: Config<PixelData, State>, initialState: State) {
    this.config = config;
    this.state = initialState;

    // Calculate Map
    const xs = config.pixels.map(p => p.x);
    const ys = config.pixels.map(p => p.y);
    this.map = {
      xMax: Math.max(...xs),
      xMin: Math.min(...xs),
      yMax: Math.max(...ys),
      yMin: Math.min(...ys)
    };
  }

  public renderFrame(): RenderResult<PixelData> {
    const result = this.config.root.render(this.map, this.config.pixels, this.state);
    if (result.length !== this.config.pixels.length) throw new Error('Unexpected number of pixels returned');
    return this.config.pixels.map((pixel, i) => ({
      pixel, output: result[i]
    }));
  }

  public updateState(state: State) {
    // TODO: transition
    this.state = state;
  }

}
