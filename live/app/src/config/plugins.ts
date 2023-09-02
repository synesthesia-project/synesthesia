import {
  ConfigNode,
} from '@synesthesia-project/live-core/lib/util';
import { isRight } from 'fp-ts/lib/Either';
import * as t from 'io-ts';

export const PLUGIN_CONFIG = t.union([
  t.undefined,
  t.record(t.string, t.unknown),
]);

export type PluginConfig = t.TypeOf<typeof PLUGIN_CONFIG>;

export type PluginConfigManager = {
  createConfigSection<T>(
    name: string,
    type: t.Type<T>,
    defaultValue: T
  ): ConfigNode<T>;
};

const getDecoded = <T>(config: unknown, type: t.Type<T>): T => {
  const decoded = type.decode(config);
  if (isRight(decoded)) {
    return decoded.right;
  }
  throw new Error(`Invalid config: ${JSON.stringify(decoded.left)}`);
};

export const createPluginConfigManager = (
  config: ConfigNode<PluginConfig>
): PluginConfigManager => {
  const sections = new Map<string, ConfigNode<unknown>>();

  return {
    createConfigSection: <T>(name: string, type: t.Type<T>, defaultValue: T) => {
      if (sections.has(name)) {
        throw new Error(`Config section ${name} already exists`);
      }
      const child = config.createChild({
        get: (config) => getDecoded(config?.[name], type),
        updateParentByChild: (current, updateChild) => ({
          ...current,
          [name]: updateChild(current?.[name] as (T | undefined) ?? defaultValue),
        }),
        del: (current) => {
          const newConfig = { ...current };
          delete newConfig[name];
          sections.delete(name);
          return newConfig;
        }
      })

      sections.set(name, child as ConfigNode<unknown>);
      return child;
    },
  };
};
