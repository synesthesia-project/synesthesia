declare module 'artnet' {
  function artnet(options: {
    /**
     * @default '255.255.255.255'
     */
    host?: string;
    /**
     * @default 6454
     */
    port?: number;
    /**
     * millisecond interval for sending unchanged data to the Art-Net node.
     *
     * @default 4000
     */
    refresh?: number;
    /**
     * optional string IP address - bind udp socket to specific network interface
     */
    iface?: string;
    /**
     * sends always the full DMX universe instead of only changed values.
     *
     * @default true
     */
    sendAll?: boolean;
  }): {
    set(dmx: number[]): void;
    set(channel: number, dmx: number[]): void;
    set(universe: number, channel: number, dmx: number[]): void;
    close(): void;
    setHost(host: string): void;
    setPort(port: number): void;
  };

  export = artnet;
}
