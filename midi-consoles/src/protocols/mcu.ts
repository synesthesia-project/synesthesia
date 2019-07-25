import { Base } from '../base';

type Channel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Master = 8;

/**
 * Maximum possible value for a fader: 16383
 */
const FADER_MAX = (0x7f << 7) + 0x7f;

export type FaderEvent = {
  type: 'fader',
  /** value between 0-8 */
  channel: Channel | Master;
  /**
   * Integer between 0 and 16383;
   */
  value: number;
};

export type ButtonEvent = {
  type: 'button'
};

export type Event =
    FaderEvent
  | ButtonEvent;

type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];
export type EventType = PropType<Event, 'type'>;
export type SpecificEvent<E extends EventType> = Extract<Event, {type: E}>;
export type Listener<E extends Event> = (message: E) => void;

function isChannel(channel: number): channel is Channel {
  return channel >= 0 && channel < 8;
}

function isChannelOrMaster(channel: number): channel is Channel | Master {
  return isChannel(channel) || channel === 8;
}

function checkChannelOrMaster(channel: Channel | Master) {
  if (!isChannelOrMaster(channel)) throw new Error('Invalid channel value');
}

function checkFaderValue(value: number) {
  if (value < 0 || value > FADER_MAX) throw new Error('Invalid fader value');
}

/**
 * Mackie Control Universal Protocol Implementation
 */
class MCUProtocol extends Base {

  private readonly eventListeners = {
    fader: new Set<Listener<FaderEvent>>(),
    button: new Set<Listener<ButtonEvent>>()
  };

  private echoFader = true;

  public constructor(deviceName: string) {
    super(deviceName);

    this.handleMidiMCU = this.handleMidiMCU.bind(this);

    this.addListener(this.handleMidiMCU);
  }

  private handleMidiMCU(message: number[]) {
    console.log(message.map(n => n.toString(16)));
    if (message.length < 3) return;
    const k = message[0];

    // Fader
    if (k >= 0xe0 && k <= 0xe8) {
      const value = (message[2] << 7) + message[1];
      const channel = (k & 0xf);
      if (!isChannelOrMaster(channel)) return;
      this.handleEvent({
        type: 'fader', channel, value
      });
      // if (this.echoFader) this.setFader(channel, value);
    }
  }

  /**
   * By default, on some consoles a motorized fader will move back to it's last
   * explicitly set position after being moved. If echo is set to true, any time
   * the console reports that its fader has moved, we will tell the console that
   * that should be its new position, so that it won't movew back.
   *
   * @param echo true (default) iff the board should have fader positions echoed back
   */
  public setEchoFader(echo: boolean) {
    this.echoFader = echo;
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

  public addEventListener<E extends EventType>(event: E, listener: Listener<SpecificEvent<E>>) {
    (this.eventListeners[event] as Set<Listener<SpecificEvent<E>>>).add(listener);
  }

  public removeEventListener<E extends EventType>(event: E, listener: Listener<SpecificEvent<E>>) {
    (this.eventListeners[event] as Set<Listener<SpecificEvent<E>>>).delete(listener);
  }

  private handleEvent<E extends EventType>(event: SpecificEvent<E>) {
    console.log(event);
    (this.eventListeners[event.type] as Set<Listener<SpecificEvent<E>>>).forEach(l => l(event));
  }

}

export default MCUProtocol;
