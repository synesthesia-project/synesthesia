import * as React from 'react';
import { LightDeskIntrinsicElements } from './types';

export const Button: React.FunctionComponent<
  LightDeskIntrinsicElements['button']
> = (props) => React.createElement('button', props, props.children);

export const Group: React.FunctionComponent<
  LightDeskIntrinsicElements['group']
> = (props) => React.createElement('group', props, props.children);

export const GroupHeader: React.FunctionComponent<
  LightDeskIntrinsicElements['group-header']
> = (props) => React.createElement('group-header', props, props.children);

export const Label: React.FunctionComponent<
  LightDeskIntrinsicElements['label']
> = (props) => React.createElement('label', props, props.children);

export const Rect: React.FunctionComponent<
  LightDeskIntrinsicElements['rect']
> = (props) => React.createElement('rect', props, props.children);

export const SliderButton: React.FunctionComponent<
  LightDeskIntrinsicElements['slider-button']
> = (props) => React.createElement('slider-button', props, props.children);

export const Switch: React.FunctionComponent<
  LightDeskIntrinsicElements['switch']
> = (props) => React.createElement('switch', props, props.children);

export const Tab: React.FunctionComponent<LightDeskIntrinsicElements['tab']> = (
  props
) => React.createElement('tab', props, props.children);

export const Tabs: React.FunctionComponent<
  LightDeskIntrinsicElements['tabs']
> = (props) => React.createElement('tabs', props, props.children);

export const TextInput: React.FunctionComponent<
  LightDeskIntrinsicElements['text-input']
> = (props) => React.createElement('text-input', props, props.children);
