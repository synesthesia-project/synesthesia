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

function nextColor(props: Props): GroupColor {
  if (props.info.style.noBorder) return props.color;
  switch (props.color) {
    case 'dark': return 'lighter';
    case 'lighter': return 'dark';
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
      <div className={this.props.className + (this.props.info.style.noBorder ? ' no-border' : '')}>
        {this.props.info.title ? (
          <div className="title">{this.props.info.title}</div>
        ) : null}
        <div className="children">
          {this.props.info.children.map(this.childComponent)}
        </div>
      </div>
    );
  }

  private childComponent(info: proto.Component): JSX.Element {
    switch (info.component) {
      case 'button':
      return <Button key={info.key} info={info} sendMessage={this.props.sendMessage} />;
      case 'group':
      return <StyledGroup key={info.key} info={info} sendMessage={this.props.sendMessage} color={nextColor(this.props)} />;
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
  background: ${p => p.color === 'dark' ? p.theme.bgDark1 : p.color === 'lighter' ?  p.theme.bg :  p.theme.bgLight1};
  border: 1px solid ${p => p.theme.borderDark};

  > .title {
    padding: 5px;
    background: ${p => p.theme.borderDark};
    border-bottom: 1px solid ${p => p.theme.borderDark};
  }

  > .children {
    padding: ${p => p.theme.spacingPx / 2}px;
    display: flex;
    flex-direction: ${p => p.info.style.direction === 'vertical' ? 'column' : 'row'};
    flex-wrap: ${p => p.info.style.wrap ? 'wrap' : 'nowrap'};
    box-shadow: inset 0px 0px 8px 0px rgba(0,0,0,0.3);
    ${p => p.info.style.direction === 'vertical' ? '' : 'align-items: center;'}

    > * {
      margin: ${p => p.theme.spacingPx / 2}px;
    }
  }

  &.no-border {
    background: none;
    border: none;
    margin: 0 !important;

    > .children {
      padding: 0;
      box-shadow: none;
    }
  }
`;

export {StyledGroup as Group};
