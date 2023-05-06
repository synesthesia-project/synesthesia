import { CompositorModule, PixelInfo, RenderMethod } from '.';
import { RGBAColor } from '../color';

interface SplitterOpts<
  State,
  Map extends { [key: string]: CompositorModule<State> }
> {
  modules: Map;
  /**
   * Return the key of the module you're selecting
   */
  selectModuleByPixel: (pixel: PixelInfo<unknown>, index: number) => keyof Map;
}

/**
 * Provide multiple modules,
 * and choose which pixels use which modules
 */
export class SplitterModule<
  State,
  Map extends { [key: string]: CompositorModule<State> }
> implements CompositorModule<State>
{
  private readonly opts: SplitterOpts<State, Map>;

  public constructor(opts: SplitterOpts<State, Map>) {
    this.opts = opts;
  }

  render: RenderMethod<State> = (map, pixels, state) => {
    const frames: { [K in keyof Map]: RGBAColor[] } = {} as any;

    for (const [name, module] of Object.entries(this.opts.modules) as [
      keyof Map,
      CompositorModule<State>
    ][]) {
      frames[name] = module.render(map, pixels, state);
    }

    return pixels.map((p, i) => frames[this.opts.selectModuleByPixel(p, i)][i]);
  };
}
