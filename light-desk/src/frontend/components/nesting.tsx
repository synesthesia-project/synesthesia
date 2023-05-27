import * as React from 'react';
import styled from 'styled-components';
import { calculateClass } from '../util/react';

type GroupColor = 'dark' | 'lighter' | 'lighterer';

function nextColor(currentColor: GroupColor): GroupColor {
  switch (currentColor) {
    case 'dark':
      return 'lighter';
    case 'lighter':
      return 'dark';
    case 'lighterer':
      return 'dark';
  }
}

const LastNestedColor = React.createContext<GroupColor>('dark');

type NestContentProps = {
  className?: string;
  children: JSX.Element | JSX.Element[];
};

const NestedContent: React.FunctionComponent<NestContentProps> = ({
  className,
  children,
}) => {
  const color = React.useContext(LastNestedColor);

  return (
    <div className={calculateClass(className, `color-${color}`)}>
      <LastNestedColor.Provider value={nextColor(color)}>
        {children}
      </LastNestedColor.Provider>
    </div>
  );
};

NestedContent.displayName = 'NestedContent';

const StyledNestedContent = styled(NestedContent)`
  padding: ${(p) => p.theme.spacingPx / 2}px;
  box-shadow: inset 0px 0px 8px 0px rgba(0, 0, 0, 0.3);

  &.color-dark {
    background: ${(p) => p.theme.bgDark1};
  }

  &.color-lighter {
    background: ${(p) => p.theme.bg};
  }

  &.color-lighterer {
    background: ${(p) => p.theme.bgLight1};
  }
`;

export { StyledNestedContent as NestedContent };
