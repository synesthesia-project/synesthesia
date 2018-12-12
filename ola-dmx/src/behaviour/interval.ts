import * as lightDesk from '@synesthesia-project/light-desk';

export class Interval {

  private callee: () => void;
  private intervalMs: number;
  private enabled = true;
  private timeout: NodeJS.Timer;
  private next: number;

  private lightDesk: {
    group: lightDesk.Group;
  } | null = null;

  public constructor(callee: () => void, defaultInterval: number) {
    this.callee = callee;
    this.intervalMs = defaultInterval;

    this.trigger = this.trigger.bind(this);

    this.resetTimeout();
  }

  public lightDeskGroup(label: string) {
    if (!this.lightDesk) {
      const group = new lightDesk.Group();
      group.setTitle(label);
      group.addChild(new lightDesk.Label('Automatically:'));
      group.addChild(new lightDesk.Switch('on').addListener(state => {
        this.enabled = state === 'on';
        this.resetTimeout();
      }));
      group.addChild(new lightDesk.Label('Period'));
      group.addChild(new lightDesk.Button('Trigger').addListener(this.callee));

      this.lightDesk = {group};
    }
    return this.lightDesk.group;
  }

  private trigger() {
    clearTimeout(this.timeout);
    this.callee();
    this.resetTimeout();
  }

  private resetTimeout() {
    clearTimeout(this.timeout);
    if (this.enabled && this.intervalMs > 0) {
      this.timeout = setTimeout(this.trigger, this.intervalMs);
      this.next = new Date().getTime() + this.intervalMs;
    }
  }
}
