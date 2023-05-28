import * as styles from './styles';

/** JSON version of [[RGBColor]] */
export type RGBColorJSON = {
  type: 'rgb';
  r: number;
  g: number;
  b: number;
};

/** An object that can be used directly in JSON to represent a [[Color]] */
export type ColorJSON = RGBColorJSON;

interface BaseComponent {
  key: number;
}

export interface ButtonComponent extends BaseComponent {
  component: 'button';
  text: string;
  state:
    | {
        state: 'normal';
      }
    | {
        state: 'error';
        error: string;
      };
}

export interface GroupComponent extends BaseComponent {
  component: 'group';
  title?: string;
  style: styles.GroupComponentStyle;
  children: Component[];
  labels?: Array<{
    text: string;
  }>;
}

export interface LabelComponent extends BaseComponent {
  component: 'label';
  style: styles.LabelComponentStyle;
  text: string;
}

export interface RectComponent extends BaseComponent {
  component: 'rect';
  color: ColorJSON;
}

export interface SliderButtonComponent extends BaseComponent {
  component: 'slider_button';
  min: number;
  max: number;
  step: number;
  value: number | null;
}

export interface SwitchComponent extends BaseComponent {
  component: 'switch';
  state: 'on' | 'off';
}

export interface TabsComponent extends BaseComponent {
  component: 'tabs';
  tabs: Array<{
    name: string;
    component: Component;
  }>;
}

export interface TextInputComponent extends BaseComponent {
  component: 'text-input';
  value: string;
}

export type Component =
  | ButtonComponent
  | GroupComponent
  | LabelComponent
  | RectComponent
  | SliderButtonComponent
  | SwitchComponent
  | TabsComponent
  | TextInputComponent;

export interface UpdateTreeMsg {
  type: 'update_tree';
  root: GroupComponent;
}

export type ServerMessage = UpdateTreeMsg;

export interface BaseClientComponentMessage {
  type: 'component_message';
  componentKey: number;
}

export interface SliderButtonUpdateMessage extends BaseClientComponentMessage {
  component: 'slider_button';
  value: number;
}

export interface ButtonPressMessage extends BaseClientComponentMessage {
  component: 'button';
}

export interface SwitchToggleMessage extends BaseClientComponentMessage {
  component: 'switch';
}

export interface TextInputUpdateMessage extends BaseClientComponentMessage {
  component: 'text-input';
  value: string;
}

export type ClientComponentMessage =
  | SliderButtonUpdateMessage
  | ButtonPressMessage
  | SwitchToggleMessage
  | TextInputUpdateMessage;

export type ClientMessage = ClientComponentMessage;
