import * as React from 'react';

import * as proto from '../../shared/proto';

import {Slider} from './slider';
import {styled} from './styling';

interface Props {
  className?: string;
  info: proto.GroupComponent;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}

class Group extends React.Component<Props, {}> {

  public constructor(props: Props) {
    super(props);
    this.childComponent = this.childComponent.bind(this);
  }

  public render() {
    return (
      <div className={this.props.className}>
        {this.props.info.children.map(this.childComponent)}
      </div>
    );
  }

  private childComponent(info: proto.Component): JSX.Element {
    switch (info.component) {
      case 'group':
      return <StyledGroup key={info.key} info={info} sendMessage={this.props.sendMessage} />;
      case 'slider':
      return <Slider key={info.key} info={info} sendMessage={this.props.sendMessage} />;
    }
  }
}

const StyledGroup = styled(Group)`
  background: #222;
  border: 1px solid #444;
  padding: ${p => p.theme.spacingPx}px;
`;

export {StyledGroup as Group};
