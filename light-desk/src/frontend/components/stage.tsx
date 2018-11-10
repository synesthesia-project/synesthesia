import * as React from 'react';

import * as proto from '../../shared/proto';

import {ThemeProvider, defaultTheme, styled} from './styling';
import {Group} from './group';

interface Props {
  className?: string;
}

interface State {
  root: proto.GroupComponent | null;
}

class Stage extends React.Component<Props, State> {

  public constructor(props: Props) {
    super(props);
    this.state = {
      root: null
    };
  }

  public componentDidMount() {
    console.log('mounted, opening socket');
    const socket = new WebSocket(`ws://${window.location.hostname}:${window.location.port}`);
    socket.onmessage = event => {
      console.log('message', event.data);
      this.handleMessage(JSON.parse(event.data));
    };
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
          <Group info={this.state.root} /> :
          <div className="no-root">No root has been added to the light desk</div>}
      </div>
    );
  }
}

const StyledStage = styled(Stage)`
  width: 100%;
  height: 100%;
  background-color: #333;
  color: #fff;
  padding: ${p => p.theme.spacingPx}px;
`;

export function rootComponent() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <StyledStage />
    </ThemeProvider>
  );
}
