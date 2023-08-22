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
  setConfig(config: PluginConfig | undefined): void;
};

interface ConfigSectionImplementation<T> extends ConfigSection<T> {
  setConfig(config: unknown): void;
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
  saveConfig: (update: (current: unknown) => unknown) => void
): ConfigSectionImplementation<T> => {
  let config: T = defaultValue;
  const listeners = new Set<(config: T) => void>();

  return {
    addListener: (listener) => {
      listeners.add(listener);
      listener(config);
    },
    updateConfig: (update) =>
      saveConfig((current) => update(get(current, type))),
    setConfig: (newConfig) => {
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
  saveConfig: (update: (current: PluginConfig) => PluginConfig) => void
): PluginConfigManager => {
  let config: PluginConfig | undefined = undefined;

  const sections = new Map<string, ConfigSectionImplementation<unknown>>();

  return {
    createConfigSection: (name, type, defaultValue) => {
      if (sections.has(name)) {
        throw new Error(`Config section ${name} already exists`);
      }
      const saveSectionConfig = (update: (current: unknown) => unknown) => {
        saveConfig((current) => ({
          ...current,
          [name]: update(current?.[name] ?? defaultValue),
        }));
      };
      const section = createConfigSection(
        type,
        defaultValue,
        saveSectionConfig
      );
      sections.set(name, section);
      return section;
    },
    setConfig: (newConfig) => {
      if (config !== newConfig) {
        for (const [sectionName, section] of sections.entries()) {
          if (newConfig?.[sectionName] !== config?.[sectionName]) {
            section.setConfig(newConfig?.[sectionName]);
          }
        }
      }
      config = newConfig;
    },
  };
};
