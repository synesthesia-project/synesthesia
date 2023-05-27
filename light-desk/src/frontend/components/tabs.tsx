import * as React from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';

import { calculateClass } from '../util/react';
import { StageContext } from './context';
import { play } from '../audio';
import { NestedContent } from './nesting';

interface Props {
  info: proto.TabsComponent;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: ${(p) => p.theme.borderDark};
  border: 1px solid ${(p) => p.theme.borderDark};
`;

const TabList = styled.div`
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid ${(p) => p.theme.borderDark};
`;

const TabItem = styled.div`
  height: ${(p) => p.theme.spacingPx * 3}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 ${(p) => p.theme.spacingPx}px;
  cursor: pointer;
  background: ${(p) => p.theme.bgDark1};
  margin-right: 1px;

  &:hover,
  &.touching {
    background: ${(p) => p.theme.bgLight1};
  }

  &.current {
    color: ${(p) => p.theme.hint};

    &::after {
      content: '';
      border-bottom: 2px solid ${(p) => p.theme.hint};
      display: block;
      margin-top: ${(p) => p.theme.spacingPx / 2}px;
    }
  }
`;

const Tabs: React.FunctionComponent<Props> = (props) => {
  const { renderComponent } = React.useContext(StageContext);
  const [touching, setTouching] = React.useState<null | number>(null);
  const [currentTab, setCurrentTab] = React.useState<number>(0);
  const tab = props.info.tabs[currentTab];

  return (
    <Wrapper>
      <TabList>
        {props.info.tabs.map((tab, i) => (
          <TabItem
            key={i}
            className={calculateClass(
              touching === i && 'touching',
              currentTab === i && 'current'
            )}
            onClick={() => setCurrentTab(i)}
            onTouchStart={(event) => {
              play('touch');
              event.preventDefault();
              setTouching(i);
            }}
            onTouchEnd={(event) => {
              event.preventDefault();
              setTouching(null);
              setCurrentTab(i);
            }}
          >
            {tab.name}
          </TabItem>
        ))}
      </TabList>
      <NestedContent>{tab && renderComponent(tab.component)}</NestedContent>
    </Wrapper>
  );
};

export { Tabs };
