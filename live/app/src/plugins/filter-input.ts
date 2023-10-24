import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';
import type {
  Input,
  InputContext,
  InputKind,
  Plugin,
} from '@synesthesia-project/live-core/lib/plugins';
import {
  CompositorModule,
  PixelInfo,
} from '@synesthesia-project/compositor/lib/modules';
import {
  RGBAColor,
  RGBA_TRANSPARENT,
} from '@synesthesia-project/compositor/lib/color';
import {
  OPTIONAL_KIND_AND_CONFIG,
  OptionalKindAndConfig,
} from '@synesthesia-project/live-core/lib/config';
import { matches } from 'lodash';

const FILTER_INPUT_CONFIG = t.array(
  t.type({
    filter: t.record(t.string, t.string),
    input: OPTIONAL_KIND_AND_CONFIG,
  })
);

type Config = t.TypeOf<typeof FILTER_INPUT_CONFIG>;

type Option = {
  config: Config[number];
  input: Input<OptionalKindAndConfig>;
  components: {
    group: ld.Group;
    filterGroup: ld.Group;
    filters: Map<string, ld.Group>;
  };
};

const getProperties = (info: PixelInfo<unknown>): Record<string, string> => {
  const properties: Record<string, string> = {};
  for (const [key, value] of Object.entries(
    (info.data as { properties: Record<string, unknown> }).properties
  )) {
    if (typeof value === 'string') {
      properties[key] = value;
    }
  }
  return properties;
};

const createFilterInput = (context: InputContext<Config>): Input<Config> => {
  const group = new ld.Group({ direction: 'vertical', noBorder: true });

  const options: Option[] = [];

  const cache: {
    pixelToOption: Map<PixelInfo<unknown>, Option | 'none'>;
  } = {
    pixelToOption: new Map(),
  };

  let knownProperties: null | Set<string> = null;

  const header = group.addChild(new ld.Group({ noBorder: true, wrap: true }));

  const addLayer = header.addChild(
    new ld.Button({ text: 'Add Layer', icon: 'add' })
  );
  addLayer.addListener('click', () => {
    context.updateConfig((current) => [
      ...(current || []),
      { filter: {}, input: null },
    ]);
  });

  // TODO: fire an event when properties are changed,
  // and add a listener to auto refresh properties here when that happens
  header
    .addChild(new ld.Button({ text: 'Refresh Properties', icon: 'refresh' }))
    .addListener('click', () => {
      knownProperties = null;
    });

  const layersGroup = group.addChild(
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  const updateFilters = (oId: number) => {
    const option = options[oId];
    option.components.filterGroup.removeAllChildren();
    for (const p of knownProperties || []) {
      // Add new property
      if (!option.components.filters.has(p)) {
        const filterGroup = new ld.Group({ noBorder: true});
        filterGroup.addChild(new ld.Label({ text: `${p}:` }));
        filterGroup
          .addChild(new ld.TextInput({ value: option.config.filter[p] }))
          .addListener('change', (value) =>
            context.updateConfig((current) => {
              return [
                ...current.slice(0, oId),
                {
                  ...current[oId],
                  filter: value
                    ? {
                        ...current[oId].filter,
                        [p]: value,
                      }
                    : Object.fromEntries(
                        Object.entries(current[oId].filter).filter(
                          ([k]) => k !== p
                        )
                      ),
                },
                ...current.slice(oId + 1),
              ];
            })
          );
        option.components.filters.set(p, filterGroup);
      }
    }
    for (const key of option.components.filters.keys()) {
      if (!knownProperties?.has(key)) {
        option.components.filters.delete(key);
      }
    }
    option.components.filterGroup.addChildren(
      ...[...option.components.filters.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, filterGroup]) => filterGroup)
    );
  };

  const render: CompositorModule['render'] = (map, pixels) => {
    // if properties don't exist yet, populate them
    if (!knownProperties) {
      knownProperties = new Set<string>();
      for (const p of pixels) {
        for (const key of Object.keys(getProperties(p))) {
          knownProperties.add(key);
        }
      }
      // Update filters display now we have properties
      options.map((_, i) => updateFilters(i));
    }

    // Render each option
    // TODO: make this more efficient by only passing along the filtered pixels
    // to children modules

    const optionToRender = new Map<Option, RGBAColor[]>(
      options.map((option) => [
        option,
        option.input.getModlue().render(map, pixels),
      ])
    );

    return pixels.map<RGBAColor>((info, i) => {
      let option = cache.pixelToOption.get(info);
      // Calculate and cache option mapping if it doesn't exist yet
      if (!option) {
        for (const o of options) {
          if (matches(o.config.filter)(getProperties(info))) {
            cache.pixelToOption.set(info, (option = o));
            break;
          }
        }
        if (!option) {
          cache.pixelToOption.set(info, (option = 'none'));
        }
      }
      // Get render
      if (option !== 'none') {
        const render = optionToRender.get(option);
        if (render) {
          return render[i];
        }
      }
      return RGBA_TRANSPARENT;
    });
  };

  return {
    applyConfig: (config, lastConfig) => {
      // Add any missing layers
      for (let i = lastConfig?.length ?? 0; i < config.length; i++) {
        const deleteButton = new ld.Button({ icon: 'delete' });
        deleteButton.addListener('click', () =>
          context.updateConfig((current) => [
            ...current.slice(0, i),
            ...current.slice(i + 1),
          ])
        );

        const group = new ld.Group({
          direction: 'vertical',
          defaultCollapsibleState: 'auto',
        });

        group.addHeaderChild(deleteButton);

        const filterGroup = group.addChild(new ld.Group({ noBorder: true }));

        const input = context.createInputSocket({
          updateConfig: async (update) =>
            context.updateConfig((current) => [
              ...current.slice(0, i),
              {
                ...current[i],
                input: update(current[i].input),
              },
              ...current.slice(i + 1),
            ]),
        });
        options[i] = {
          input,
          config: config[i],
          components: {
            group,
            filterGroup,
            filters: new Map(),
          },
        };
        input.applyConfig(config[i].input, null);
        group.addChild(input.getLightDeskComponent());
        layersGroup.addChild(group);
      }
      // Remove any extra layers
      options.splice(config.length).map((layer) => {
        layer.input.destroy();
        layersGroup.removeChild(layer.components.group);
      });
      // Update each layers' config
      for (let i = 0; i < config.length; i++) {
        options[i].config = config[i];
        options[i].input.applyConfig(config[i]?.input, lastConfig?.[i]?.input);
        updateFilters(i);
      }
      // Clear the cache
      cache.pixelToOption.clear();
    },
    getLightDeskComponent: () => group,
    destroy: () => {
      options.map((layer) => layer.input.destroy());
    },
    getModlue: () => ({ render }),
  };
};

export const FILTER_INPUT_KIND: InputKind<Config> = {
  kind: 'filter',
  config: FILTER_INPUT_CONFIG,
  initialConfig: [],
  create: createFilterInput,
};

export const FILTER_INPUT_PLUGIN: Plugin = {
  init: (context) => {
    context.registerInputKind(FILTER_INPUT_KIND);
  },
};
