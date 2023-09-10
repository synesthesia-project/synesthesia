import * as ld from '@synesthesia-project/light-desk';
import { isEqual } from 'lodash';

export type Option = {
  id: string;
  name: string[];
};

export const createTreeSelector = () => {
  const ldComponent = new ld.Group({ noBorder: true });

  const selectFrom = (options: Option[], select: (id: string) => void) => {
    const path: string[] = [];

    const updateComponents = () => {
      ldComponent.removeAllChildren();

      if (path.length > 0) {
        // Add breadcrumbs for path so far
        ldComponent.addChild(new ld.Label({ text: path.join(' > ') }));
        // Go Back
        ldComponent
          .addChild(new ld.Button({ icon: 'backspace' }))
          .addListener('click', () => {
            path.splice(path.length - 1);
            updateComponents();
          });
      }

      // Add buttons for each option
      const addedOptions = new Set<string>();

      const availableOptions = options
        // Select applicable options
        .filter((option) => isEqual(path, option.name.slice(0, path.length)))
        // Add field to sort on
        .map((option) => ({
          id: option.id,
          pathComponent: option.name.slice(path.length)[0] ?? '',
        }))
        // Add a button for each
        .sort((a, b) => a.pathComponent.localeCompare(b.pathComponent));

      const optionsGroup = ldComponent.addChild(
        new ld.Group({ noBorder: true, wrap: true })
      );

      for (const option of availableOptions) {
        if (!addedOptions.has(option.pathComponent)) {
          if (option.pathComponent === '') {
            ldComponent
              .addChild(new ld.Button({ text: 'Select', icon: 'check_circle' }))
              .addListener('click', () => {
                select(option.id);
                ldComponent.removeAllChildren();
              });
          } else {
            optionsGroup
              .addChild(
                new ld.Button({
                  text: option.pathComponent,
                  icon: 'chevron_right',
                })
              )
              .addListener('click', () => {
                path.push(option.pathComponent);
                updateComponents();
              });
          }
          addedOptions.add(option.pathComponent);
        }
      }
    };

    updateComponents();
  };

  return {
    ldComponent,
    selectFrom,
  };
};
