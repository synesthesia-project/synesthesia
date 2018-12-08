import * as ola from '@samlanning/synesthesia-ola-dmx';
import {HueApi} from 'node-hue-api';

const INTERVAL = 1000;

export class Behaviour {

  private readonly hue: HueApi;
  private readonly display: ola.Display;

  public constructor(hue: HueApi, display: ola.Display) {
    this.hue = hue;
    this.display = display;
  }

  public async run() {

    console.log('Starting home-control');

    this.display.run();

    let state: 'unknown' | 'on' | 'off' = 'unknown';

    setInterval(
      async () => {
        // Check latest hue states
        const lights = await this.hue.lights();

        for (const light of lights.lights) {
          if (light.name === 'Downstairs Living Room 1') {
            const newState = light.state.on ? 'on' : 'off';
            if (state !== newState) {
              state = newState;
              if (state === 'on') {
                this.display.setMasterBrightness(1);
              } else {
                this.display.setMasterBrightness(0);
              }
            }
          }
        }

        console.log('hueConfig', state);
      },
      INTERVAL);
  }

  public getLightDesk() {
    return this.display.getLightDesk();
  }

}
