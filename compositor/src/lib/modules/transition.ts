import { CompositorModule, RenderMethod } from '.';

export class TransitionModule implements CompositorModule {
  private readonly modules: {
    /**
     * Value from 0-1 that represents how far this module has transitioned in.
     *
     * For the first module, this makes no difference
     * (as it will always be fully transitioned-in)
     */
    transitionAmount: number;
    /**
     * What ratio to transition in 1 second
     */
    transitionSpeed: number;
    module: CompositorModule;
  }[];

  /**
   * Store when the last frame was calculated to know how much to advance the
   * transitions by
   */
  private lastFrame = Date.now();

  public constructor(init: CompositorModule) {
    this.modules = [
      {
        transitionAmount: 1,
        transitionSpeed: 0,
        module: init,
      },
    ];
  }

  render: RenderMethod = (map, pixels) => {
    // How many seconds since last frame
    const now = Date.now();
    const diff = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    // Calculate the current frame
    const result = this.modules[0].module.render(map, pixels);
    for (let i = 1; i < this.modules.length; i++) {
      const next = this.modules[i];
      const nextFrame = next.module.render(map, pixels);
      if (result.length !== nextFrame.length) {
        console.error('mismatched frame lengths');
      } else {
        for (let f = 0; f < result.length; f++) {
          result[f] = result[f].transition(nextFrame[f], next.transitionAmount);
        }
      }
    }
    // Advance transitions
    let sliceModules = 0;
    for (let i = 1; i < this.modules.length; i++) {
      const next = this.modules[i];
      next.transitionAmount += diff * next.transitionSpeed;
      if (next.transitionAmount >= 1) {
        sliceModules = i;
      }
    }
    if (sliceModules > 0) {
      this.modules.splice(0, sliceModules);
    }
    return result;
  };

  transition = (
    newPattern: CompositorModule,
    transitionLengthSeconds: number
  ) => {
    this.modules.push({
      transitionAmount: 0,
      transitionSpeed: 1 / transitionLengthSeconds,
      module: newPattern,
    });
  };
}
