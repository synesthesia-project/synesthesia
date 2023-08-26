import * as t from 'io-ts';
import * as ld from '@synesthesia-project/light-desk';

import { Controller } from './interface';

export const GENERIC_CONTROLLER_CONFIG = t.type({
  type: t.literal('generic'),
});

export type GenericControllerConfig = t.TypeOf<
  typeof GENERIC_CONTROLLER_CONFIG
>;

export const createGenericController =
  (): Controller<GenericControllerConfig> => {
    const group = new ld.Group({ noBorder: true });

    group.addChild(new ld.Label('Generic Controller'));

    return {
      getComponent: () => group,
      destroy: () => {
        // TODO
      },
      applyConfig: () => {
        // TODO
      },
      getLabels: () => [{ text: 'Generic' }],
    };
  };
