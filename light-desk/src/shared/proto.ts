
interface BaseComponent {
  key: number;
}

export interface GroupComponentStyle {
  direction: 'horizontal' | 'vertical';
  wrap?: boolean;
}

export interface GroupComponent extends BaseComponent {
  component: 'group';
  title?: string;
  style: GroupComponentStyle;
  children: Component[];
}

export interface SliderComponent extends BaseComponent {
  component: 'slider';
  min: number;
  max: number;
  step: number;
  value: number | null;
}

export interface LabelComponentStyle {
  bold?: boolean;
}

export interface LabelComponent extends BaseComponent {
  component: 'label';
  style: LabelComponentStyle;
  text: string;
}

export interface ButtonComponent extends BaseComponent {
  component: 'button';
  text: string;
}

export interface SwitchComponent extends BaseComponent {
  component: 'switch';
  state: 'on' | 'off';
}

export type Component = GroupComponent | SliderComponent | LabelComponent | ButtonComponent | SwitchComponent;

export interface UpdateTreeMsg {
  type: 'update_tree';
  root: GroupComponent;
}

export type ServerMessage = UpdateTreeMsg;

export interface BaseClientComponentMessage {
  type: 'component_message';
  componentKey: number;
}

export interface SliderUpdateMessage extends BaseClientComponentMessage {
  component: 'slider';
  value: number;
}

export interface ButtonPressMessage extends BaseClientComponentMessage {
  component: 'button';
}

export interface SwitchToggleMessage extends BaseClientComponentMessage {
  component: 'switch';
}

export type ClientComponentMessage = SliderUpdateMessage | ButtonPressMessage | SwitchToggleMessage;

export type ClientMessage = ClientComponentMessage;
