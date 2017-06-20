import * as React from 'react';

import {overlays} from './util/overlays';

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

    this.onClick = this.onClick.bind(this);
  }

  private onClick() {
    switch (this.state.state) {
      case 'not_connected':
        this.connect();
        break;
    }
  }

  private connect() {
    overlays().requestInput('t', 'm', 'l', 'd');
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
      <button className="connection-button" title={buttonTitle} onClick={this.onClick}>
        <SettingsEthernet/>
        <span className={`indicator ${this.state.state}`} />
      </button>
    );
  }
}
