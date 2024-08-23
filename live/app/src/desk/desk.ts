import * as ld from '@synesthesia-project/light-desk';
import type { OutputKind } from '@synesthesia-project/live-core/lib/plugins';

export const createDesk = () => {
  const desk = new ld.LightDesk();

  const deskRoot = new ld.Group({ noBorder: true, direction: 'vertical' });
  desk.setRoot(deskRoot);

  const tabs = deskRoot.addChild(new ld.Tabs());

  // Desk

  const deskTab = tabs.addTab(
    'Desk',
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  const pluginComponentsGroup = deskTab.addChild(
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  const dimmerGroup = deskTab.addChild(
    new ld.Group({ noBorder: true, wrap: true })
  );

  dimmerGroup.addChild(new ld.Label({ text: `Dimmer:` }));

  const compositorDimmer = dimmerGroup.addChild(
    new ld.SliderButton({
      value: 1,
      min: 0,
      max: 1,
      step: 0.01,
      mode: 'writeThrough',
    })
  );

  const compositorCueTriggers = deskTab.addChild(
    new ld.Group({ direction: 'vertical' })
  );

  const sequencesDesk = deskTab.addChild(
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  // Compositor

  const compositorTab = tabs.addTab(
    'Compositor',
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  const compositorHeader = compositorTab.addChild(
    new ld.Group({ noBorder: true, wrap: true })
  );

  const addCompositorCueButton = compositorHeader.addChild(
    new ld.Button({ text: `Add Cue`, icon: 'add' })
  );

  const compositorCuesGroup = compositorTab.addChild(
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  // Sequences

  const sequencesGroup = tabs.addTab(
    'Sequences',
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  // Outputs

  const outputsTab = tabs.addTab(
    'Outputs',
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  const outputHeader = outputsTab.addChild(new ld.Group({ noBorder: true }));

  outputHeader.addChild(new ld.Label({ text: `Output Name:` }));

  const addOutputKey = outputHeader.addChild(new ld.TextInput());

  const outputsGroup = outputsTab.addChild(
    new ld.Group({ direction: 'vertical', noBorder: true })
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
    compositorDimmer,
    compositorCueTriggers,
    sequencesDesk,
    init,
  };
};
