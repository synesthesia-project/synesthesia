import * as proto from '../../shared/proto';
import { IDMap } from '../util/id-map';

import { Base } from './base';

type Listener = (value: string) => void;

type InternalProps = {
  value: string | null;
};

export type Props = Partial<InternalProps>;

const DEFAULT_PROPS: InternalProps = {
  value: null,
};

export class TextInput extends Base<InternalProps> {
  /** @hidden */
  private readonly listeners = new Set<Listener>();

  public constructor(props?: Props) {
    super(DEFAULT_PROPS, props);
  }

  /** @hidden */
  public getProtoInfo = (idMap: IDMap): proto.Component => {
    return {
      component: 'text-input',
      key: idMap.getId(this),
      value: this.props.value ?? '',
    };
  };

  /** @hidden */
  public handleMessage = (message: proto.ClientComponentMessage) => {
    if (message.component === 'text-input') {
      if (this.props.value !== message.value) {
        this.updateProps({ value: message.value });
        for (const l of this.listeners) {
          l(message.value);
        }
      }
    }
  };

  public addListener = (listener: Listener): TextInput => {
    this.listeners.add(listener);
    return this;
  };

  public getValue = () => this.props.value;

  public getValidatedValue = <T>(validator: (text: string) => T): null | T =>
    this.props.value === '' ? null : validator(this.props.value || '');

  public setValue = (value: string) => {
    this.updateProps({ value });
  };
}
