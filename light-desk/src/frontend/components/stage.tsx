import * as React from 'react';
import styled, { ThemeProvider } from 'styled-components';

import * as proto from '../../shared/proto';

import { defaultTheme, GlobalStyle } from './styling';
import { Button } from './button';
import { Group, GroupStateWrapper } from './group';
import { Label } from './label';
import { Rect } from './rect';
import { SliderButton } from './slider_button';
import { StageContext } from './context';
import { Switch } from './switch';
import { TextInput } from './text-input';
import { Tabs } from './tabs';

interface Props {
  className?: string;
}

interface State {
  root: proto.GroupComponent | null;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}

const renderComponent = (info: proto.Component): JSX.Element => {
  switch (info.component) {
    case 'button':
      return <Button key={info.key} info={info} />;
    case 'group':
      return <Group key={info.key} info={info} />;
    case 'label':
      return <Label key={info.key} info={info} />;
    case 'rect':
      return <Rect key={info.key} info={info} />;
    case 'slider_button':
      return <SliderButton key={info.key} info={info} />;
    case 'switch':
      return <Switch key={info.key} info={info} />;
    case 'tabs':
      return <Tabs key={info.key} info={info} />;
    case 'text-input':
      return <TextInput key={info.key} info={info} />;
    case 'group-header':
    case 'tab':
      throw new Error(
        `Cannot render ${info.component} outside of expected parents`
      );
  }
};

class Stage extends React.Component<Props, State> {
  private socket: Promise<WebSocket> | null = null;

  public constructor(props: Props) {
    super(props);
    this.state = {
      root: null,
      sendMessage: null,
    };
  }

  public componentDidMount() {
    console.log('mounted');
    this.initializeWebsocket();
    this.setState({ sendMessage: this.sendMessage });
  }

  private initializeWebsocket = async () => {
    console.log('initializing websocket');
    const socket = new WebSocket(
      `ws://${window.location.hostname}:${window.location.port}${window.location.pathname}`
    );
    socket.onmessage = (event) => {
      console.log('message', event.data);
      this.handleMessage(JSON.parse(event.data));
    };
    socket.onclose = () => {
      console.log('socket closed');
      this.socket = null;
    };
    this.socket = new Promise<WebSocket>((resolve, reject) => {
      socket.onopen = () => {
        resolve(socket);
      };
      socket.onerror = (err) => {
        reject(err);
        this.socket = null;
      };
    });
    return socket;
  };

  private sendMessage = async (msg: proto.ClientMessage) => {
    (await (this.socket || this.initializeWebsocket())).send(
      JSON.stringify(msg)
    );
  };

  private handleMessage(msg: proto.ServerMessage) {
    console.log('handleMessage', msg);
    switch (msg.type) {
      case 'update_tree':
        this.setState({ root: msg.root });
        return;
    }
  }

  public render() {
    return (
      <StageContext.Provider
        value={{
          sendMessage: this.state.sendMessage,
          renderComponent,
        }}
      >
        <GroupStateWrapper openByDefault={false}>
          <div className={this.props.className}>
            {this.state.root ? (
              <Group info={this.state.root} />
            ) : (
              <div className="no-root">
                No root has been added to the light desk
              </div>
            )}
          </div>
        </GroupStateWrapper>
      </StageContext.Provider>
    );
  }
}

const StyledStage = styled(Stage)`
  width: 100%;
  height: 100%;
  background-color: #333;
  color: ${(p) => p.theme.textNormal};
  padding: ${(p) => p.theme.spacingPx}px;
`;

export function rootComponent() {
  return (
    <>
      <GlobalStyle />
      <ThemeProvider theme={defaultTheme}>
        <StyledStage />
      </ThemeProvider>
    </>
  );
}
