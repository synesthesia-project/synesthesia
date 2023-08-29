export const isDefined = <T>(v: T | undefined | null): v is T =>
  v !== undefined && v !== null;

export const CONFIG_DELETED = Symbol('CONFIG_DELETED');

export type ConfigUpdate<T> = (current: T) => T;
export type ConfigUpdater<T> = (update: ConfigUpdate<T>) => Promise<void>;
export type ConfigApplyer<T> = (
  config: T | typeof CONFIG_DELETED,
  oldConfig: T | null
) => void;

type CreateChildParams<ParentT, ChildT> = {
  /**
   * Retrieve the current child config from the parent config.
   */
  get: (current: ParentT) => ChildT | typeof CONFIG_DELETED;
  /**
   * Take the current (parent) config,
   * and a modification to the child config,
   * and return the resulting parent config.
   */
  updateParentByChild: (current: ParentT, update: ConfigUpdate<ChildT>) => ParentT;
  /**
   * Take the current (parent) config,
   * and return a new config with the child config removed.
   */
  del?: (current: ParentT) => ParentT;
}

export type ConfigNode<T> = {
  /**
   * Receive a config change from a parent.
   */
  apply: ConfigApplyer<T>;
  /**
   * Make a change to the config,
   * and propigate the change to the ancestors.
   *
   * This should eventually trigger the change event,
   * once the change has propigated back to all children.
   */
  update: ConfigUpdater<T>;
  /**
   * delete the current config.
   */
  delete: () => void;
  createChild: <ChildT>(
    params: CreateChildParams<T, ChildT>
  ) => ConfigNode<ChildT>;
  addListener(event: 'change', listener: ConfigApplyer<T>): void;
  removeListener(event: 'change', listener: ConfigApplyer<T>): void;
};

export const configNode = <T>({ update, del } : {
  update: ConfigUpdater<T>,
  del?: () => void,
}): ConfigNode<T> => {
  const listeners = new Set<ConfigApplyer<T>>();

  const createChild = <ChildT>({ get, updateParentByChild, del }: CreateChildParams<T, ChildT>): ConfigNode<ChildT> => {
    const child = configNode<ChildT>({
      update: (childUpdate) => update((current) => updateParentByChild(current, childUpdate)),
      del: del && (() => update((current) => del(current))),
    });

    const listener: ConfigApplyer<T> = (newConfig, oldConfig) => {
      const newChildConfig =
        newConfig === CONFIG_DELETED ? CONFIG_DELETED : get(newConfig);
      let oldChildConfig = oldConfig && get(oldConfig);
      if (oldChildConfig === CONFIG_DELETED) oldChildConfig = null;
      if (newChildConfig !== oldChildConfig)
        child.apply(newChildConfig, oldChildConfig);
      if (newChildConfig !== CONFIG_DELETED)
        listeners.delete(listener);
    };
    listeners.add(listener);
    return child;
  } 

  return {
    delete: () => {
      if (!del) throw new Error('delete not supported');
      del();
    },
    apply: (newConfig, oldConfig) => {
      if (newConfig === oldConfig) return;
      listeners.forEach((l) => l(newConfig, oldConfig));
    },
    update: update,
    createChild,
    addListener: (_, listener) => {
      listeners.add(listener);
    },
    removeListener: (_, listener) => {
      listeners.delete(listener);
    },
  };

};
