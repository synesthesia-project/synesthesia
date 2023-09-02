import { Base } from '../base';

export type Channel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const CHANNELS: Channel[] = [0, 1, 2, 3, 4, 5, 6, 7];

export type Master = 8;

/**
 * Maximum possible value for a fader: 16383
 */
const FADER_MAX = (0x7f << 7) + 0x7f;
/**
 * Mackie Manufacturer SysEx ID Number
 */
const MACKIE = [0x00, 0x00, 0x66];
const LCD_CHAR_COUNT = 0x70;

export type FaderEvent = {
  type: 'fader';
  /** value between 0-8 */
  channel: Channel | Master;
  /**
   * Integer between 0 and 16383;
   */
  value: number;
};

type ChannelButton =
  | 'v-select'
  | 'rec'
  | 'solo'
  | 'mute'
  | 'select'
  | 'fader-touch';
type ButtonState = 'pressed' | 'released';

export type ChannelButtonEvent = {
  type: 'channel-button';
  state: ButtonState;
  button: ChannelButton;
  /** value between 0-7 */
  channel: Channel;
};

export type VPotEvent = {
  type: 'v-pot';
  /**
   * @example
   * 'cw' -> clockwise
   * 'ccw' -> counter-clockwise
   */
  direction: 'cw' | 'ccw';
  channel: Channel;
  ticks: number;
};

export type VPotLEDMode = 'single' | 'boost-cut' | 'wrap' | 'spread';

export type Event = FaderEvent | ChannelButtonEvent | VPotEvent;

type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];
export type EventType = PropType<Event, 'type'>;
export type SpecificEvent<E extends EventType> = Extract<Event, { type: E }>;
export type Listener<E extends Event> = (message: E) => void;

export function isChannel(channel: number): channel is Channel {
  return channel >= 0 && channel < 8;
}

export function checkChannel(channel: Channel) {
  if (!isChannel(channel)) throw new Error('Invalid channel value');
}

export function isChannelOrMaster(
  channel: number
): channel is Channel | Master {
  return isChannel(channel) || channel === 8;
}

export function checkChannelOrMaster(channel: Channel | Master) {
  if (!isChannelOrMaster(channel)) throw new Error('Invalid channel value');
}

export function checkFaderValue(value: number) {
  if (value < 0 || value > FADER_MAX) throw new Error('Invalid fader value');
}

/**
 * Mackie Control Universal Protocol Implementation
 */
export default class MCUProtocol extends Base {
  private readonly deviceId: number;

  private readonly eventListeners = {
    'channel-button': new Set<Listener<ChannelButtonEvent>>(),
    fader: new Set<Listener<FaderEvent>>(),
    'v-pot': new Set<Listener<VPotEvent>>(),
  };

  private readonly faderEchoTimeouts = {
    0: null as null | NodeJS.Timeout,
    1: null as null | NodeJS.Timeout,
    2: null as null | NodeJS.Timeout,
    3: null as null | NodeJS.Timeout,
    4: null as null | NodeJS.Timeout,
    5: null as null | NodeJS.Timeout,
    6: null as null | NodeJS.Timeout,
    7: null as null | NodeJS.Timeout,
    8: null as null | NodeJS.Timeout,
  };

  /**
   * Number of milliseconds to wait before echoing fader position
   * or negative if disabled.
   */
  private faderEchoDelay = 200;

  public constructor(deviceName: string, deviceId: number) {
    super(deviceName);
    this.deviceId = deviceId;
    this.addListener(this.handleMidiMCU);
  }

  private handleMidiMCU = (message: number[]) => {
    console.log(message.map((n) => n.toString(16)));
    if (message.length < 3) return;
    const k = message[0];

    // Fader
    if (k >= 0xe0 && k <= 0xe8) {
      const value = (message[2] << 7) + message[1];
      const channel = k & 0xf;
      if (!isChannelOrMaster(channel)) return;
      this.handleEvent({
        type: 'fader',
        channel,
        value,
      });
      if (this.faderEchoDelay >= 0) {
        const timeout = this.faderEchoTimeouts[channel];
        if (timeout) clearTimeout(timeout);
        this.faderEchoTimeouts[channel] = setTimeout(
          () => this.setFader(channel, value),
          this.faderEchoDelay
        );
      }
    }

    // Buttons / Switches
    if (k === 0x90) {
      const state: ButtonState = message[2] > 0 ? 'pressed' : 'released'; // usually 0x7f
      const b = message[1];
      if (b >= 0 && b < 0x28) {
        // Channel Button
        const [channel, button]: [number, ChannelButton] =
          b < 0x08
            ? [b, 'rec']
            : b < 0x10
            ? [b - 0x08, 'solo']
            : b < 0x18
            ? [b - 0x10, 'mute']
            : b < 0x20
            ? [b - 0x18, 'select']
            : [b - 0x20, 'v-select'];
        if (!isChannel(channel))
          throw new Error('internal error: invalid channel produced!');
        this.handleEvent({
          type: 'channel-button',
          state,
          button,
          channel,
        });
      } else if (b >= 0x68 && b <= 0x6f) {
        const channel = b - 0x68;
        if (!isChannel(channel))
          throw new Error('internal error: invalid channel produced!');
        this.handleEvent({
          type: 'channel-button',
          state,
          button: 'fader-touch',
          channel,
        });
      } else {
        // TODO: implement
        console.error('Other buttons not yet supported', b.toString(16));
      }
    }

    // V-Pots
    if (k === 0xb0) {
      const channel = message[1] - 0x10;
      if (!isChannel(channel)) return;
      const direction = 0x40 & message[2] ? 'ccw' : 'cw';
      const ticks = 0x3f & message[2];
      this.handleEvent({
        type: 'v-pot',
        channel,
        direction,
        ticks,
      });
    }
  };

  /**
   * By default, on some consoles a motorized fader will move back to it's last
   * explicitly set position after being moved.
   *
   * If echo is set to a value of `0` or greater, we will wait that amount of
   * milliseconds after a fader has stopped moving and then report the last
   * received fader position to the console, so it will not move.
   *
   * It is recommended to have areasonably large delay, otherwise it's possible
   * the console may "fight back" when youre adjusting the position.
   *
   * Set to a negative number (e.g. `-1`) to disable echo
   *
   * @param faderEchoThreshold `-1` to disable echo,
   * otherwise number of milliseconds to wait before echoing
   */
  public setFaderEchoDelay(faderEchoDelay: number) {
    this.faderEchoDelay = faderEchoDelay;
  }

  /**
   * @param channel 0 - 8
   * @param value 0 - 16383
   */
  public setFader(channel: Channel | Master, value: number) {
    checkFaderValue(value);
    checkChannelOrMaster(channel);
    const l = value & 0x7f;
    const h = (value >> 7) & 0x7f;
    this.sendMidi([0xe0 | channel, l, h]);
  }

  public setChannelLED(channel: Channel, button: ChannelButton, on: boolean) {
    checkChannel(channel);
    const i =
      (button === 'rec'
        ? 0x00
        : button === 'solo'
        ? 0x08
        : button === 'mute'
        ? 0x10
        : button === 'select'
        ? 0x18
        : 0x20) + channel;
    this.sendMidi([0x90, i, on ? 0x7f : 0]);
  }

  public setChannelLCD(channel: Channel, row: 'top' | 'bottom', text: string) {
    checkChannel(channel);
    const offset = channel * 7 + (row === 'top' ? 0 : 0x38);
    this.setLCDText(offset, (text + '       ').substr(0, 7));
  }

  public setLCDText(offset: number, text: string) {
    const chars: number[] = [];
    for (let i = 0; i < text.length && i + offset < LCD_CHAR_COUNT; i++) {
      chars.push(text.charCodeAt(i));
    }
    this.setLCDChars(offset, chars);
  }

  public setLCDChars(offset: number, chars: number[]) {
    if (offset < 0 || offset >= LCD_CHAR_COUNT)
      throw new Error('Invalid LCD Offset');
    chars = chars.slice(0, LCD_CHAR_COUNT - offset);
    this.sendMidi([
      0xf0,
      ...MACKIE,
      this.deviceId,
      0x12,
      offset,
      ...chars,
      0xf7,
    ]);
  }

  public setVPotRing(
    channel: Channel,
    center: 'on' | 'off',
    mode: VPotLEDMode,
    value: number
  ) {
    checkChannel(channel);
    if (value < 0 || value > 0x0b)
      throw new Error('Value must be between 0 and 11');
    const modeBits =
      mode === 'single'
        ? 0x00
        : mode === 'boost-cut'
        ? 0x10
        : mode === 'wrap'
        ? 0x20
        : 0x30;
    if (mode === 'spread' && value > 6) value = 6;
    const data = (center === 'on' ? 0x40 : 0x00) | modeBits | value;
    this.sendMidi([0xb0, 0x30 | channel, data]);
  }

  /**
   * Set the VU-Meter peak level.
   *
   * The MCU protocol specifies that the levels decrease automatically over time.
   *
   * @param channel
   * @param level between 0 and 15:
   *   0-12 - meter level
   *   14 - set overload
   *   15 - clear overload
   */
  public setVUMeterLevel(channel: Channel, level: number) {
    checkChannel(channel);
    if (level < 0 || level > 0xf)
      throw new Error('Invalid level, must be between 0 and 15');
    this.sendMidi([0xd0, (channel << 4) | level]);
  }

  public addEventListener<E extends EventType>(
    event: E,
    listener: Listener<SpecificEvent<E>>
  ) {
    (this.eventListeners[event] as Set<Listener<SpecificEvent<E>>>).add(
      listener
    );
  }

  public removeEventListener<E extends EventType>(
    event: E,
    listener: Listener<SpecificEvent<E>>
  ) {
    (this.eventListeners[event] as Set<Listener<SpecificEvent<E>>>).delete(
      listener
    );
  }

  private handleEvent<E extends EventType>(event: SpecificEvent<E>) {
    console.log(event);
    (
      this.eventListeners[event.type] as Set<Listener<SpecificEvent<E>>>
    ).forEach((l) => l(event));
  }
}
