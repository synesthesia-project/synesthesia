import * as React from 'react';

import * as proto from '../../shared/proto';

import {KEYS} from '../util/keys';

import {styled} from './styling';

interface Props {
  className?: string;
  info: proto.ButtonComponent;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}

class Button extends React.Component<Props, {}> {

  public constructor(props: Props) {
    super(props);

    this.onClick = this.onClick.bind(this);
  }

  public render() {
    return (
      <div className={this.props.className}>
        <button onClick={this.onClick}>{this.props.info.text}</button>
      </div>
    );
  }

  private onClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!this.props.sendMessage) return;
    console.log('sending message');
    this.props.sendMessage({
      type: 'component_message',
      componentKey: this.props.info.key,
      component: 'button'
    });
  }
}

const StyledButton = styled(Button)`

`;

export {StyledButton as Button};
