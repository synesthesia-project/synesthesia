import * as React from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';

import { calculateClass } from '../util/react';
import { StageContext } from './context';
import { NestedContent } from './nesting';

interface Props {
  className?: string;
  info: proto.GroupComponent;
}

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

  return (
    <div
      className={calculateClass(
        props.className,
        props.info.style.noBorder && 'no-border'
      )}
    >
      {props.info.title ? (
        <div className="title">{props.info.title}</div>
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
