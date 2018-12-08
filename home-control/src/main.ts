import * as lightDesk from '@samlanning/synesthesia-light-desk';
import * as ola from '@samlanning/synesthesia-ola-dmx';

import {getHue, discoverBridges} from './hue/hue';
import {getConfig} from './config';

console.log('Hello!');

async function run() {

  const config = await getConfig();

  if (!config) {
    console.log('No configuration, time to make one!');
    discoverBridges();
    return;
  }

  const h = getHue(config.hueHost, config.hueToken);

  const hueConfig = await h.config();

  console.log('hueConfig', hueConfig);

  const display = new ola.Display(ola.getConfig(), ola.getProxy());

  const consumer = new ola.SynesthesiaListener(display.newSynesthesiaPlayState);

  display.run();

  const desk = new lightDesk.LightDesk();
  // desk.setRoot(new lightDesk.Group({direction: 'vertical'}));
  desk.setRoot(display.getLightDesk());

}

run();
