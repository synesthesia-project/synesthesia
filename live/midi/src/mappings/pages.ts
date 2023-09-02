import * as ld from '@synesthesia-project/light-desk/';
import {
  CONFIG_MISSING,
  ConfigNode,
} from '@synesthesia-project/live-core/lib/util';

import { PageConfig, PagesConfig } from '../config';
import { initializeLights } from './lights';

type Page = {
  tab: ld.Group;
};

export const initializePages = (config: ConfigNode<PagesConfig>) => {
  const pagesTabs = new ld.Tabs();

  const pages: Page[] = [];

  // TODO: add buttons to tabs, and move addPage button there
  const addPage = () => config.update((config) => [...config, {}]);

  // TODO: create buttons to cycle active page

  const initializePage = (config: ConfigNode<PageConfig>): Page => {
    const tab = new ld.Group({ direction: 'vertical', noBorder: true });

    tab
      .addChild(new ld.Button('Remove Page', 'remove'))
      .addListener(config.delete);

    const lights = initializeLights(
      config.createChild({
        get: (config) => config.lights,
        updateParentByChild: (current, childUpdate) => ({
          ...current,
          lights: childUpdate(current.lights),
        }),
      })
    );

    tab.addChild(lights.group);

    return { tab };
  };

  config.addListener('change', (newConfig) => {
    if (newConfig === CONFIG_MISSING) return;
    // Create pages that don't exist yet
    for (let i = pages.length; i < newConfig.length; i++) {
      const pageId = i;
      const page = initializePage(
        config.createChild({
          get: (config) => config[i],
          updateParentByChild: (current, childUpdate) => {
            const newConfig = [...current];
            newConfig[pageId] = childUpdate(newConfig[pageId]);
            return newConfig;
          },
          del: (current) => [
            ...current.slice(0, pageId),
            ...current.slice(pageId + 1),
          ],
        })
      );
      pagesTabs.addTab(`Page ${i}`, page.tab);
      pages.push(page);
    }

    // TODO: Remove pages that don't exist anymore
  });

  return {
    pagesTabs,
    addPage,
  };
};
