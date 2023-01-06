import * as midi from 'midi';

/**
 * List all connected midi devices that could potentially be controllers.
 *
 * (simply ennumerates all inputs, as every controller must be an input and an output)
 */
export function getMIDIDevices(): string[] {
  const input = new midi.Input();
  const length = input.getPortCount();
  const result: string[] = [];
  for (let i = 0; i < length; i++) {
    result.push(input.getPortName(i));
  }
  return result;
}

export { XTouchExtenderMCU } from './devices/behringer-x-touch-extender-mcu';
