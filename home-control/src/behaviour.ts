import * as lightDesk from '@samlanning/synesthesia-light-desk';
import * as ola from '@samlanning/synesthesia-ola-dmx';
import {HueApi} from 'node-hue-api';

const INTERVAL = 1000;

interface State {
  externalLignts: {
    state: 'unknown' | 'on' | 'off';
    brightness: number;
  };
}

interface Desk {
  externalLightsState: lightDesk.Label;
}

export class Behaviour {

  private readonly hue: HueApi;
  private readonly display: ola.Display;

  private state: State = {
    externalLignts: {
      state: 'unknown',
      brightness: 1
    }
  };

  private desk: null | Desk = null;

  public constructor(hue: HueApi, display: ola.Display) {
    this.hue = hue;
    this.display = display;

    this.interval = this.interval.bind(this);
  }

  public async run() {

    console.log('Starting home-control');

    this.display.run();

    setInterval(this.interval, INTERVAL);
  }

  public getLightDesk() {

    const desk = new lightDesk.Group({direction: 'vertical'});

    const homeControl = new lightDesk.Group({direction: 'horizontal'});
    desk.addChild(homeControl);
    desk.addChild(this.display.getLightDesk());

    this.desk = {
      externalLightsState: new lightDesk.Label('External Lights:')
    };

    homeControl.addChild(this.desk.externalLightsState);

    return desk;
  }

  private async interval() {
    const lights = await this.hue.lights();

    for (const light of lights.lights) {
      if (light.name === 'Downstairs Living Room 1') {
        const newState = light.state.on ? 'on' : 'off';
        if (this.state.externalLignts.state !== newState) {
          this.state.externalLignts.state = newState;
          if (this.desk) {
            this.desk.externalLightsState.setText('External Lights: ' + newState);
          }
          if (newState === 'on') {
            this.display.setBlackout(false);
          } else {
            this.display.setBlackout(true);
          }
        }
      }
    }
  }

}
