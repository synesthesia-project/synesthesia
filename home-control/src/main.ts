
import * as lightDesk from '@samlanning/synesthesia-light-desk';
import * as ola from '@samlanning/synesthesia-ola-dmx';

// import {Display} from './behaviour/display';
// import {DmxProxy} from './dmx/proxy';
// import {SynesthesiaListener} from './listener/listener';
// import {getConfig} from './config/home';

console.log('heeelooo');

const display = new ola.Display(ola.getConfig(), ola.getProxy());

const consumer = new ola.SynesthesiaListener(display.newSynesthesiaPlayState);

display.run();

const desk = new lightDesk.LightDesk();
// desk.setRoot(new lightDesk.Group({direction: 'vertical'}));
desk.setRoot(display.getLightDesk());
