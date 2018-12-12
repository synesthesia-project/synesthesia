import * as lightDesk from '@synesthesia-project/light-desk';
import * as ola from '@samlanning/synesthesia-ola-dmx';

import {getHue, discoverBridges} from './hue/hue';
import {getConfig} from './config';

import {Behaviour} from './behaviour';

console.log('Hello!');

async function run() {

  const config = await getConfig();

  if (!config) {
    console.log('No configuration, time to make one!');
    discoverBridges();
    return;
  }

  const h = getHue(config.hueHost, config.hueToken);

  const display = new ola.Display(ola.getConfig(), ola.getProxy());

  const consumer = new ola.SynesthesiaListener(display.newSynesthesiaPlayState);

  const behaviour = new Behaviour(h, display);

  const desk = new lightDesk.LightDesk();
  desk.setRoot(behaviour.getLightDesk());

  behaviour.run();

}

run();
