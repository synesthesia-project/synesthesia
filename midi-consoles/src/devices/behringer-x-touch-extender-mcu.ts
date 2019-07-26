import MCUProtocol, { Channel, checkChannel} from '../protocols/mcu';

const DEVICE_ID = 0x15;

class XTouchExtender extends MCUProtocol {

  public constructor(deviceName: string) {
    super(deviceName, DEVICE_ID);
  }

  public setChannelLCD(channel: Channel, row: 'top' | 'bottom', text: string) {
    checkChannel(channel);
    const offset = channel * 7 + (row === 'top' ? 0 : 0x38);
    this.setLCDText(offset, (text + '       ').substr(0, 7));
  }

}

export default XTouchExtender;
