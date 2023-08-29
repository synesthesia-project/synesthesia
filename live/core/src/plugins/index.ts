import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import {
  CompositorModule,
  PixelInfo,
  PixelMap,
} from '@synesthesia-project/compositor/lib/modules';
import { RGBAColor } from '@synesthesia-project/compositor/lib/color';
import { EventRegister } from '../events';
import { Action } from '../actions';
import { ConfigNode } from '../util';

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
  ): ConfigNode<T>;
}

export interface Plugin {
  init(context: PluginContext): unknown;
}

export interface ModuleContext<ConfigT> {
  config: ConfigNode<ConfigT>;
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

export interface InputSocket extends Input {
  setGroupConfig(groupConfig: InputContextGroupConfig): void;
}

export interface InputContext<ConfigT> extends ModuleContext<ConfigT> {
  createInputSocket(context: {
    config: ConfigNode<ConfigT>;
    groupConfig?: InputContextGroupConfig;
  }): InputSocket;
}

export interface Module {
  getLightDeskComponent(): ld.Component;
}

export type Output = Module;

export interface Input extends Module {
  getModlue(): CompositorModule;
}

export interface ModuleKind<ConfigT> {
  kind: string;
  config: t.Type<ConfigT>;
  initialConfig: ConfigT;
}

export interface OutputKind<ConfigT> extends ModuleKind<ConfigT> {
  create: (context: OutputContext<ConfigT>) => Output;
}

export interface InputKind<ConfigT> extends ModuleKind<ConfigT> {
  create: (context: InputContext<ConfigT>) => Input;
}
