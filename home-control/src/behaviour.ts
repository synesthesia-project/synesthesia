import * as lightDesk from '@samlanning/synesthesia-light-desk';
import * as ola from '@samlanning/synesthesia-ola-dmx';
import {HueApi, lightState} from 'node-hue-api';

const INTERVAL = 1000;

interface StateGroup {
  id: string;
  name: string;
  lights: string[];
  state: 'unknown' | 'on' | 'off';
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
  lightGroupToComponents: Map<string, {toggle: lightDesk.Switch}>;
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
          state: 'unknown'
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

      const label = new lightDesk.Label(lightGroup.name);
      group.addChild(label);

      const toggle = new lightDesk.Switch('on');
      toggle.addListener(value => {
        this.hue.setGroupLightState(lightGroup.id, lightState.create().on(value === 'on'));
      });
      group.addChild(toggle);

      desk.lightGroupToComponents.set(lightGroup.id, {toggle});
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
      lightGroupsArea: new lightDesk.Group({direction: 'vertical'}),
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
    const states = new Map<string, 'on'|'off'>();
    for (const light of lights.lights) {
      if (!light.id) continue;
      states.set(light.id, light.state.on ? 'on' : 'off');
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
      }
    }
    for (const group of this.state.groups) {
      let newState: 'on' | 'off' = 'off';
      for (const l of group.lights) {
        if (states.get(l) === 'on') newState = 'on';
      }
      if (group.state !== newState) {
        group.state = newState;
        if (this.desk) {
          const components = this.desk.lightGroupToComponents.get(group.id);
          if (components) components.toggle.setValue(newState);
        }
      }
    }
  }

}
