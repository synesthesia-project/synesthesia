import * as React from 'react';
import {
  SyntheticEvent,
  EventHandler,
  FunctionComponent,
  useState,
  useContext,
  KeyboardEvent,
} from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';

import { calculateClass } from '../util/react';
import { StageContext } from './context';
import { NestedContent } from './nesting';
import { Button } from './button';
import { Icon } from './icon';
import { usePressable } from '../util/touch';

interface Props {
  className?: string;
  info: proto.GroupComponent;
}

const CollapseIcon = styled(Icon)({
  cursor: 'pointer',
});

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 5px 2px;
  background: ${(p) => p.theme.borderDark};
  border-bottom: 1px solid ${(p) => p.theme.borderDark};

  &.touching {
    background: ${(p) => p.theme.bgDark1};
  }

  &.collapsed {
    border-bottom: none;
  }

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

const Grow = styled.span({
  flexGrow: '1',
});

const CollapseBar = styled.span({
  flexGrow: '1',
  cursor: 'pointer',
  height: '30px',
});

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

const EditableTitle = styled.span`
  display: flex;
  align-items: center;
  border-radius: 3px;
  cursor: pointer;
  padding: 3px 2px;

  > * {
    margin: 0 2px;
  }

  > .icon {
    color: ${(p) => p.theme.bg};
  }

  &:hover {
    background: ${(p) => p.theme.bg};

    > .icon {
      color: ${(p) => p.theme.hint};
    }
  }
`;

const TitleInput = styled.input`
  background: none;
  border: none;
  outline: none;
  color: ${(p) => p.theme.textNormal};
`;

const GroupStateContext = React.createContext<{
  isCollapsed: (
    key: number,
    defaultState: proto.DefaultGroupCollapsedState
  ) => boolean;
  toggleCollapsed: (key: number) => void;
}>({
  isCollapsed: () => {
    throw new Error('missing GroupStateContext');
  },
  toggleCollapsed: () => {
    throw new Error('missing GroupStateContext');
  },
});

export const GroupStateWrapper: React.FunctionComponent<{
  /**
   * Whether new groups using `auto` should be open by default.
   */
  openByDefault: boolean;
  children: JSX.Element | JSX.Element[];
}> = ({ openByDefault, children }) => {
  const [state, setState] = useState<
    Record<number, proto.GroupCollapsedState | undefined>
  >({});

  const isCollapsed = (
    key: number,
    defaultState: proto.DefaultGroupCollapsedState
  ): boolean => {
    let match = state[key];
    if (!match) {
      match =
        defaultState === 'auto'
          ? openByDefault
            ? 'open'
            : 'closed'
          : defaultState;
      setState((current) => ({
        ...current,
        [key]: match,
      }));
    }
    return match === 'closed';
  };

  const toggleCollapsed = (key: number) => {
    setState((current) => ({
      ...current,
      [key]: current[key] === 'closed' ? 'open' : 'closed',
    }));
  };

  return (
    <GroupStateContext.Provider value={{ isCollapsed, toggleCollapsed }}>
      {children}
    </GroupStateContext.Provider>
  );
};

const Group: FunctionComponent<Props> = (props) => {
  const groupState = useContext(GroupStateContext);
  const { renderComponent, sendMessage } = useContext(StageContext);
  const [editingTitle, setEditingTitle] = useState(false);
  const children = (
    <GroupChildren info={props.info}>
      {props.info.children.map(renderComponent)}
    </GroupChildren>
  );
  const collapsible = !!props.info.defaultCollapsibleState;
  const collapsed = props.info.defaultCollapsibleState
    ? groupState.isCollapsed(props.info.key, props.info.defaultCollapsibleState)
    : false;
  const collapsePressable = usePressable(() =>
    groupState.toggleCollapsed(props.info.key)
  );

  const showTitle = props.info.title || props.info.editableTitle;

  const displayHeader = [
    showTitle,
    props.info.labels?.length,
    props.info.headerButtons,
    collapsible,
  ].some((v) => v);

  const updateTitle: EventHandler<SyntheticEvent<HTMLInputElement>> = (e) => {
    sendMessage?.({
      type: 'component_message',
      componentKey: props.info.key,
      component: 'group',
      title: e.currentTarget.value,
    });
    setEditingTitle(false);
  };

  const keyDown: EventHandler<KeyboardEvent<HTMLInputElement>> = (e) => {
    if (e.key == 'Enter') {
      updateTitle(e);
    }
  };

  const childrenElements = props.info.style.noBorder ? (
    children
  ) : (
    <NestedContent>{children}</NestedContent>
  );

  return (
    <div
      className={calculateClass(
        props.className,
        props.info.style.noBorder && 'no-border'
      )}
    >
      {displayHeader ? (
        <Header
          className={calculateClass(
            collapsePressable.touching && 'touching',
            collapsible && collapsed && 'collapsed'
          )}
        >
          {collapsible && (
            <CollapseIcon
              icon={collapsed ? 'arrow_right' : 'arrow_drop_down'}
              {...collapsePressable.handlers}
            />
          )}
          {props.info.labels?.map((l) => (
            <Label>{l.text}</Label>
          ))}
          {showTitle &&
            (props.info.editableTitle ? (
              editingTitle ? (
                <TitleInput
                  // Focus input when it's created
                  ref={(input) => input?.focus()}
                  onBlur={updateTitle}
                  onKeyDown={keyDown}
                  defaultValue={props.info.title}
                />
              ) : (
                <EditableTitle onClick={() => setEditingTitle(true)}>
                  <span>{props.info.title}</span>
                  <Icon className="icon" icon="edit" />
                </EditableTitle>
              )
            ) : (
              <span>{props.info.title}</span>
            ))}
          {collapsible ? (
            <CollapseBar {...collapsePressable.handlers} />
          ) : (
            <Grow />
          )}
          {props.info.headerButtons?.map((b) => (
            <Button info={b} />
          ))}
        </Header>
      ) : null}
      {collapsible && collapsed ? null : childrenElements}
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
