
interface BaseComponent {
  key: number;
}

export interface GroupComponent extends BaseComponent {
  component: 'group';
  children: Component[];
}

export interface SliderComponent extends BaseComponent {
  component: 'slider';
  min: number;
  max: number;
  step: number;
  value: number | null;
}

export interface LabelComponent extends BaseComponent {
  component: 'label';
  text: string;
}

export type Component = GroupComponent | SliderComponent | LabelComponent;

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

export type ClientComponentMessage = SliderUpdateMessage;

export type ClientMessage = ClientComponentMessage;
