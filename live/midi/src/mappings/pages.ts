import * as ld from '@synesthesia-project/light-desk/';
import {
  ConfigApplyer,
  ConfigUpdater,
} from '@synesthesia-project/live-core/lib/util';

import { PageConfig, PagesConfig } from '../config';
import { initializeLights } from './lights';

type Page = {
  tab: ld.Group;
  applyConfig: ConfigApplyer<PageConfig>;
};

export const initializePages = (updateConfig: ConfigUpdater<PagesConfig>) => {
  const pagesTabs = new ld.Tabs();

  const pages: Page[] = [];

  // TODO: add buttons to tabs, and move addPage button there
  const addPage = () => updateConfig((config) => [...config, {}]);

  // TODO: create buttons to cycle active page

  const initializePage = (page: number): Page => {
    const tab = new ld.Group({ direction: 'vertical', noBorder: true });

    tab.addChild(new ld.Button('Remove Page', 'remove')).addListener(() =>
      updateConfig((config) => {
        const newConfig = [...config];
        newConfig.splice(page, 1);
        return newConfig;
      })
    );

    const lights = initializeLights((update) =>
      updateConfig((config) => {
        const newConfig = [...config];
        newConfig[page] = {
          ...newConfig[page],
          lights: update(newConfig[page]?.lights ?? []),
        };
        return newConfig;
      })
    );

    tab.addChild(lights.group);

    const applyConfig: ConfigApplyer<PageConfig> = (newConfig, oldConfig) => {
      lights.applyConfig(newConfig.lights ?? [], oldConfig?.lights ?? null);
    };

    return { tab, applyConfig };
  };

  const applyConfig: ConfigApplyer<PagesConfig> = (newConfig, oldConfig) => {
    // Create pages that don't exist yet
    for (let i = pages.length; i < newConfig.length; i++) {
      const page = initializePage(i);
      pagesTabs.addTab(`Page ${i}`, page.tab);
      pages.push(page);
    }

    // TODO: Remove pages that don't exist anymore

    // Update config of each page
    for (let i = 0; i < newConfig.length; i++) {
      pages[i].applyConfig(newConfig[i], oldConfig?.[i] ?? null);
    }
  };

  return {
    pagesTabs,
    addPage,
    applyConfig,
  };
};
