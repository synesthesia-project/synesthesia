import * as React from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';

import { Button } from './button';
import { Label } from './label';
import { Rect } from './rect';
import { SliderButton } from './slider_button';
import { Switch } from './switch';
import { TextInput } from './text-input';
import { calculateClass } from '../util/react';
import { StageContext } from './context';

type GroupColor = 'dark' | 'lighter' | 'lighterer';

interface Props {
  className?: string;
  info: proto.GroupComponent;
}

function nextColor(currentColor: GroupColor, props: Props): GroupColor {
  if (props.info.style.noBorder) return currentColor;
  switch (currentColor) {
    case 'dark':
      return 'lighter';
    case 'lighter':
      return 'dark';
    case 'lighterer':
      return 'dark';
  }
}

const LastGroupColor = React.createContext<GroupColor>('dark');

const childComponent = (
  info: proto.Component,
  sendMessage: ((msg: proto.ClientMessage) => void) | null
): JSX.Element => {
  switch (info.component) {
    case 'button':
      return <Button key={info.key} info={info} />;
    case 'group':
      return <StyledGroup key={info.key} info={info} />;
    case 'label':
      return <Label key={info.key} info={info} />;
    case 'rect':
      return <Rect key={info.key} info={info} />;
    case 'slider_button':
      return (
        <SliderButton key={info.key} info={info} sendMessage={sendMessage} />
      );
    case 'switch':
      return <Switch key={info.key} info={info} sendMessage={sendMessage} />;
    case 'text-input':
      return <TextInput key={info.key} info={info} sendMessage={sendMessage} />;
  }
};

const Group: React.FunctionComponent<Props> = (props) => {
  const { sendMessage } = React.useContext(StageContext);
  const color = React.useContext(LastGroupColor);

  return (
    <div
      className={calculateClass(
        props.className,
        props.info.style.noBorder && 'no-border',
        `color-${color}`
      )}
    >
      {props.info.title ? (
        <div className="title">{props.info.title}</div>
      ) : null}
      <div className="children">
        <LastGroupColor.Provider value={nextColor(color, props)}>
          {props.info.children.map((c) => childComponent(c, sendMessage))}
        </LastGroupColor.Provider>
      </div>
    </div>
  );
};

const StyledGroup = styled(Group)`
  border: 1px solid ${(p) => p.theme.borderDark};

  > .title {
    padding: 5px;
    background: ${(p) => p.theme.borderDark};
    border-bottom: 1px solid ${(p) => p.theme.borderDark};
  }

  > .children {
    padding: ${(p) => p.theme.spacingPx / 2}px;
    display: flex;
    flex-direction: ${(p) =>
      p.info.style.direction === 'vertical' ? 'column' : 'row'};
    flex-wrap: ${(p) => (p.info.style.wrap ? 'wrap' : 'nowrap')};
    box-shadow: inset 0px 0px 8px 0px rgba(0, 0, 0, 0.3);
    ${(p) =>
      p.info.style.direction === 'vertical' ? '' : 'align-items: center;'}

    > * {
      margin: ${(p) => p.theme.spacingPx / 2}px;
    }
  }

  &.color-dark {
    background: ${(p) => p.theme.bgDark1};
  }

  &.color-lighter {
    background: ${(p) => p.theme.bg};
  }

  &.color-lighterer {
    background: ${(p) => p.theme.bgLight1};
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

export { StyledGroup as Group };
