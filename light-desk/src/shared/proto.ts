import * as styles from './styles';

/** JSON version of [[RGBColor]] */
export type RGBAColorJSON = {
  type: 'rgba';
  r: number;
  g: number;
  b: number;
  a: number;
};

/** An object that can be used directly in JSON to represent a [[Color]] */
export type ColorJSON = RGBAColorJSON;

interface BaseComponent {
  key: number;
}

export interface ButtonComponent extends BaseComponent {
  component: 'button';
  text: string;
  icon?: string;
  state:
    | {
        state: 'normal' | 'pressed';
      }
    | {
        state: 'error';
        error: string;
      };
}

export type GroupCollapsedState = 'open' | 'closed';

export type DefaultGroupCollapsedState = GroupCollapsedState | 'auto';

export interface GroupHeaderComponent extends BaseComponent {
  component: 'group-header';
  children: Component[];
}

export interface GroupComponent extends BaseComponent {
  component: 'group';
  title?: string;
  style: styles.GroupComponentStyle;
  children: Component[];
  headers?: GroupHeaderComponent[];
  labels?: Array<{
    text: string;
  }>;
  editableTitle: boolean;
  /**
   * If set, allows the group to be collapsed,
   * by default set to the given state
   */
  defaultCollapsibleState?: DefaultGroupCollapsedState;
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

export interface TabComponent extends BaseComponent {
  component: 'tab';
  name: string;
  child?: Component;
}

export interface TabsComponent extends BaseComponent {
  component: 'tabs';
  tabs: TabComponent[];
}

export interface TextInputComponent extends BaseComponent {
  component: 'text-input';
  value: string;
}

export type Component =
  | ButtonComponent
  | GroupHeaderComponent
  | GroupComponent
  | LabelComponent
  | RectComponent
  | SliderButtonComponent
  | SwitchComponent
  | TabComponent
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

export interface GroupTitleChangeMessage extends BaseClientComponentMessage {
  component: 'group';
  title: string;
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
  | GroupTitleChangeMessage
  | SwitchToggleMessage
  | TextInputUpdateMessage;

export type ClientMessage = ClientComponentMessage;
