import artnet = require('artnet');
import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import { INTEGER_REGEX } from './util';

const MAX_UNIVERSE = 32767;

type ArtNet = ReturnType<typeof artnet>;

const UNIVERSE_CONFIG = t.intersection([
  t.partial({
    name: t.string,
  }),
  t.type({
    type: t.literal('artnet'),
    universe: t.number,
    config: t.partial({
      /** Send the full universe each frame rather than only changed values */
      sendAll: t.boolean,
      host: t.string,
      port: t.number,
      iface: t.string,
      refresh: t.number,
    }),
  }),
]);

type UniverseConfig = t.TypeOf<typeof UNIVERSE_CONFIG>;

export const UNIVERSES_CONFIG = t.array(UNIVERSE_CONFIG);

export type UniversesConfig = t.TypeOf<typeof UNIVERSES_CONFIG>;

type ActiveUniverse = {
  config: UniverseConfig;
  type: 'artnet';
  buffer: number[];
  artnet: ArtNet;
};

export class Universes {
  private lastConfig: UniversesConfig = [];
  public readonly group: ld.Group = new ld.Group(
    { direction: 'vertical' },
    { defaultCollapsibleState: 'closed' }
  );

  private readonly universes: ActiveUniverse[] = [];

  public constructor(
    private readonly updateConfig: (
      update: (current: UniversesConfig) => UniversesConfig
    ) => void
  ) {
    this.updateConfig((c) => c);

    this.group
      .addHeaderButton(new ld.Button('Add Universe', 'add'))
      .addListener(() => {
        updateConfig((config) => [
          ...config,
          {
            type: 'artnet',
            universe: Math.max(0, ...config.map((u) => u.universe + 1)),
            config: {},
          },
        ]);
      });

    this.group
      .addHeaderButton(new ld.Button('Remove Universe', 'remove'))
      .addListener(() => {
        updateConfig((config) => config.slice(0, config.length - 1));
      });
  }

  public setConfig = (config: UniversesConfig) => {
    if (config === this.lastConfig) {
      return;
    }
    this.lastConfig = config;
    this.group.removeAllChildren();
    this.group.setTitle(`Universes (${config.length})`);
    config.map((uConfig, i) => {
      const uGroup = this.group.addChild(
        new ld.Group({}, { editableTitle: true })
      );
      uGroup.setTitle(uConfig.name || '');
      uGroup.setLabels([{ text: `Universe ${i}` }, { text: uConfig.type }]);

      const updateConfig = (
        update: (current: UniverseConfig) => UniverseConfig
      ) => {
        this.updateConfig((current) => {
          const newConfig = [...current];
          newConfig[i] = update(newConfig[i]);
          return newConfig;
        });
      };

      uGroup.addListener('title-changed', (title) => {
        updateConfig((current) => ({ ...current, name: title }));
      });

      uGroup.addChild(new ld.Label('Universe:'));
      const universe = uGroup.addChild(
        new ld.TextInput(uConfig.universe.toString())
      );

      universe.addListener((value) => {
        if (!INTEGER_REGEX.exec(value)) {
          throw new Error(`Universe value must be a positive integer`);
        }
        const artnetUniverse = parseInt(value);
        if (artnetUniverse < 0 || artnetUniverse > MAX_UNIVERSE) {
          throw new Error(`Universe must be between 0 and ${MAX_UNIVERSE}`);
        }
        updateConfig((current) => ({ ...current, universe: artnetUniverse }));
      });

      uGroup.addChild(new ld.Label('SendAll:'));
      const sendAll = uGroup.addChild(
        new ld.Switch(uConfig.config.sendAll ?? true ? 'on' : 'off')
      );
      sendAll.addListener((value) => {
        updateConfig((current) => ({
          ...current,
          config: { ...current.config, sendAll: value === 'on' },
        }));
      });

      uGroup.addChild(new ld.Label('Host:'));
      const host = uGroup.addChild(new ld.TextInput(uConfig.config.host ?? ''));
      host.addListener((value) => {
        updateConfig((current) => ({
          ...current,
          config: { ...current.config, host: value || undefined },
        }));
      });

      uGroup.addChild(new ld.Label('Port:'));
      const port = uGroup.addChild(
        new ld.TextInput(uConfig.config.port?.toString() ?? '')
      );
      port.addListener((value) => {
        if (!value) {
          updateConfig((current) => ({
            ...current,
            config: { ...current.config, port: undefined },
          }));
        }
        if (!INTEGER_REGEX.exec(value)) {
          throw new Error(`Port value must be a positive integer`);
        }
        updateConfig((current) => ({
          ...current,
          config: { ...current.config, port: parseInt(value) },
        }));
      });

      uGroup.addChild(new ld.Label('Interface:'));
      const iface = uGroup.addChild(
        new ld.TextInput(uConfig.config.iface ?? '')
      );
      iface.addListener((value) => {
        updateConfig((current) => ({
          ...current,
          config: { ...current.config, iface: value || undefined },
        }));
      });

      uGroup.addChild(new ld.Label('Refresh:'));
      const refresh = uGroup.addChild(
        new ld.TextInput(uConfig.config.refresh?.toString() ?? '')
      );
      refresh.addListener((value) => {
        if (!value) {
          updateConfig((current) => ({
            ...current,
            config: { ...current.config, refresh: undefined },
          }));
        }
        if (!INTEGER_REGEX.exec(value)) {
          throw new Error(`Refresh value must be a positive integer`);
        }
        updateConfig((current) => ({
          ...current,
          config: { ...current.config, refresh: parseInt(value) },
        }));
      });
    });
    this.destroyUniverses();
    this.universes.push(...config.map(this.createUniverse));
  };

  private createUniverse = (config: UniverseConfig): ActiveUniverse => {
    switch (config.type) {
      case 'artnet':
        return {
          config,
          type: 'artnet',
          buffer: [],
          artnet: artnet({
            host: config.config.host,
            port: config.config.port,
            iface: config.config.iface,
            refresh: config.config.refresh,
            sendAll: config.config.sendAll,
          }),
        };
    }
  };

  private destroyUniverses = () => {
    for (const universe of this.universes) {
      universe.artnet.close();
    }
    this.universes.splice(0, this.universes.length);
  };

  public destroy = () => {
    this.destroyUniverses();
  };

  public render = (setValues: (buffers: (number[] | undefined)[]) => void) => {
    for (const universe of this.universes) {
      for (let i = 0; i < 512; i++) {
        universe.buffer[i] = 0;
      }
    }

    setValues(this.universes.map((u) => u.buffer));

    for (const universe of this.universes) {
      universe.artnet.set(universe.config.universe, 1, universe.buffer);
    }
  };

  public validateUniverse = (text: string): number => {
    if (!INTEGER_REGEX.exec(text)) {
      throw new Error(`Universe must be positive integers`);
    }
    const u = parseInt(text);
    if (u < 0 || u >= this.lastConfig.length) {
      throw new Error(`Universe ${u} does not exist`);
    }
    return u;
  };
}
