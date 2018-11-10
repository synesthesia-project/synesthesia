import * as lightDesk from '@samlanning/synesthesia-light-desk';

export class Interval {

  private callee: () => void;
  private intervalMs: number;
  private interval: NodeJS.Timer;

  public constructor(callee: () => void, defaultInterval: number) {
    this.callee = callee;
    this.intervalMs = defaultInterval;
    this.interval = setInterval(callee, defaultInterval);
  }

  public lightDeskGroup(label: string) {
    const group = new lightDesk.Group();

    group.addChild(new lightDesk.Label(label, {bold: true}));
    group.addChild(new lightDesk.Label('Automatically:'));
    group.addChild(new lightDesk.Label('Tickbox'));
    group.addChild(new lightDesk.Label('Period'));
    group.addChild(new lightDesk.Button('Trigger').addListener(this.callee));

    return group;
  }
}
