import * as React from 'react';

import * as proto from '../../shared/proto';

import {Button} from './button';
import {Label} from './label';
import {Slider} from './slider';
import {Switch} from './switch';

import {styled} from './styling';

type GroupColor = 'dark' | 'lighter' | 'lighterer';

interface Props {
  className?: string;
  info: proto.GroupComponent;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
  color: GroupColor;
}

function nextColor(color: GroupColor): GroupColor {
  switch (color) {
    case 'dark': return 'lighter';
    case 'lighter': return 'lighterer';
    case 'lighterer': return 'dark';
  }
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
      case 'button':
      return <Button key={info.key} info={info} sendMessage={this.props.sendMessage} />;
      case 'group':
      return <StyledGroup key={info.key} info={info} sendMessage={this.props.sendMessage} color={nextColor(this.props.color)} />;
      case 'label':
      return <Label key={info.key} info={info} />;
      case 'slider':
      return <Slider key={info.key} info={info} sendMessage={this.props.sendMessage} />;
      case 'switch':
      return <Switch key={info.key} info={info} sendMessage={this.props.sendMessage} />;
    }
  }
}

const StyledGroup = styled(Group)`
  background: ${p => p.color === 'dark' ? '#222' : p.color === 'lighter' ? '#292929' : '#333'};
  border: 1px solid #444;
  padding: ${p => p.theme.spacingPx / 2}px;
  display: flex;
  flex-direction: ${p => p.info.style.direction === 'vertical' ? 'column' : 'row'};
  flex-wrap: ${p => p.info.style.wrap ? 'wrap' : 'nowrap'};

  > * {
    margin: ${p => p.theme.spacingPx / 2}px;
  }
`;

export {StyledGroup as Group};
