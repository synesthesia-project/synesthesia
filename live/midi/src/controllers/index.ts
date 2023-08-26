import * as ld from '@synesthesia-project/light-desk';
import { ControllerConfig, ControllersConfig } from '../config';
import {
  ConfigApplyer,
  ConfigUpdater,
} from '@synesthesia-project/live-core/lib/util';
import { v4 as uuidv4 } from 'uuid';

export type ControllerSocket = {
  group: ld.Group;
  applyConfig: ConfigApplyer<ControllerConfig>;
  destroy: () => void;
};

export const initializeControllers = (
  updateConfig: ConfigUpdater<ControllersConfig>
) => {
  const controllersGroup = new ld.Group({
    direction: 'vertical',
    noBorder: true,
  });

  const controllers: Record<string, ControllerSocket> = {};

  const createControllerSocket = (cId: string): ControllerSocket => {
    const group = new ld.Group({}, { defaultCollapsibleState: 'closed' });

    group.addHeaderButton(new ld.Button(null, 'delete')).addListener(() => {
      updateConfig((config) => {
        const newConfig = { ...config };
        delete newConfig[cId];
        return newConfig;
      });
    });

    const applyConfig: ConfigApplyer<ControllerConfig> = (_config) => {
      // TODO
    };

    const destroy = () => {
      // TODO
    };

    return {
      group,
      applyConfig,
      destroy,
    };
  };

  const applyConfig: ConfigApplyer<ControllersConfig> = (config) => {
    for (const [cId, cConfig] of Object.entries(config)) {
      if (!controllers[cId]) {
        controllers[cId] = createControllerSocket(cId);
        controllersGroup.addChild(controllers[cId].group);
      }
      controllers[cId].group.setTitle(cConfig.name);
    }
    for (const [cId, controller] of Object.entries(controllers)) {
      if (!config[cId]) {
        controller.destroy();
        controllersGroup.removeChild(controllers[cId].group);
        delete controllers[cId];
      }
    }
  };

  const addController = (name: string) =>
    updateConfig((config) => ({
      ...config,
      [uuidv4()]: {
        name,
        config: null,
      },
    }));

  return {
    controllersGroup,
    applyConfig,
    addController,
  };
};
