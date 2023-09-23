import * as React from 'react';
import * as ld from '@synesthesia-project/light-desk';
import { Group, LightDeskRenderer, Tab, Tabs } from '@synesthesia-project/react-light-desk';
import type { OutputKind } from '@synesthesia-project/live-core/lib/plugins';

export const createDesk = () => {
  const desk = new ld.LightDesk();

  const deskRoot = new ld.Group({ noBorder: true, direction: 'vertical' });
  desk.setRoot(deskRoot);

  // Desk

  const pluginComponentsGroup = 
    new ld.Group({ direction: 'vertical', noBorder: true });

  const compositorCueTriggers = new ld.Group({ direction: 'vertical' });

  const sequencesDesk = new ld.Group({ direction: 'vertical', noBorder: true });

  // Compositor

  const compositorHeader = new ld.Group({ noBorder: true, wrap: true });

  const addCompositorCueButton = new ld.Button({ text: `Add Cue`, icon: 'add' });

  const compositorCuesGroup = new ld.Group({ direction: 'vertical', noBorder: true });

  // Sequences

  const sequencesGroup = new ld.Group({ direction: 'vertical', noBorder: true });

  // Outputs

  const outputHeader = new ld.Group({ noBorder: true });

  outputHeader.addChild(new ld.Label({ text: `Output Name:` }));

  const addOutputKey = outputHeader.addChild(new ld.TextInput());

  const outputsGroup = new ld.Group({ direction: 'vertical', noBorder: true });

  LightDeskRenderer.render(
    <Tabs>
      <Tab name="Desk" key="desk">
        <Group
          direction="vertical"
          noBorder={true}
          ref={(g) =>
            g?.addChildren(
              pluginComponentsGroup,
              compositorCueTriggers,
              sequencesDesk
            )
          }
        />
      </Tab>
      <Tab name="Compositor" key="compositor">
        <Group
          direction="vertical"
          noBorder={true}
          ref={(g) =>
            g?.addChildren(
              compositorHeader,
              addCompositorCueButton,
              compositorCuesGroup
            )
          }
        />
      </Tab>
      <Tab name="Sequences" key="sequences">
        <Group
          direction="vertical"
          noBorder={true}
          ref={(g) => g?.addChildren(sequencesGroup)}
        />
      </Tab>
      <Tab name="Outputs" key="outputs">
        <Group
          direction="vertical"
          noBorder={true}
          ref={(g) => g?.addChildren(outputHeader, outputsGroup)}
        />
      </Tab>
    </Tabs>,
    deskRoot
  );

  const init = (options: {
    addCompositorCue: () => Promise<void>;
    addOutput: (kind: OutputKind<unknown>, name: string) => Promise<void>;
    outputKinds: Array<OutputKind<unknown>>;
  }) => {
    for (const kind of options.outputKinds) {
      const addButton = new ld.Button({ text: kind.kind, icon: 'add' });
      outputHeader.addChild(addButton);
      addButton.addListener('click', () =>
        options.addOutput(kind, addOutputKey.getValue() || '')
      );
    }
    addCompositorCueButton.addListener('click', options.addCompositorCue);
  };

  return {
    desk,
    outputsGroup,
    sequencesGroup,
    pluginComponentsGroup,
    compositorCuesGroup,
    compositorCueTriggers,
    sequencesDesk,
    init,
  };
};
