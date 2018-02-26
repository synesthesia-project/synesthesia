import * as React from 'react';
import * as shared from '../shared';
import {ControllerEndpoint} from '../shared/protocol';

import * as file from '../shared/file/file';
import * as func from '../data/functional';
import {styled} from './styling';

import {PlayState, PlayStateData} from '../data/play-state';
import {overlays} from './util/overlays';

import SettingsEthernet = require('react-icons/lib/md/settings-ethernet');

type ConnectionState = 'not_connected' | 'connecting' | 'connected' | 'error';

interface ConnectionButtonProps {
  className?: string;
  playState: PlayState;
  file: func.Maybe<file.CueFile>;
}

interface ConnectionButtonState {
  state: ConnectionState;
  host: string;
  lastPingData?: {
    ping: number;
    diff: number;
  };
}

const DEFAULT_HOST = 'localhost:' + shared.constants.DEFAULT_SYNESTHESIA_PORT;

class ConnectionButton extends React.Component<ConnectionButtonProps, ConnectionButtonState> {

  private socket: WebSocket | null = null;
  private endpoint: ControllerEndpoint | null = null;
  private lastSentState: PlayStateData | null = null;

  public constructor(props: ConnectionButtonProps) {
    super(props);
    this.state = {
      state: 'not_connected',
      host: DEFAULT_HOST
    };

    this.onClick = this.onClick.bind(this);
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
    overlays().requestInput(
      'Enter Consumer Details',
      'Enter the host for the consumer you want to connect to',
      'Host',
      this.state.host)
      .then(host => {
        this.setState({
          host,
          state: 'connecting'
        });
        const path = shared.constants.SYNESTHESIA_WEBSOCKET_PATH;
        console.log('got string: ', host);
        const socket = this.socket = new WebSocket(`ws://${host}${path}`);
        this.socket.onerror = (err) => {
          if (socket !== this.socket) return;
          console.error(err);
          this.setState({state: 'error'});
          this.socket = null;
        };
        this.socket.onopen = () => {
          if (socket !== this.socket) return;
          this.setState({state: 'connected'});
          const endpoint = this.endpoint = new ControllerEndpoint(
            msg => {
              if (socket !== this.socket) throw new Error('socket not open');
              socket.send(JSON.stringify(msg));
            },
            (ping, diff) => {
              this.setState({lastPingData: {ping, diff}});
            });
          socket.onmessage = msg => endpoint.recvMessage(JSON.parse(msg.data));
          socket.onclose = () => {
            endpoint.closed();
            if (socket !== this.socket) return;
            this.setState({state: 'not_connected'});
            this.socket = null;
            if (this.endpoint === endpoint)
              this.endpoint = null;
          };
          // Send initial state
          this.lastSentState = null;
          this.sendPlayStateIfChanged(this.props);
        };
      })
      .catch(err => {
        console.warn(err);
        this.setState({state: 'not_connected'});
      });
  }

  private sendPlayStateIfChanged(props: ConnectionButtonProps) {
    if (!this.endpoint) return;
    const newState = props.playState.caseOf({
      just: state => state,
      none: () => null
    });
    if (newState === this.lastSentState) return;
    this.lastSentState = newState;
    const state = newState ? newState.state.caseOf({
      left: pausedState => null,
      right: playingState => props.file.caseOf({
        just: file => ({
          effectiveStartTimeMillis: playingState.effectiveStartTimeMillis,
          file
        }),
        none: () => null
      })
    }) : null;
    this.endpoint.sendState(state);
  }

  public componentWillReceiveProps(nextProps: ConnectionButtonProps) {
    this.sendPlayStateIfChanged(nextProps);
  }

  private disconnect() {
    // TODO: add confirmation dialog to disconnect
    if (this.socket) {
      this.socket.close();
    }
  }

  public render() {

    const statusText = (() => {
      if (this.state.state === 'connected' && this.state.lastPingData) {
        const ping = this.state.lastPingData.ping;
        const diff = this.state.lastPingData.diff;
        return <span className="connectionInfo">{ `Ping: ${ping}ms, Diff: ${diff}ms`}</span>;
      }
      return null;
    })();

    const buttonTitle = (() => {
      switch (this.state.state) {
        case 'not_connected': return 'Connect to Consumer';
        case 'connecting': return 'Connecting...';
        case 'connected': return 'Connected to Consumer';
        case 'error': return 'An error ocurred';
      }
    })();

    return (
      <div className={this.props.className}>
        {statusText}
        <button className="connection-button" title={buttonTitle} onClick={this.onClick}>
          <SettingsEthernet/>
          <span className={`indicator ${this.state.state}`} />
        </button>
      </div>
    );
  }
}

const StyledConnectionButton = styled(ConnectionButton)`
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
        border:1px solid #999;
        width: 4px;
        height: 4px;
      }

      &.connecting {
        background-color: ${p => p.theme.colorAmber};
      }

      &.connected {
        background-color: ${p => p.theme.colorGreen};
      }

      &.error {
        background-color: ${p => p.theme.colorRed};
      }
    }
  }
`;

export {StyledConnectionButton as ConnectionButton};
