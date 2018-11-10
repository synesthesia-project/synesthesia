import * as React from 'react';

import {ThemeProvider, defaultTheme, styled} from './styling';

interface StageProps {
  className?: string;
}

class Stage extends React.Component<StageProps, {}> {

  public contructor() {
    const socket = new WebSocket(`ws://${window.location.hostname}:${window.location.port}`);
    socket.onmessage = event => {
      console.log('msg', event.data);
    };
  }

  public componentDidMount() {
    console.log('mounted, opening socket');
    const socket = new WebSocket(`ws://${window.location.hostname}:${window.location.port}`);
    socket.onmessage = event => {
      console.log('msg', event.data);
    };
  }

  public render() {
    return (
      <div className={this.props.className}>
        Hello There!
      </div>
    );
  }
}

const StyledStage = styled(Stage)`
  width: 100%;
  height: 100%;
  background-color: #333;
  color: #fff;
`;

export function rootComponent() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <StyledStage/>
    </ThemeProvider>
  );
}
