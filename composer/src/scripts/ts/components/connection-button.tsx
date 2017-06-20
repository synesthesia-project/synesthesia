import * as React from 'react';

import SettingsEthernet = require('react-icons/lib/md/settings-ethernet');

type ConnectionState = 'not_connected' | 'connecting' | 'connected' | 'error';

interface ConnectionButtonState {
  state: ConnectionState;
}

export class ConnectionButton extends React.Component<{}, ConnectionButtonState> {

  public constructor() {
    super();
    this.state = {
      state: 'not_connected'
    };
  }

  public render() {

    const buttonTitle = (() => {
      switch (this.state.state) {
        case 'not_connected': return 'Connect to Consumer';
        case 'connecting': return 'Connecting...';
        case 'connected': return 'Connected to Consumer';
        case 'error': return 'An error ocurred';
      }
    })();

    return (
      <button className="connection-button" title={buttonTitle}>
        <SettingsEthernet/>
        <span className={`indicator ${this.state.state}`} />
      </button>
    );
  }
}
