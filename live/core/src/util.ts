import * as t from 'io-ts';
import { isRight } from 'fp-ts/lib/Either';

export const isDefined = <T>(v: T | undefined | null): v is T =>
  v !== undefined && v !== null;

export const CONFIG_MISSING = Symbol('CONFIG_MISSING');

export type ConfigUpdate<T> = (current: T) => T;
export type ConfigUpdater<T> = (update: ConfigUpdate<T>) => Promise<void>;
export type ConfigApplyer<T> = (config: T, oldConfig: T | null) => void;
export type ConfigListener<T> = (
  config: T | typeof CONFIG_MISSING,
  oldConfig: T | typeof CONFIG_MISSING
) => void;

interface CreateChildParams<ParentT, ChildT> {
  /**
   * Retrieve the current child config from the parent config.
   */
  get: (current: ParentT) => ChildT | typeof CONFIG_MISSING;
  /**
   * Take the current (parent) config,
   * and a modification to the child config,
   * and return the resulting parent config.
   */
  updateParentByChild: (
    current: ParentT,
    update: ConfigUpdate<ChildT>
  ) => ParentT;
  /**
   * Take the current (parent) config,
   * and return a new config with the child config removed.
   */
  del?: (current: ParentT) => ParentT;
}

interface CreateTypeCheckedChildParams<ParentT, ChildT>
  extends CreateChildParams<ParentT, unknown> {
  type: t.Type<ChildT>;
}

export type ConfigNode<T, InputT = T> = {
  get: () => T;
  /**
   * Receive a config change from a parent.
   */
  apply: (config: InputT | typeof CONFIG_MISSING) => void;
  /**
   * Make a change to the config,
   * and propigate the change to the ancestors.
   *
   * This should eventually trigger the change event,
   * once the change has propigated back to all children.
   */
  update: ConfigUpdater<T>;
  /**
   * delete the current config from the parent config.
   *
   * This should eventually trigger the change event,
   * once the change has propigated back to all children.
   */
  delete: () => void;
  /**
   * Unlink the current config from the parent config,
   * without updating the parent config.
   *
   * This will still update the state of this config to be CONFIG_MISSING.
   */
  unlink: () => void;
  createChild: <ChildT>(
    params: CreateChildParams<T, ChildT>
  ) => ConfigNode<ChildT>;
  createTypeCheckedChild: <ChildT>(
    params: CreateTypeCheckedChildParams<T, ChildT>
  ) => ConfigNode<ChildT>;
  addListener(event: 'change', listener: ConfigListener<T>): void;
  removeListener(event: 'change', listener: ConfigListener<T>): void;
};

const createChild = <ParentT, ChildT>(
  currentConfig: ParentT | typeof CONFIG_MISSING,
  listeners: Set<ConfigListener<ParentT>>,
  update: ConfigUpdater<ParentT>,
  { get, updateParentByChild, del }: CreateChildParams<ParentT, ChildT>
): ConfigNode<ChildT> => {
  const child = configNode<ChildT>({
    update: (childUpdate) =>
      update((current) => updateParentByChild(current, childUpdate)),
    del: del && (() => update((current) => del(current))),
    unlink: () => listeners.delete(listener),
  });

  const listener: ConfigListener<ParentT> = (newConfig, oldConfig) => {
    const newChildConfig =
      newConfig === CONFIG_MISSING ? CONFIG_MISSING : get(newConfig);
    const oldChildConfig =
      oldConfig === CONFIG_MISSING ? CONFIG_MISSING : get(oldConfig);
    if (newChildConfig !== oldChildConfig) child.apply(newChildConfig);
    if (newChildConfig !== CONFIG_MISSING) listeners.delete(listener);
  };
  listeners.add(listener);

  // Use setImmediate to propigate initial value for child config
  const initialConfig =
    currentConfig === CONFIG_MISSING ? CONFIG_MISSING : get(currentConfig);
  if (initialConfig !== CONFIG_MISSING) {
    setImmediate(() => {
      child.apply(initialConfig);
    });
  }

  return child;
};

const createTypeCheckedChild = <ParentT, ChildT>(
  currentConfig: ParentT | typeof CONFIG_MISSING,
  listeners: Set<ConfigListener<ParentT>>,
  update: ConfigUpdater<ParentT>,
  {
    type,
    get,
    updateParentByChild,
    del,
  }: CreateTypeCheckedChildParams<ParentT, ChildT>
): ConfigNode<ChildT> => {
  const child = typeCheckedConfigNode<ChildT>({
    type,
    update: (childUpdate) =>
      update((current) => updateParentByChild(current, childUpdate)),
    del: del && (() => update((current) => del(current))),
    unlink: () => listeners.delete(listener),
  });

  const listener: ConfigListener<ParentT> = (newConfig, oldConfig) => {
    const newChildConfig =
      newConfig === CONFIG_MISSING ? CONFIG_MISSING : get(newConfig);
    const oldChildConfig =
      oldConfig === CONFIG_MISSING ? CONFIG_MISSING : get(oldConfig);
    if (newChildConfig !== oldChildConfig) child.apply(newChildConfig);
    if (newChildConfig !== CONFIG_MISSING) listeners.delete(listener);
  };
  listeners.add(listener);

  // Use setImmediate to propigate initial value for child config
  const initialConfig =
    currentConfig === CONFIG_MISSING ? CONFIG_MISSING : get(currentConfig);
  if (initialConfig !== CONFIG_MISSING) {
    setImmediate(() => {
      child.apply(initialConfig);
    });
  }

  return child;
};

export const typeCheckedConfigNode = <T>({
  type,
  update,
  del,
  unlink,
}: {
  type: t.Type<T>;
  update: ConfigUpdater<unknown>;
  del?: () => void;
  unlink?: () => void;
}): ConfigNode<T, unknown> => {
  let currentConfig: T | typeof CONFIG_MISSING = CONFIG_MISSING;
  const listeners = new Set<ConfigListener<T>>();

  const doUpdate: ConfigUpdater<T> = (u) =>
    update((current) => {
      const validate = type.decode(current);
      if (isRight(validate)) {
        return u(validate.right);
      } else {
        throw new Error(`Invalid config: ${validate.left}`);
      }
    });

  const apply = (newConfig: unknown) => {
    if (newConfig !== currentConfig) {
      if (newConfig === CONFIG_MISSING) {
        listeners.forEach((l) => l(newConfig, currentConfig));
        currentConfig = newConfig;
      } else {
        const validatedConfig = type.decode(newConfig);
        if (isRight(validatedConfig)) {
          listeners.forEach((l) => l(validatedConfig.right, currentConfig));
          currentConfig = validatedConfig.right;
        } else {
          console.error(`Ignoring invalid config: ${validatedConfig.left}`);
        }
      }
    }
  };

  return {
    get: () => {
      if (currentConfig === CONFIG_MISSING)
        throw new Error('config not loaded');
      return currentConfig;
    },
    delete: () => {
      if (!del) throw new Error('delete not supported');
      del();
    },
    unlink: () => {
      if (!unlink) throw new Error('unlink not supported');
      unlink();
      apply(CONFIG_MISSING);
    },
    apply,
    update: doUpdate,
    createChild: (params) =>
      createChild(currentConfig, listeners, doUpdate, params),
    createTypeCheckedChild: (params) =>
      createTypeCheckedChild(currentConfig, listeners, doUpdate, params),
    addListener: (_, listener) => {
      listeners.add(listener);
    },
    removeListener: (_, listener) => {
      listeners.delete(listener);
    },
  };
};

export const configNode = <T>({
  update,
  del,
  unlink,
}: {
  update: ConfigUpdater<T>;
  del?: () => void;
  unlink?: () => void;
}): ConfigNode<T> => {
  let currentConfig: T | typeof CONFIG_MISSING = CONFIG_MISSING;
  const listeners = new Set<ConfigListener<T>>();

  const apply = (newConfig: T | typeof CONFIG_MISSING) => {
    if (newConfig !== currentConfig) {
      listeners.forEach((l) => l(newConfig, currentConfig));
      currentConfig = newConfig;
    }
  };

  return {
    get: () => {
      if (currentConfig === CONFIG_MISSING)
        throw new Error('config not loaded');
      return currentConfig;
    },
    delete: () => {
      if (!del) throw new Error('delete not supported');
      del();
    },
    unlink: () => {
      if (!unlink) throw new Error('unlink not supported');
      unlink();
      apply(CONFIG_MISSING);
    },
    apply,
    update: update,
    createChild: (params) =>
      createChild(currentConfig, listeners, update, params),
    createTypeCheckedChild: (params) =>
      createTypeCheckedChild(currentConfig, listeners, update, params),
    addListener: (_, listener) => {
      listeners.add(listener);
    },
    removeListener: (_, listener) => {
      listeners.delete(listener);
    },
  };
};
