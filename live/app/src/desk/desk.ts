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

  const compositorCueTriggers = deskTab.addChild(
    new ld.Group({ direction: 'vertical' })
  );

  // Compositor

  const compositorTab = tabs.addTab(
    'Compositor',
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  const compositorHeader = compositorTab.addChild(
    new ld.Group({ noBorder: true })
  );

  const addCompositorCueButton = compositorHeader.addChild(
    new ld.Button(`Add Cue`, 'add')
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

  outputHeader.addChild(new ld.Label(`Output Name:`));

  const addOutputKey = outputHeader.addChild(new ld.TextInput(''));

  const outputsGroup = outputsTab.addChild(
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  const init = (options: {
    addCompositorCue: () => Promise<void>;
    addOutput: (kind: OutputKind<unknown>, name: string) => Promise<void>;
    outputKinds: Array<OutputKind<unknown>>;
  }) => {
    for (const kind of options.outputKinds) {
      const addButton = new ld.Button(`Add ${kind.kind} output`);
      outputHeader.addChild(addButton);
      addButton.addListener(async () =>
        options.addOutput(kind, addOutputKey.getValue())
      );
    }
    addCompositorCueButton.addListener(options.addCompositorCue);
  };

  return {
    desk,
    outputsGroup,
    sequencesGroup,
    compositorCuesGroup,
    compositorCueTriggers,
    init,
  };
};
