import * as ld from '@synesthesia-project/light-desk';
import { ConfigApplyer } from '@synesthesia-project/live-core/lib/util';

export type Controller<T> = {
  getComponent: () => ld.Component;
  getLabels: () => Array<{ text: string }>;
  destroy: () => void;
  applyConfig: ConfigApplyer<T>;
};
