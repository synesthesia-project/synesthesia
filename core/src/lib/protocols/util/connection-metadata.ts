import type {
  ConnectionMetadataNotification,
  ConnectionMetadataNode,
} from './messages';
import type { Endpoint } from './endpoint';
import { v4 as uuidv4 } from 'uuid';
import { deepFreeze } from '../../util';
import { omit, isEqual } from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEndpoint = Endpoint<any, any, any>;

export type ConnectionMetadataListener = (
  data: ConnectionMetadataNotification
) => void;

export class ConnectionMetadataManager {
  private self: ConnectionMetadataNode;

  private readonly nodes = new Map<string, ConnectionMetadataNode>();

  private readonly endpoints: Map<
    AnyEndpoint,
    {
      type: string;
      lastPing?: number;
      /** uuid of the node on the other end of the connection */
      uuid?: string;
    }
  > = new Map();

  private readonly listeners = new Set<ConnectionMetadataListener>();

  public constructor(name?: string) {
    const uuid = uuidv4();
    this.self = {
      uuid,
      name,
      wantsMetadata: false,
      connections: {},
      lastUpdateMillis: Date.now(),
      distance: 0,
    };
    this.handleNodeInfo(this.self);
  }

  public acceptNotification = (
    endpoint: AnyEndpoint,
    notification: ConnectionMetadataNotification
  ) => {
    const wantUpdatesBefore = this.nodesWantUpdates();
    this.runFunctionAndShareAnyChanges(() => {
      const matchingEndpoint = this.endpoints.get(endpoint);
      if (matchingEndpoint && matchingEndpoint.uuid !== notification.ownUuid) {
        matchingEndpoint.uuid = notification.ownUuid;
        this.updateSelf();
      }

      for (const node of Object.values(notification.nodes)) {
        this.handleNodeInfo({
          ...node,
          distance: node.distance + 1,
        });
      }

      this.clearUnreachableNodes();
    }, wantUpdatesBefore);
  };

  public registerEndpoint = (type: string, endpoint: AnyEndpoint) => {
    this.runFunctionAndShareAnyChanges(() => {
      this.endpoints.set(endpoint, { type });
      this.updateSelf();
    });
  };

  public updateEndpointPing = (endpoint: AnyEndpoint, ping: number) => {
    const roundedPing = Math.ceil(ping);
    this.runFunctionAndShareAnyChanges(() => {
      const matchingEndpoint = this.endpoints.get(endpoint);
      if (matchingEndpoint && matchingEndpoint.lastPing !== roundedPing) {
        matchingEndpoint.lastPing = roundedPing;
        this.updateSelf();
      }
    });
  };

  public removeEndpoint = (endpoint: AnyEndpoint) => {
    this.runFunctionAndShareAnyChanges(() => {
      this.endpoints.delete(endpoint);
      this.updateSelf();
      this.clearUnreachableNodes();
    });
  };

  public addListener = (listener: ConnectionMetadataListener) => {
    listener(this.generateNotificationMessage());
    this.runFunctionAndShareAnyChanges(() => {
      this.listeners.add(listener);
      if (!this.self.wantsMetadata) {
        this.self.wantsMetadata = true;
        this.updateSelf();
      }
    }, true);
  };

  public removeListener = (listener: ConnectionMetadataListener) => {
    this.runFunctionAndShareAnyChanges(() => {
      this.listeners.delete(listener);
      if (this.self.wantsMetadata && this.listeners.size === 0) {
        this.self.wantsMetadata = false;
        this.updateSelf();
      }
    }, true);
  };

  private runFunctionAndShareAnyChanges = (
    f: () => void,
    forceSendToNodes = false
  ) => {
    const dataBefore = this.generateNotificationMessage();
    f();
    const dataAfter = this.generateNotificationMessage();
    if (!isEqual(dataBefore, dataAfter)) {
      this.sendDataToListeners(dataAfter);
      if (forceSendToNodes || this.nodesWantUpdates()) {
        this.sendDataToNodes(dataAfter);
      }
    }
  };

  /**
   * When information that changes the current nodes metadata has happened,
   * recalculate connections metadata and update lastUpdateMillis.
   * (only do this when data has actually changed)
   */
  private updateSelf = () => {
    const connections: ConnectionMetadataNode['connections'] = {};
    for (const { type, lastPing, uuid } of this.endpoints.values()) {
      connections[type] = connections[type] || {
        known: {},
        unknown: 0,
      };
      if (uuid) {
        connections[type].known[uuid] = { lastPing };
      } else {
        connections[type].unknown++;
      }
    }
    this.self = {
      ...this.self,
      lastUpdateMillis: Date.now(),
      connections,
    };
    this.handleNodeInfo(this.self);
  };

  private clearUnreachableNodes = () => {
    // TODO: do a reachability test to see which nodes can be reached
    // from the current node, and delete everything else
    // (e.g. network partitioned)
  };

  private nodesWantUpdates = (): boolean => {
    /**
     * Number of seconds we need to have had a update from a node within
     * to consider it "actively" wanting updates;
     */
    const timeTreshold = Date.now() - 1000 * 10;
    let wantsUpdate = false;
    for (const node of this.nodes.values()) {
      wantsUpdate ||=
        node.wantsMetadata && node.lastUpdateMillis > timeTreshold;
    }
    return wantsUpdate;
  };

  private generateNotificationMessage = (): ConnectionMetadataNotification => ({
    type: 'connection-metadata',
    ownUuid: this.self.uuid,
    nodes: [...this.nodes.values()].reduce<
      Record<string, ConnectionMetadataNode>
    >((prev, node) => ({ ...prev, [node.uuid]: node }), {}),
  });

  private sendDataToListeners = (data: ConnectionMetadataNotification) => {
    this.listeners.forEach((l) => l(data));
  };

  private sendDataToNodes = (data: ConnectionMetadataNotification) => {
    for (const endpoint of this.endpoints.keys()) {
      endpoint.sendNotification(data);
    }
  };

  private handleNodeInfo = (node: ConnectionMetadataNode) => {
    const existing = this.nodes.get(node.uuid);
    if (
      !existing ||
      // The given data is not older
      (node.lastUpdateMillis >= existing.lastUpdateMillis &&
        // There is some change
        !isEqual(omit(existing, 'distance'), omit(node, 'distance')))
    ) {
      const newData: ConnectionMetadataNode = {
        ...node,
        ...(existing
          ? {
              distance: Math.min(existing.distance, node.distance),
            }
          : null),
      };
      deepFreeze(newData);
      this.nodes.set(node.uuid, newData);
    }
  };
}
