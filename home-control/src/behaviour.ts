import {throttle} from 'lodash';
import * as lightDesk from '@synesthesia-project/light-desk';
import * as ola from '@samlanning/synesthesia-ola-dmx';
import {HueApi, lightState} from 'node-hue-api';

const INTERVAL = 1000;

interface StateGroup {
  id: string;
  name: string;
  lights: string[];
  state: 'unknown' | 'on' | 'off';
  brightness: number;
}

interface State {
  externalLignts: {
    state: 'unknown' | 'on' | 'off';
    brightness: number;
  };
  groups: StateGroup[];
  autoToggleLights: boolean;
}

interface Desk {
  externalLightsState: lightDesk.Label;
  lightGroupsArea: lightDesk.Group;
  lightGroupToComponents: Map<string, {toggle: lightDesk.Switch; brightness: lightDesk.Slider}>;
}

export class Behaviour {

  private readonly hue: HueApi;
  private readonly display: ola.Display;

  private state: State = {
    externalLignts: {
      state: 'unknown',
      brightness: 1
    },
    groups: [],
    autoToggleLights: true
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

    // Load rooms
    this.hue.groups().then(groups => {
      if (this.state.groups.length > 0) return;
      for (const group of groups) {
        if (!group.lights) continue;
        this.state.groups.push({
          id: group.id,
          name: group.name,
          lights: group.lights,
          state: 'unknown',
          brightness: 0
        });
      }
      if (this.desk) {
        this.addGroupDeskStuff(this.desk, this.state.groups);
      }
    });
  }

  private addGroupDeskStuff(desk: Desk, lightGroups: StateGroup[]) {
    for (const lightGroup of lightGroups) {
      const group = new lightDesk.Group({direction: 'horizontal'});

      group.setTitle(lightGroup.name);

      const toggle = new lightDesk.Switch('on');
      toggle.addListener(value => {
        this.hue.setGroupLightState(lightGroup.id, lightState.create().on(value === 'on'));
      });
      group.addChild(toggle);

      const brightness = new lightDesk.Slider(0, 0, 1, 0.05);
      const updateBrightness = (value: number) => {
        console.log('update brightness:', value);
        this.hue.setGroupLightState(lightGroup.id, lightState.create().bri(Math.round(value * 255)));
      };
      // Only update brightness at most once every 500 ms
      brightness.addListener(throttle(updateBrightness, 500));
      group.addChild(brightness);

      desk.lightGroupToComponents.set(lightGroup.id, {toggle, brightness});
      desk.lightGroupsArea.addChild(group);
    }
  }

  public getLightDesk() {

    const desk = new lightDesk.Group({direction: 'vertical'});

    const homeControl = new lightDesk.Group({direction: 'vertical'});
    desk.addChild(homeControl);
    desk.addChild(this.display.getLightDesk());

    this.desk = {
      externalLightsState: new lightDesk.Label('External Lights:'),
      lightGroupsArea: new lightDesk.Group({direction: 'horizontal', wrap: true}),
      lightGroupToComponents: new Map()
    };

    const settings = new lightDesk.Group({direction: 'horizontal'});

    const autoToggleLights = new lightDesk.Switch('on');
    autoToggleLights.addListener(state => {
      this.state.autoToggleLights = state === 'on';
    });

    settings.addChild(this.desk.externalLightsState);
    settings.addChild(new lightDesk.Label('Auto Toggle:'));
    settings.addChild(autoToggleLights);
    homeControl.addChild(settings);
    homeControl.addChild(this.desk.lightGroupsArea);
    this.addGroupDeskStuff(this.desk, this.state.groups);

    return desk;
  }

  private async interval() {
    const lights = await this.hue.lights();
    const states = new Map<string, {state: 'on'|'off', brightness: number}>();
    for (const light of lights.lights) {
      if (!light.id) continue;
      const state = light.state.on ? 'on' : 'off';
      const brightness = light.state.bri / 255;
      states.set(light.id, {state, brightness});
      if (this.state.autoToggleLights && light.name === 'Downstairs Living Room 1') {
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
        if (this.state.externalLignts.brightness !== brightness) {
          this.state.externalLignts.brightness = brightness;
          this.display.transitionMasterBrightness(brightness);
        }
      }
    }
    for (const group of this.state.groups) {
      let newState: 'on' | 'off' = 'off';
      const brightnesses: number[] = [];
      for (const l of group.lights) {
        const state = states.get(l);
        if (!state) continue;
        if (state.state === 'on') newState = 'on';
        brightnesses.push(state.brightness);
      }
      if (brightnesses.length === 0) continue;
      const brightness = brightnesses.reduce((a, b) => a + b, 0) / brightnesses.length;
      if (group.state !== newState) {
        group.state = newState;
        if (this.desk) {
          const components = this.desk.lightGroupToComponents.get(group.id);
          if (components) components.toggle.setValue(newState);
        }
      }
      if (group.brightness !== brightness) {
        group.brightness = brightness;
        if (this.desk) {
          const components = this.desk.lightGroupToComponents.get(group.id);
          if (components) components.brightness.setValue(brightness);
        }
      }
    }
  }

}
