import { CompositorModule, RenderMethod } from '.';

export class TransitionModule<State> implements CompositorModule<State> {
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
    module: CompositorModule<State>;
  }[];

  /**
   * Store when the last frame was calculated to know how much to advance the
   * transitions by
   */
  private lastFrame = Date.now();

  public constructor(init: CompositorModule<State>) {
    this.modules = [
      {
        transitionAmount: 1,
        transitionSpeed: 0,
        module: init,
      },
    ];
  }

  render: RenderMethod<State> = (map, pixels, state) => {
    // How many seconds since last frame
    const now = Date.now();
    const diff = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    // Calculate the current frame
    const result = this.modules[0].module.render(map, pixels, state);
    for (let i = 1; i < this.modules.length; i++) {
      const next = this.modules[i];
      const nextFrame = next.module.render(map, pixels, state);
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
    newPattern: CompositorModule<State>,
    transitionLengthSeconds: number
  ) => {
    this.modules.push({
      transitionAmount: 0,
      transitionSpeed: 1 / transitionLengthSeconds,
      module: newPattern,
    });
  };
}
