import * as ld from '@synesthesia-project/light-desk';
import { ControllerConfig, ControllersConfig } from '../config';
import {
  CONFIG_MISSING,
  ConfigApplyer,
  ConfigNode,
} from '@synesthesia-project/live-core/lib/util';
import { v4 as uuidv4 } from 'uuid';
import { Controller } from './interface';
import { GenericControllerConfig, createGenericController } from './generic';
import { MackieMcuControllerConfig, createMackieMcuController } from './mcu';
import { config } from 'process';

export type ControllerSocket = {
  group: ld.Group;
  applyConfig: ConfigApplyer<ControllerConfig>;
  destroy: () => void;
};

const CONTROLLER_INSTANCE = Symbol('controller');

type ActiveController =
  | (GenericControllerConfig & {
      [key in typeof CONTROLLER_INSTANCE]: Controller<GenericControllerConfig>;
    })
  | (MackieMcuControllerConfig & {
      [key in typeof CONTROLLER_INSTANCE]: Controller<MackieMcuControllerConfig>;
    })
  | null;

export const initializeControllers = (
  configNode: ConfigNode<ControllersConfig>
) => {
  const controllersGroup = new ld.Group({
    direction: 'vertical',
    noBorder: true,
  });

  const controllers: Record<string, ControllerSocket> = {};

  const createControllerSocket = (cId: string): ControllerSocket => {
    const group = new ld.Group({}, { defaultCollapsibleState: 'closed' });
    let activeController: ActiveController = null;

    group.addHeaderButton(new ld.Button(null, 'delete')).addListener(() => {
      configNode.update((config) => {
        const newConfig = { ...config };
        delete newConfig[cId];
        return newConfig;
      });
    });

    const changeTypeButton = new ld.Button(
      'Change Type',
      'refresh'
    ).addListener(() => {
      configNode.update((config) => ({
        ...config,
        [cId]: {
          ...config[cId],
          config: null,
        },
      }));
    });

    const applyConfig: ConfigApplyer<ControllerConfig> = (config) => {
      group.setTitle(config.name);

      // Initialize or change the controller if needed

      if (!activeController || config.config?.type !== activeController?.type) {
        // Either no controller, or it has changed type, reinitialize
        group.removeAllChildren();
        group.removeHeaderButton(changeTypeButton);
        activeController = null;

        if (!config.config) {
          group
            .addChild(new ld.Button('Generic Controller'))
            .addListener(() => {
              configNode.update((config) => ({
                ...config,
                [cId]: {
                  ...config[cId],
                  config: {
                    type: 'generic',
                  },
                },
              }));
            });

          group
            .addChild(new ld.Button('Mackie MCU Controller'))
            .addListener(() => {
              configNode.update((config) => ({
                ...config,
                [cId]: {
                  ...config[cId],
                  config: {
                    type: 'mcu',
                    deviceId: null,
                  },
                },
              }));
            });
        } else {
          if (config.config.type === 'generic') {
            activeController = {
              [CONTROLLER_INSTANCE]: createGenericController(),
              ...config.config,
            };
          } else if (config.config.type === 'mcu') {
            activeController = {
              [CONTROLLER_INSTANCE]: createMackieMcuController(),
              ...config.config,
            };
          } else {
            throw new Error(`Unknown controller type`);
          }
          group.addHeaderButton(changeTypeButton);
          group.addChild(activeController[CONTROLLER_INSTANCE].getComponent());
        }
      }

      // Update config

      if (
        activeController?.type === 'generic' &&
        config.config?.type === 'generic'
      ) {
        // Update existing generic controller
        activeController[CONTROLLER_INSTANCE].applyConfig(
          config.config,
          activeController
        );
        activeController = {
          [CONTROLLER_INSTANCE]: activeController[CONTROLLER_INSTANCE],
          ...config.config,
        };
      } else if (
        activeController?.type === 'mcu' &&
        config.config?.type === 'mcu'
      ) {
        // Update existing MCU controller
        activeController[CONTROLLER_INSTANCE].applyConfig(
          config.config,
          activeController
        );
        activeController = {
          [CONTROLLER_INSTANCE]: activeController[CONTROLLER_INSTANCE],
          ...config.config,
        };
      } else if (config.config) {
        throw new Error(
          `Active controller does not match config after initialization`
        );
      }

      group.setLabels(
        activeController?.[CONTROLLER_INSTANCE].getLabels() || []
      );
    };

    const destroy = () => {
      activeController?.[CONTROLLER_INSTANCE].destroy();
    };

    return {
      group,
      applyConfig,
      destroy,
    };
  };

  configNode.addListener('change', (newConfig, oldConfig) => {
    newConfig = newConfig === CONFIG_MISSING ? {} : { ...newConfig };
    oldConfig = oldConfig === CONFIG_MISSING ? {} : { ...oldConfig };
    for (const [cId, cConfig] of Object.entries(config)) {
      if (!controllers[cId]) {
        controllers[cId] = createControllerSocket(cId);
        controllersGroup.addChild(controllers[cId].group);
      }
      controllers[cId].applyConfig(cConfig, oldConfig?.[cId] ?? null);
    }
    for (const [cId, controller] of Object.entries(controllers)) {
      if (!newConfig[cId]) {
        controller.destroy();
        controllersGroup.removeChild(controllers[cId].group);
        delete controllers[cId];
      }
    }
  });

  const addController = (name: string) =>
    configNode.update((config) => ({
      ...config,
      [uuidv4()]: {
        name,
        config: null,
      },
    }));

  return {
    controllersGroup,
    addController,
  };
};
