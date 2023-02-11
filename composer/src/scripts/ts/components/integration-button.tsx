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

const IntegrationButton: React.FunctionComponent<Props> = ({
  className,
  integration,
  settings,
}) => {
  const [state, setState] = React.useState<ConnectionState>('not_connected');

  React.useEffect(() => {
    integration.addListener('state', setState);

    return () => {
      integration.removeListener('state', setState);
    };
  }, []);

  const onClick = () => {
    switch (state) {
      case 'not_connected':
      case 'error':
        integration.connect();
        break;
      case 'connected':
        integration.disconnect();
        break;
    }
  };

  const buttonText = (() => {
    switch (state) {
      case 'not_connected':
        return `Connect to ${settings.name}`;
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return `Connected to ${settings.name}`;
      case 'error':
        return 'An error ocurred';
    }
  })();

  return (
    <div className={className}>
      <button className="connection-button" onClick={onClick}>
        {buttonText}
        <span className={`indicator ${state}`} />
      </button>
    </div>
  );
};

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
