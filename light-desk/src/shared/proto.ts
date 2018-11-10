
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
}

export type Component = GroupComponent | SliderComponent;

export interface UpdateTreeMsg {
  type: 'update_tree';
  root: GroupComponent;
}

export type ServerMessage = UpdateTreeMsg;
