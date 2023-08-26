import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import {
  CompositorModule,
  PixelInfo,
  PixelMap,
} from '@synesthesia-project/compositor/lib/modules';
import { RGBAColor } from '@synesthesia-project/compositor/lib/color';
import { OptionalKindAndConfig } from '../config';
import { EventRegister } from '../events';
import { Action } from '../actions';
import { ConfigApplyer, ConfigUpdater } from '../util';

export interface PluginContext {
  registerOutputKind<T>(outputKind: OutputKind<T>): void;
  registerInputKind<T>(inputKind: InputKind<T>): void;
  registerDeskComponent(component: ld.Component): void;
  registerEvent<T>(event: EventRegister<T>): void;
  registerAction<T>(action: Action<T>): void;
  createConfigSection<T>(
    name: string,
    type: t.Type<T>,
    defaultValue: T
  ): ConfigSection<T>;
  createTab(name: string, component: ld.Component): void;
}

export interface ConfigSection<T> {
  updateConfig: ConfigUpdater<T>;
  addListener(listener: (config: T) => void): void;
}

export interface Plugin {
  init(context: PluginContext): unknown;
}

export interface ModuleContext<ConfigT> {
  updateConfig: ConfigUpdater<ConfigT>;
}

export interface Channel {
  /**
   * A way to identify the channel for a human,
   * split up into path segments to allow for easier navigation for selecting
   * the channel.
   */
  name: string[];
  type: 'dmx';
}

/**
 * A handle given to any new output that can be used by the
 * output to interact with the stage and its context.
 */
export interface OutputContext<ConfigT> extends ModuleContext<ConfigT> {
  render(pixelMap: PixelMap, pixels: Array<PixelInfo<unknown>>): RGBAColor[];
  getChannelValues(): Map<string, number>;
  /**
   * Update the channels that are configured for this output.
   *
   * A map from channel UUIDs to their metadata.
   */
  setChannels(channels: Record<string, Channel>): void;
}

export interface InputContextGroupConfig {
  additionalButtons?: ld.Button[];
  title?: {
    text: string;
    /**
     * If set, allow the group's title to be changed by the user,
     * and call this callback when that is done.
     */
    update?: (text: string) => void;
  };
}

export interface InputSocket extends Input<OptionalKindAndConfig> {
  setGroupConfig(groupConfig: InputContextGroupConfig): void;
}

export interface InputContext<ConfigT> extends ModuleContext<ConfigT> {
  createInputSocket(context: {
    updateConfig: ConfigUpdater<OptionalKindAndConfig>;
    groupConfig?: InputContextGroupConfig;
  }): InputSocket;
}

export interface Module<ConfigT> {
  /**
   * Inform the output of a change to its config,
   * or load it for the first time.
   */
  applyConfig: ConfigApplyer<ConfigT>;
  getLightDeskComponent(): ld.Component;
  /**
   * Inform the output that is about to be removed and should shut down
   */
  destroy(): void;
}

export type Output<ConfigT> = Module<ConfigT>;

export interface Input<ConfigT> extends Module<ConfigT> {
  getModlue(): CompositorModule;
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
