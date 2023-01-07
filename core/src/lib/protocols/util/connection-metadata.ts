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

export type ConnectionMetadataListenerData = {
  uuid: string;
  nodes: ConnectionMetadataNode[];
};

export type ConnectionMetadataListener = (
  data: ConnectionMetadataListenerData
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

    let updateMade = false;

    const matchingEndpoint = this.endpoints.get(endpoint);
    if (matchingEndpoint && !matchingEndpoint.uuid) {
      matchingEndpoint.uuid = notification.ownUuid;
      this.updateSelf();
      updateMade = true;
    }

    for (const node of notification.nodes) {
      const nodeUpdated = this.handleNodeInfo({
        ...node,
        distance: node.distance + 1,
      });
      updateMade ||= nodeUpdated;
    }

    const wantUpdatesAfter = this.nodesWantUpdates();

    if (updateMade) {
      this.sendDataToListeners();
      if (wantUpdatesBefore || wantUpdatesAfter) {
        this.sendUpdate();
      }
    }
  };

  public registerEndpoint = (type: string, endpoint: AnyEndpoint) => {
    this.endpoints.set(endpoint, { type });
    this.updateSelf();
    this.sendDataToListeners();
    if (this.nodesWantUpdates()) {
      this.sendUpdate();
    }
  };

  public removeEndpoint = (endpoint: AnyEndpoint) => {
    this.endpoints.delete(endpoint);
    this.updateSelf();
    this.sendDataToListeners();
    if (this.nodesWantUpdates()) {
      this.sendUpdate();
    }
  };

  public addListener = (listener: ConnectionMetadataListener) => {
    this.listeners.add(listener);
    if (!this.self.wantsMetadata) {
      this.self.wantsMetadata = true;
      this.updateSelf();
      this.sendUpdate();
    }
    listener(this.generateListenerData());
  };

  public removeListener = (listener: ConnectionMetadataListener) => {
    this.listeners.delete(listener);
    if (this.listeners.size === 0) {
      this.self.wantsMetadata = false;
      this.updateSelf();
      this.sendUpdate();
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
      connections[type] = connections[type] || [];
      connections[type].push({ uuid, lastPing });
    }
    this.self = {
      ...this.self,
      lastUpdateMillis: Date.now(),
      connections,
    };
    this.handleNodeInfo(this.self);
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

  private generateListenerData = (): ConnectionMetadataListenerData => ({
    uuid: this.self.uuid,
    nodes: [...this.nodes.values()],
  });

  private sendDataToListeners = () => {
    const data = this.generateListenerData();
    this.listeners.forEach((l) => l(data));
  };

  private sendUpdate = () => {
    const update: ConnectionMetadataNotification = {
      type: 'connection-metadata',
      ownUuid: this.self.uuid,
      nodes: [...this.nodes.values()],
    };
    for (const endpoint of this.endpoints.keys()) {
      endpoint.sendNotification(update);
    }
  };

  private handleNodeInfo = (node: ConnectionMetadataNode): boolean => {
    const existing = this.nodes.get(node.uuid);
    if (
      !existing ||
      !isEqual(omit(existing, 'distance'), omit(node, 'distance'))
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
      return true;
    } else {
      return false;
    }
  };
}
