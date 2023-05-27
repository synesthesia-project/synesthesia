import * as ld from '@synesthesia-project/light-desk';
import type { OutputKind } from '@synesthesia-project/live-core/lib/plugins';

export const createDesk = () => {
  const desk = new ld.LightDesk();

  const deskRoot = new ld.Group({ noBorder: true, direction: 'vertical' });
  desk.setRoot(deskRoot);

  const tabs = deskRoot.addChild(new ld.Tabs());

  // Compositor

  const compositorTab = tabs.addTab(
    'Compositor',
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  // Outputs

  const outputsTab = tabs.addTab(
    'Outputs',
    new ld.Group({ direction: 'vertical', noBorder: true })
  );

  const header = outputsTab.addChild(new ld.Group({ noBorder: true }));

  header.addChild(new ld.Label(`Output Name:`));

  const addOutputKey = header.addChild(new ld.TextInput(''));

  const outputsGroup = outputsTab.addChild(
    new ld.Group({ direction: 'vertical' })
  );

  const init = (options: {
    addOutput: (kind: OutputKind<unknown>, key: string) => Promise<void>;
    outputKinds: Array<OutputKind<unknown>>;
  }) => {
    for (const kind of options.outputKinds) {
      const addButton = new ld.Button(`Add ${kind.kind} output`);
      header.addChild(addButton);
      addButton.addListener(async () =>
        options.addOutput(kind, addOutputKey.getValue())
      );
    }
  };

  const setInput = (component: ld.Component) => {
    compositorTab.removeAllChildren();
    compositorTab.addChild(component);
  };

  return {
    desk,
    outputsGroup,
    setInput,
    init,
  };
};
