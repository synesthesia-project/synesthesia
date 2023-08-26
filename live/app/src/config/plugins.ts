import {
  ConfigApplyer,
  ConfigUpdater,
} from '@synesthesia-project/live-core/lib/util';
import { ConfigSection } from '@synesthesia-project/live-core/src/plugins';
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
  ): ConfigSection<T>;
  applyConfig: ConfigApplyer<PluginConfig | undefined>;
};

interface ConfigSectionImplementation<T> extends ConfigSection<T> {
  applyConfig: ConfigApplyer<unknown>;
}

const get = <T>(config: unknown, type: t.Type<T>): T => {
  const decoded = type.decode(config);
  if (isRight(decoded)) {
    return decoded.right;
  }
  throw new Error(`Invalid config: ${JSON.stringify(decoded.left)}`);
};

const createConfigSection = <T>(
  type: t.Type<T>,
  defaultValue: T,
  updateConfig: ConfigUpdater<unknown>
): ConfigSectionImplementation<T> => {
  let config: T = defaultValue;
  const listeners = new Set<(config: T) => void>();

  return {
    addListener: (listener) => {
      listeners.add(listener);
      listener(config);
    },
    updateConfig: (update) =>
      updateConfig((current) => update(get(current, type))),
    applyConfig: (newConfig) => {
      if (newConfig !== config) {
        config = get(newConfig, type);
        for (const listener of listeners) {
          listener(config);
        }
      }
    },
  };
};

export const createPluginConfigManager = (
  updateConfig: ConfigUpdater<PluginConfig>
): PluginConfigManager => {
  const sections = new Map<string, ConfigSectionImplementation<unknown>>();

  return {
    createConfigSection: (name, type, defaultValue) => {
      if (sections.has(name)) {
        throw new Error(`Config section ${name} already exists`);
      }
      const updateSectionConfig: ConfigUpdater<unknown> = (update) =>
        updateConfig((current) => ({
          ...current,
          [name]: update(current?.[name] ?? defaultValue),
        }));
      const section = createConfigSection(
        type,
        defaultValue,
        updateSectionConfig
      );
      sections.set(name, section as ConfigSectionImplementation<unknown>);
      return section;
    },
    applyConfig: (config, oldConfig) => {
      if (oldConfig !== config) {
        for (const [sectionName, section] of sections.entries()) {
          if (config?.[sectionName] !== oldConfig?.[sectionName]) {
            section.applyConfig(
              config?.[sectionName],
              oldConfig?.[sectionName]
            );
          }
        }
      }
    },
  };
};
