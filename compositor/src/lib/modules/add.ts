import { RGBAColor } from '../color';
import { PixelMap, PixelInfo, CompositorModule } from './';

export function alphaCombine(bottom: RGBAColor, top: RGBAColor) {
  if (bottom.alpha === 0) return top;
  if (top.alpha === 0) return bottom;

  const alpha = 1 - (1 - top.alpha) * (1 - bottom.alpha);
  return new RGBAColor(
    Math.round(
      (top.r * top.alpha) / alpha +
        (bottom.r * bottom.alpha * (1 - top.alpha)) / alpha
    ),
    Math.round(
      (top.g * top.alpha) / alpha +
        (bottom.g * bottom.alpha * (1 - top.alpha)) / alpha
    ),
    Math.round(
      (top.b * top.alpha) / alpha +
        (bottom.b * bottom.alpha * (1 - top.alpha)) / alpha
    ),
    alpha
  );
}

/**
 * Combine the output of multiple modules together in an "additive" manner
 */
export default class AddModule<State> implements CompositorModule<State> {
  private readonly layers: CompositorModule<State>[];

  public constructor(layers: CompositorModule<State>[]) {
    if (layers.length === 0) throw new Error('must supply at least one layer');
    this.layers = layers;
  }

  public render(
    map: PixelMap,
    pixels: PixelInfo<unknown>[],
    state: State
  ): RGBAColor[] {
    const result = this.layers[0].render(map, pixels, state);
    if (result.length !== pixels.length)
      throw new Error('Unexpected number of pixels returned');
    for (let l = 1; l < this.layers.length; l++) {
      const layerResult = this.layers[l].render(map, pixels, state);
      if (layerResult.length !== pixels.length)
        throw new Error('Unexpected number of pixels returned');
      for (let i = 0; i < pixels.length; i++)
        result[i] = alphaCombine(result[i], layerResult[i]);
    }
    return result;
  }
}
