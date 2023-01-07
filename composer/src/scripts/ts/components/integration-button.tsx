import * as React from 'react';

import { styled } from './styling';

import { IntegrationSource } from '../sources/integration-source';
import { IntegrationSettings } from '../../../../dist/integration/shared';

type ConnectionState = 'not_connected' | 'connecting' | 'connected' | 'error';

interface Props {
  className?: string;
  settings: IntegrationSettings;
  integration: IntegrationSource;
}

interface State {
  state: ConnectionState;
}

class IntegrationButton extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = {
      state: 'not_connected',
    };

    this.onClick = this.onClick.bind(this);
  }

  public componentDidMount() {
    this.props.integration.addListener('state', (state) => {
      this.setState({ state });
    });
  }

  private onClick() {
    switch (this.state.state) {
      case 'not_connected':
      case 'error':
        this.connect();
        break;
      case 'connected':
        this.disconnect();
        break;
    }
  }

  private connect() {
    this.props.integration.connect();
  }

  private disconnect() {
    this.props.integration.disconnect();
  }

  public render() {
    const buttonText = (() => {
      switch (this.state.state) {
        case 'not_connected':
          return `Connect to ${this.props.settings.name}`;
        case 'connecting':
          return 'Connecting...';
        case 'connected':
          return `Connected to ${this.props.settings.name}`;
        case 'error':
          return 'An error ocurred';
      }
    })();

    return (
      <div className={this.props.className}>
        <button className="connection-button" onClick={this.onClick}>
          {buttonText}
          <span className={`indicator ${this.state.state}`} />
        </button>
      </div>
    );
  }
}

const StyledIntegrationButton = styled(IntegrationButton)`
  display: flex;
  align-items: center;

  > .connection-button {
    > .indicator {
      display: inline-block;
      width: 6px;
      height: 6px;
      margin-left: 7px;
      border-radius: 10px;

      &.not_connected {
        border: 1px solid #999;
        width: 4px;
        height: 4px;
      }

      &.connecting {
        background-color: ${(p) => p.theme.colorAmber};
      }

      &.connected {
        background-color: ${(p) => p.theme.colorGreen};
      }

      &.error {
        background-color: ${(p) => p.theme.colorRed};
      }
    }
  }
`;

export { StyledIntegrationButton as IntegrationButton };
