import {PlayStateData} from '../shared/protocol/messages';
import {CueFile} from '../shared/file/file';

import {Color, Colors} from '../data/colors';

export class SynesthesiaDisplay {

  private readonly leds: Color[] = [];

  public constructor(numberOfLeds: number, state: PlayStateData) {
    let j = 0;
    for (let i = 0; i < numberOfLeds; i++) {
      this.leds.push(j === 0  ? Colors.White : Colors.Black);
      j++;
      if (j === 16) j = 0;
    }
  }

  public getDisplay(): Color[] {
    return this.leds;
  }

}
