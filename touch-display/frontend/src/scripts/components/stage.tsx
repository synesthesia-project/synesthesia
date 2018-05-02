import * as React from 'react';

import {ThemeProvider, defaultTheme, styled} from './styling';

interface StageProps {
  className?: string;
}

class Stage extends React.Component<StageProps, {}> {
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
