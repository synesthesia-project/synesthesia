import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import {
  PixelInfo,
  PixelMap,
} from '@synesthesia-project/compositor/lib/modules';
import { RGBAColor } from '@synesthesia-project/compositor/lib/color';

export interface PluginContext {
  registerOutputKind<T>(outputKind: OutputKind<T>): void;
}

export interface Plugin {
  init(context: PluginContext): unknown;
}

/**
 * A handle given to any new output that can be used by the
 * output to interact with the stage and its context.
 */
export interface OutputContext<ConfigT> {
  saveConfig(config: ConfigT): Promise<void>;
  render(pixelMap: PixelMap, pixels: Array<PixelInfo<unknown>>): RGBAColor[];
}

export interface Output<ConfigT> {
  /**
   * Inform the output of a change to its config,
   * or load it for the first time.
   */
  setConfig(config: ConfigT): unknown;
  getLightDeskComponent(): ld.Component;
  /**
   * Inform the output that is about to be removed and should shut down
   */
  destroy(): void;
}

export interface OutputKind<ConfigT> {
  kind: string;
  config: t.Type<ConfigT>;
  create: (context: OutputContext<ConfigT>) => Output<ConfigT>;
  initialConfig: ConfigT;
}
