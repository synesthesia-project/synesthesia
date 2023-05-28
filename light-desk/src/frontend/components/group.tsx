import * as React from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';

import { calculateClass } from '../util/react';
import { StageContext } from './context';
import { NestedContent } from './nesting';
import { Button } from './button';

interface Props {
  className?: string;
  info: proto.GroupComponent;
}

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 5px 2px;
  background: ${(p) => p.theme.borderDark};
  border-bottom: 1px solid ${(p) => p.theme.borderDark};

  > * {
    margin: 0 3px;
  }
`;

const Label = styled.span`
  display: inline-block;
  border-radius: 3px;
  background: ${(p) => p.theme.bg};
  border: 1px solid ${(p) => p.theme.bgLight1};
  padding: 3px 4px;
`;

const Grow = styled.span`
  flex-grow: 1;
`;

const GroupChildren = styled.div<Pick<Props, 'info'>>`
  display: flex;
  flex-direction: ${(p) =>
    p.info.style.direction === 'vertical' ? 'column' : 'row'};
  flex-wrap: ${(p) => (p.info.style.wrap ? 'wrap' : 'nowrap')};
  ${(p) =>
    p.info.style.direction === 'vertical' ? '' : 'align-items: center;'}

  > * {
    margin: ${(p) => p.theme.spacingPx / 2}px;
  }
`;

const Group: React.FunctionComponent<Props> = (props) => {
  const { renderComponent } = React.useContext(StageContext);
  const children = (
    <GroupChildren info={props.info}>
      {props.info.children.map(renderComponent)}
    </GroupChildren>
  );

  const displayHeader = [
    props.info.title,
    props.info.labels?.length,
    props.info.headerButtons,
  ].some((v) => v);

  return (
    <div
      className={calculateClass(
        props.className,
        props.info.style.noBorder && 'no-border'
      )}
    >
      {displayHeader ? (
        <Header>
          {props.info.labels?.map((l) => (
            <Label>{l.text}</Label>
          ))}
          {props.info.title && <span>{props.info.title}</span>}
          <Grow />
          {props.info.headerButtons?.map((b) => (
            <Button info={b} />
          ))}
        </Header>
      ) : null}
      {props.info.style.noBorder ? (
        children
      ) : (
        <NestedContent>{children}</NestedContent>
      )}
    </div>
  );
};

Group.displayName = 'Group';

const StyledGroup = styled(Group)`
  border: 1px solid ${(p) => p.theme.borderDark};

  > .title {
    padding: 5px;
    background: ${(p) => p.theme.borderDark};
    border-bottom: 1px solid ${(p) => p.theme.borderDark};
  }

  &.no-border {
    border: none;
    margin: 0 !important;
  }
`;

export { StyledGroup as Group };
