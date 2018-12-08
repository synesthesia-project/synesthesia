import * as React from 'react';

import * as proto from '../../shared/proto';

import {KEYS} from '../util/keys';

import {styled, rectButton} from './styling';

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
      <button className={this.props.className} onClick={this.onClick}>{this.props.info.text}</button>
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
  ${rectButton}
  outline: none;
  height: 30px;
`;

export {StyledButton as Button};
