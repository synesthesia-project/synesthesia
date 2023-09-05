import * as Reconciler from 'react-reconciler';
import * as ld from '@synesthesia-project/light-desk';
import {
  Base,
  BaseParent,
} from '@synesthesia-project/light-desk/build/backend/components/base';
import { LightDeskIntrinsicElements } from './types';

export type { LightDeskIntrinsicElements };
export * from './components';

type Type = keyof LightDeskIntrinsicElements;
type Props = { [key: string]: any };
type Container = ld.Group;
type Instance = ld.Component;
type TextInstance = ld.Label;

type SuspenseInstance = any;
type HydratableInstance = any;
type PublicInstance = any;
type HostContext = any;
type UpdatePayload = any;
type _ChildSet = any;
type TimeoutHandle = any;
type NoTimeout = number;

type LightDeskHostConfig = Reconciler.HostConfig<
  Type,
  Props,
  Container,
  Instance,
  TextInstance,
  SuspenseInstance,
  HydratableInstance,
  PublicInstance,
  HostContext,
  UpdatePayload,
  _ChildSet,
  TimeoutHandle,
  NoTimeout
>;

const isType = <T extends keyof LightDeskIntrinsicElements>(
  targetType: T,
  type: Type,
  _props: Props
): _props is LightDeskIntrinsicElements[T] => targetType === type;

const canSetProps = (instance: ld.Component): instance is Base<unknown> =>
  instance instanceof Base;

const updateListener = <
  EventName extends string,
  Property extends string,
  Listener
>(
  eventName: EventName,
  property: Property,
  instance: {
    removeListener: (e: EventName, l: Listener) => void;
    addListener: (e: EventName, l: Listener) => void;
  },
  prevProps: {
    [key in Property]?: Listener;
  },
  nextProps: {
    [key in Property]?: Listener;
  }
) => {
  const prev = prevProps[property];
  const next = nextProps[property];
  if (prev !== next) {
    prev && instance.removeListener(eventName, prev);
    next && instance.addListener(eventName, next);
  }
};

const updateListeners = (
  type: Type,
  instance: ld.Component,
  prevProps: Props,
  nextProps: Props
) => {
  if (isType('button', type, prevProps) && isType('button', type, nextProps)) {
    if (instance instanceof ld.Button) {
      updateListener('click', 'onClick', instance, prevProps, nextProps);
    }
  } else if (
    isType('group', type, prevProps) &&
    isType('group', type, nextProps)
  ) {
    if (instance instanceof ld.Group) {
      updateListener(
        'title-changed',
        'onTitleChanged',
        instance,
        prevProps,
        nextProps
      );
    }
  } else if (
    isType('slider-button', type, prevProps) &&
    isType('slider-button', type, nextProps)
  ) {
    if (instance instanceof ld.SliderButton) {
      updateListener('change', 'onChange', instance, prevProps, nextProps);
    }
  } else if (
    isType('switch', type, prevProps) &&
    isType('switch', type, nextProps)
  ) {
    if (instance instanceof ld.Switch) {
      updateListener('change', 'onChange', instance, prevProps, nextProps);
    }
  } else if (
    isType('text-input', type, prevProps) &&
    isType('text-input', type, nextProps)
  ) {
    if (instance instanceof ld.TextInput) {
      updateListener('change', 'onChange', instance, prevProps, nextProps);
    }
  }
};

const hostConfig: LightDeskHostConfig = {
  supportsMutation: true,
  supportsPersistence: false,
  noTimeout: -1,
  isPrimaryRenderer: true,
  supportsHydration: false,

  appendChild: (parentInstance, child) => {
    if (parentInstance instanceof BaseParent) {
      parentInstance.appendChild(child);
    } else {
      throw new Error(`Unexpected Parent: ${parentInstance}`);
    }
  },
  appendInitialChild: (parentInstance, child) => {
    if (parentInstance instanceof BaseParent) {
      parentInstance.appendChild(child);
    } else {
      throw new Error(`Unexpected Parent: ${parentInstance}`);
    }
  },
  appendChildToContainer(container, child) {
    container.appendChild(child);
  },
  cancelTimeout: (id) => clearTimeout(id),
  clearContainer: (container) => container.removeAllChildren(),
  commitMount: () => {
    throw new Error(`Unexpected call to commitMount()`);
  },
  commitUpdate(
    instance,
    updatePayload,
    type,
    prevProps,
    nextProps,
    _internalHandle
  ) {
    if (canSetProps(instance)) {
      instance.setProps(updatePayload);
      updateListeners(type, instance, prevProps, nextProps);
    } else {
      throw new Error(`Unexpected Instance: ${instance}`);
    }
  },
  commitTextUpdate: (textInstance, _oldText, newText) =>
    textInstance.setText(newText),
  createInstance: (type, props) => {
    let instance: ld.Component | null = null;
    if (isType('button', type, props)) {
      instance = new ld.Button(props);
    } else if (isType('group', type, props)) {
      instance = new ld.Group(props);
    } else if (isType('group-header', type, props)) {
      instance = new ld.GroupHeader(props);
    } else if (isType('label', type, props)) {
      instance = new ld.Label(props);
    } else if (isType('rect', type, props)) {
      instance = new ld.Rect(props);
    } else if (isType('slider-button', type, props)) {
      instance = new ld.SliderButton(props);
    } else if (isType('switch', type, props)) {
      instance = new ld.Switch(props);
    } else if (isType('tab', type, props)) {
      instance = new ld.Tab(props);
    } else if (isType('tabs', type, props)) {
      instance = new ld.Tabs(props);
    } else if (isType('text-input', type, props)) {
      instance = new ld.TextInput(props);
    }
    if (instance) {
      updateListeners(type, instance, {}, props);
      return instance;
    } else {
      throw new Error(`Not implemented type: ${type}`);
    }
  },
  createTextInstance: (text) => new ld.Label({ text }),
  getChildHostContext: (parentHostContext) => parentHostContext,
  getPublicInstance: (instance) => instance,
  getRootHostContext: () => null,
  insertBefore: (parentInstance, child, beforeChild) => {
    if (parentInstance instanceof BaseParent) {
      parentInstance.insertBefore(child, beforeChild);
    } else {
      throw new Error(`Unexpected Parent: ${parentInstance}`);
    }
  },
  insertInContainerBefore: (container, child, beforeChild) =>
    container.insertBefore(child, beforeChild),
  finalizeInitialChildren: () => false,
  now: () => (Performance as any).now(),
  prepareForCommit: () => null,
  preparePortalMount: () => null,
  prepareUpdate: (
    _instance,
    _type,
    _oldProps,
    newProps,
    _rootContainer,
    _hostContext
  ) => {
    const updates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(newProps)) {
      // Filter out extra props from set properties
      if (key !== 'children') {
        updates[key] = val;
      }
    }
    if (Object.keys(updates).length) {
      return updates;
    } else {
      return null;
    }
  },
  removeChild(parentInstance, child) {
    if (parentInstance instanceof BaseParent) {
      parentInstance.removeChild(child);
    } else {
      throw new Error(`Unexpected Parent: ${parentInstance}`);
    }
  },
  removeChildFromContainer: (container, child) => container.removeChild(child),
  resetAfterCommit: () => null,
  resetTextContent: () => {
    throw new Error(`Unexpected call to resetTextContent()`);
  },
  scheduleTimeout: (fn, delay) => setTimeout(fn, delay),
  shouldSetTextContent: () => false,

  // Not-implemented
  hideInstance: () => {
    // eslint-disable-next-line no-console
    console.log('Not-implemented: hideInstance');
  },
  hideTextInstance: () => {
    // eslint-disable-next-line no-console
    console.log('Not-implemented: hideTextInstance');
  },
  unhideInstance: () => {
    // eslint-disable-next-line no-console
    console.log('Not-implemented: unhideInstance');
  },
  unhideTextInstance: () => {
    // eslint-disable-next-line no-console
    console.log('Not-implemented: unhideTextInstance');
  },
};

const reconciler = Reconciler(hostConfig as LightDeskHostConfig);

export const LightDeskRenderer = {
  render: (component: JSX.Element, container: ld.Group) => {
    const root = (reconciler as any).createContainer(container, 0, false, null);
    reconciler.updateContainer(component, root, null);
  },
};
