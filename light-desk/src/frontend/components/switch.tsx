import * as React from 'react';

import * as proto from '../../shared/proto';

import {KEYS} from '../util/keys';

import {styled} from './styling';

interface Props {
  className?: string;
  info: proto.SwitchComponent;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}

class Switch extends React.Component<Props, {}> {

  public constructor(props: Props) {
    super(props);

    this.onChange = this.onChange.bind(this);
  }

  public render() {
    return (
      <div className={this.props.className}>
        <input type="checkbox" checked={this.props.info.state === 'on'} onChange={this.onChange}/>
      </div>
    );
  }

  private onChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!this.props.sendMessage) return;
    this.props.sendMessage({
      type: 'component_message',
      componentKey: this.props.info.key,
      component: 'switch'
    });
  }
}

const StyledSwitch = styled(Switch)`

`;

export {StyledSwitch as Switch};
