import MCUProtocol from '../protocols/mcu';

const DEVICE_ID = 0x15;

export class XTouchExtenderMCU extends MCUProtocol {
  public constructor(deviceName: string) {
    super(deviceName, DEVICE_ID);
  }
}

export default XTouchExtenderMCU;
