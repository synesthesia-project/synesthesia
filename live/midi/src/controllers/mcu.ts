import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';

import { Controller } from './interface';

export const MACKIE_MCU_CONTROLLER_CONFIG = t.type({
  type: t.literal('mcu'),
  /**
   * Required if you want to set LCD text
   */
  deviceId: t.union([t.null, t.number]),
});

export type MackieMcuControllerConfig = t.TypeOf<
  typeof MACKIE_MCU_CONTROLLER_CONFIG
>;

export const createMackieMcuController =
  (): Controller<MackieMcuControllerConfig> => {
    const group = new ld.Group({ noBorder: true });

    group.addChild(new ld.Label('MCU Controller'));

    return {
      getComponent: () => group,
      destroy: () => {
        // TODO
      },
      applyConfig: () => {
        // TODO
      },
      getLabels: () => [{ text: 'Mackie MCU' }],
    };
  };
