/**
 * This file facilitates communication between different components
 * residing on the same machine.
 */
import * as fs from 'fs';
import JsonSocket = require('json-socket');
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

import * as messages from './messages';

const RUN_DIR =
  process.env.SYNESTHESIA_RUN || path.join(os.tmpdir(), 'synesthesia');

const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);

type ProcType = 'consumer' | 'server';

const SERVER: ProcType = 'server';
const CONSUMER: ProcType = 'consumer';

abstract class LocalCommunications {
  private readonly socketPath: string;

  protected abstract getProcType(): ProcType;

  protected abstract onConnection(socket: JsonSocket): void;

  public constructor() {
    const dir = path.join(RUN_DIR, this.getProcType());
    this.socketPath = path.join(dir, process.pid.toString());
    console.log(`:: Creating directory: ${dir}`);
    mkdir(dir, { recursive: true })
      .then(() => {
        console.log(`:: Directory Created: ${dir}`);
        const server = new net.Server();

        server.listen(this.socketPath);
        server.on('connection', (socket) => {
          this.onConnection(new JsonSocket(socket));
        });
      })
      .catch((err) => {
        console.error(`:: Error when creating directory: ${dir}`, err);
      });

    process.on('SIGINT', () => process.exit());
    process.on('SIGUSR1', () => process.exit());
    process.on('SIGUSR2', () => process.exit());
    process.on('exit', this.cleanup);
  }

  private cleanup = () => {
    unlink(this.socketPath);
  };
}

export class LocalCommunicationsServer extends LocalCommunications {
  protected getProcType() {
    return SERVER;
  }

  protected onConnection(socket: JsonSocket) {
    console.log('connection', socket);
  }

  /**
   * Send a notification to all consumers that are running locally
   */
  public notifyConsumers(port: number) {
    const consumers = path.join(RUN_DIR, CONSUMER);
    const message: messages.IncomingConsumerMessage = {
      type: 'new-server',
      port,
    };
    readdir(consumers)
      .then((dirs) => {
        for (const pid of dirs) {
          const socket = new JsonSocket(net.connect(path.join(consumers, pid)));
          socket.sendEndMessage(message, (err) => {
            console.error(`:: Error sending notification: `, err);
          });
        }
      })
      .catch((err) => {
        console.error(`:: Error sending notification: `, err);
      });
  }
}

type NewServerListener = (port: number) => void;

export class LocalCommunicationsConsumer extends LocalCommunications {
  private readonly newServerListeners = new Set<NewServerListener>();

  protected getProcType() {
    return CONSUMER;
  }

  protected onConnection(socket: JsonSocket) {
    console.log('connection');
    socket.on('message', (message: messages.IncomingConsumerMessage) => {
      console.log('message', message);
      // TODO: verify type of message
      if (message.type === 'new-server') {
        this.newServerListeners.forEach((l) => l(message.port));
      }
    });
  }

  public on(event: 'new-server', listener: NewServerListener): void;
  public on(event: 'new-server', listener: NewServerListener) {
    if (event === 'new-server') {
      this.newServerListeners.add(listener);
    } else {
      throw new Error('Unrecognized Event: ' + event);
    }
  }
}
