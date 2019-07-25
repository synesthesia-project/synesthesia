import { Base } from '../base';

type Channel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Maximum possible value for a fader: 16383
 */
// const FADER_MAX = (0x7f << 7) + 0x7f;

export type FaderEvent = {
  type: 'fader',
  /** value between 0-8 */
  channel: Channel;
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

/**
 * Mackie Control Universal Protocol Implementation
 */
class MCUProtocol extends Base {

  private readonly eventListeners = {
    fader: new Set<Listener<FaderEvent>>(),
    button: new Set<Listener<ButtonEvent>>()
  };

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
      const channel = (k & 0xf) as Channel;
      this.handleEvent({
        type: 'fader', channel, value
      });
    }
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
