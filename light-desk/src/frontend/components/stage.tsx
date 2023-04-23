import * as React from 'react';
import styled, { ThemeProvider } from 'styled-components';

import * as proto from '../../shared/proto';

import {defaultTheme, GlobalStyle } from './styling';
import {Group} from './group';

interface Props {
  className?: string;
}

interface State {
  root: proto.GroupComponent | null;
  sendMessage: ((msg: proto.ClientMessage) => void) | null;
}

class Stage extends React.Component<Props, State> {

  private socket: Promise<WebSocket> | null = null;

  public constructor(props: Props) {
    super(props);
    this.state = {
      root: null,
      sendMessage: null
    };
  }

  public componentDidMount() {
    console.log('mounted');
    this.initializeWebsocket();
    this.setState({ sendMessage: this.sendMessage });
  }

  private initializeWebsocket = async () => {
    console.log('initializing websocket');
    const socket =
      new WebSocket(`ws://${window.location.hostname}:${window.location.port}${window.location.pathname}`);
    socket.onmessage = event => {
      console.log('message', event.data);
      this.handleMessage(JSON.parse(event.data));
    };
    socket.onclose = () => {
      console.log('socket closed');
      this.socket = null;
    }
    this.socket = new Promise<WebSocket>((resolve, reject) => {
      socket.onopen = () => {
        resolve(socket);
      }
      socket.onerror = (err) => {
        reject(err);
        this.socket = null;
      }
    });
    return socket;
  }

  private sendMessage = async (msg: proto.ClientMessage) => {
    (await (this.socket || this.initializeWebsocket())).send(JSON.stringify(msg))
  }

  private handleMessage(msg: proto.ServerMessage) {
    console.log('handleMessage', msg);
    switch (msg.type) {
      case 'update_tree':
        this.setState({root: msg.root});
        return;
    }
  }

  public render() {
    return (
      <div className={this.props.className}>
        {this.state.root ?
          <Group info={this.state.root} sendMessage={this.state.sendMessage} color="dark" /> :
          <div className="no-root">No root has been added to the light desk</div>}
      </div>
    );
  }
}

const StyledStage = styled(Stage)`
  width: 100%;
  height: 100%;
  background-color: #333;
  color: ${p => p.theme.textNormal};
  padding: ${p => p.theme.spacingPx}px;
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
