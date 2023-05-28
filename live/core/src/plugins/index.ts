import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import {
  CompositorModule,
  PixelInfo,
  PixelMap,
} from '@synesthesia-project/compositor/lib/modules';
import { RGBAColor } from '@synesthesia-project/compositor/lib/color';
import { OptionalKindAndConfig } from '../config';

export interface PluginContext {
  registerOutputKind<T>(outputKind: OutputKind<T>): void;
  registerInputKind<T>(inputKind: InputKind<T>): void;
}

export interface Plugin {
  init(context: PluginContext): unknown;
}

export interface ModuleContext<ConfigT> {
  saveConfig(config: ConfigT): Promise<void>;
}

/**
 * A handle given to any new output that can be used by the
 * output to interact with the stage and its context.
 */
export interface OutputContext<ConfigT> extends ModuleContext<ConfigT> {
  render(pixelMap: PixelMap, pixels: Array<PixelInfo<unknown>>): RGBAColor[];
}

export interface InputContext<ConfigT> extends ModuleContext<ConfigT> {
  createInputSocket(context: {
    saveConfig(config: OptionalKindAndConfig): Promise<void>;
    groupConfig?: {
      additionalButtons: ld.Button[];
    };
  }): Input<OptionalKindAndConfig>;
}

export interface Module<ConfigT> {
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

export type Output<ConfigT> = Module<ConfigT>;

export interface Input<ConfigT> extends Module<ConfigT> {
  getModlue(): CompositorModule<unknown>;
}

export interface ModuleKind<ConfigT> {
  kind: string;
  config: t.Type<ConfigT>;
  initialConfig: ConfigT;
}

export interface OutputKind<ConfigT> extends ModuleKind<ConfigT> {
  create: (context: OutputContext<ConfigT>) => Output<ConfigT>;
}

export interface InputKind<ConfigT> extends ModuleKind<ConfigT> {
  create: (context: InputContext<ConfigT>) => Input<ConfigT>;
}
