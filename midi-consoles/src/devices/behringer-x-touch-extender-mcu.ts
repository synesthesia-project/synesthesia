import MCUProtocol from '../protocols/mcu';

const DEVICE_ID = 0x15;

class XTouchExtender extends MCUProtocol {

  public constructor(deviceName: string) {
    super(deviceName, DEVICE_ID);
  }

}

export default XTouchExtender;
