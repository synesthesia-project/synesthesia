import { CompositorModule, PixelInfo, RenderMethod } from '.';
import { RGBAColor } from '../color';

interface SplitterOpts<Map extends { [key: string]: CompositorModule }> {
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
export class SplitterModule<Map extends { [key: string]: CompositorModule }>
  implements CompositorModule
{
  private readonly opts: SplitterOpts<Map>;

  public constructor(opts: SplitterOpts<Map>) {
    this.opts = opts;
  }

  render: RenderMethod = (map, pixels) => {
    const frames: { [K in keyof Map]: RGBAColor[] } = {} as any;

    for (const [name, module] of Object.entries(this.opts.modules) as [
      keyof Map,
      CompositorModule
    ][]) {
      frames[name] = module.render(map, pixels);
    }

    return pixels.map((p, i) => frames[this.opts.selectModuleByPixel(p, i)][i]);
  };
}
