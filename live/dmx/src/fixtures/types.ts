import * as ld from '@synesthesia-project/light-desk';

export type FixturePixel = {
  x: number;
  y: number;
  /**
   * Which channels within the fixture is this pixel mapped to,
   * Relative channels (starting from 0).
   */
  channels: Record<'r' | 'g' | 'b', number>;
};

export type FixtureChannel = {
  /** A uuid for this channel */
  id: string;
  /**
   * Name of the channel, if undefined, the channel will not be visible under
   * sequences config.
   */
  name?: string;
  /** Relative DMX channel (starting from 1). */
  channel: number;
  /** Value to use when value is not comfing from sequence */
  value: number;
  /**
   * If set to true, use the configured value instead of the value provided
   * by a sequence.
   */
  override?: boolean;
};

export type Fixture<T extends { type: string }> = {
  type: T['type'];
  group: ld.Group;
  setConfig: (config: T) => void;
  defaultConfig: T;
  getPixels: () => FixturePixel[];
  getChannels: () => FixtureChannel[];
};
