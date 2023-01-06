import * as React from 'react';
import {styled} from '../styling';

interface PopupProps {
  className?: string;
  title: string;
}

class Popup extends React.Component<PopupProps, Record<string, never>> {

  public render() {
    return (
      <div className={this.props.className}>
        <div className="title">
          {this.props.title}
        </div>
        <div className="contents">
          {this.props.children}
        </div>
      </div>
    );
  }
}

const StyledPopup = styled(Popup)`
  width: 400px;
  border: 1px solid ${p => p.theme.borderLighterer};
  background: ${p => p.theme.bg};
  display: flex;
  flex-direction: column;
  box-shadow: 0px 0px 8px 2px rgba(0, 0, 0, 0.4);
  margin: 0 auto;

  > .title {
    background: ${p => p.theme.bgLight1};
    padding: ${p => p.theme.spacingPx * 2}px;
    font-size: 14px;
  }

  > .contents {
    min-height: 40px;
    box-shadow: inset 0px 0px 8px 0px rgba(0, 0, 0, 0.3);
    border: 1px solid ${p => p.theme.borderDark};
  }
`;

export {StyledPopup as Popup};
