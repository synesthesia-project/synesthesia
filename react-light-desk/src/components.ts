import * as React from 'react';
import type { LightDeskIntrinsicElements } from './types';
import type * as ld from '@synesthesia-project/light-desk';

export const Button = React.forwardRef<
  ld.Button,
  LightDeskIntrinsicElements['button']
>((props, ref) =>
  React.createElement('button', { ...props, ref }, props.children)
);

export const Group = React.forwardRef<
  ld.Group,
  LightDeskIntrinsicElements['group']
>((props, ref) =>
  React.createElement('group', { ...props, ref }, props.children)
);

export const GroupHeader = React.forwardRef<
  ld.GroupHeader,
  LightDeskIntrinsicElements['group-header']
>((props, ref) =>
  React.createElement('group-header', { ...props, ref }, props.children)
);

export const Label = React.forwardRef<
  ld.Label,
  LightDeskIntrinsicElements['label']
>((props, ref) =>
  React.createElement('label', { ...props, ref }, props.children)
);

export const Rect = React.forwardRef<
  ld.Rect,
  LightDeskIntrinsicElements['rect']
>((props, ref) =>
  React.createElement('rect', { ...props, ref }, props.children)
);

export const SliderButton = React.forwardRef<
  ld.SliderButton,
  LightDeskIntrinsicElements['slider-button']
>((props, ref) =>
  React.createElement('slider-button', { ...props, ref }, props.children)
);

export const Switch = React.forwardRef<
  ld.Switch,
  LightDeskIntrinsicElements['switch']
>((props, ref) =>
  React.createElement('switch', { ...props, ref }, props.children)
);

export const Tab = React.forwardRef<ld.Tab, LightDeskIntrinsicElements['tab']>(
  (props, ref) => React.createElement('tab', { ...props, ref }, props.children)
);

export const Tabs = React.forwardRef<
  ld.Tabs,
  LightDeskIntrinsicElements['tabs']
>((props, ref) =>
  React.createElement('tabs', { ...props, ref }, props.children)
);

export const TextInput = React.forwardRef<
  ld.TextInput,
  LightDeskIntrinsicElements['text-input']
>((props, ref) =>
  React.createElement('text-input', { ...props, ref }, props.children)
);
