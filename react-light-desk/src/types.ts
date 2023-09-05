import type {
  Events as GroupEvents,
  Props as GroupProps,
} from '@synesthesia-project/light-desk/build/backend/components/group';
import type {
  Events as ButtonEvents,
  Props as ButtonProps,
} from '@synesthesia-project/light-desk/build/backend/components/button';
import type { Props as LabelProps } from '@synesthesia-project/light-desk/build/backend/components/label';
import type { Props as RectProps } from '@synesthesia-project/light-desk/build/backend/components/rect';
import type {
  Events as SliderButtonEvents,
  Props as SliderButtonProps,
} from '@synesthesia-project/light-desk/build/backend/components/slider_button';
import type {
  Events as SwitchEvents,
  Props as SwitchProps,
} from '@synesthesia-project/light-desk/build/backend/components/switch';
import type {
  TabProps,
  TabsProps,
} from '@synesthesia-project/light-desk/build/backend/components/tabs';
import type {
  Events as TextInputEvents,
  Props as TextInputProps,
} from '@synesthesia-project/light-desk/build/backend/components/text-input';

type Children = JSX.Element | string | (string | JSX.Element)[];

export interface LightDeskIntrinsicElements {
  button: ButtonProps & {
    children?: never;
    onClick?: ButtonEvents['click'];
  };
  group: GroupProps & {
    children?: Children;
    onTitleChanged?: GroupEvents['title-changed'];
  };
  'group-header': {
    children?: Children;
  };
  label: LabelProps & {
    children?: never;
  };
  rect: RectProps & {
    children?: never;
  };
  'slider-button': SliderButtonProps & {
    children?: never;
    onChange?: SliderButtonEvents['change'];
  };
  switch: SwitchProps & {
    children?: never;
    onChange?: SwitchEvents['change'];
  };
  tab: TabProps & {
    children?: JSX.Element | string;
  };
  tabs: TabsProps & {
    children?: JSX.Element | JSX.Element[];
  };
  'text-input': TextInputProps & {
    children?: JSX.Element | JSX.Element[];
    onChange?: TextInputEvents['change'];
  };
}
