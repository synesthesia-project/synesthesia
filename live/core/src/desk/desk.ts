import * as ld from '@synesthesia-project/light-desk';
import { OutputKind } from '../plugins';

export const createDesk = () => {
  const desk = new ld.LightDesk();
  const deskRoot = new ld.Group({ noBorder: true, direction: 'vertical' });
  desk.setRoot(deskRoot);

  const header = new ld.Group({ noBorder: true });
  deskRoot.addChild(header);

  header.addChild(new ld.Label(`Output Name:`));

  const addOutputKey = new ld.TextInput('');
  header.addChild(addOutputKey);

  // List of outputs
  const outputsGroup = new ld.Group({ direction: 'vertical' });
  deskRoot.addChild(outputsGroup);

  const inputGroup = new ld.Group({ direction: 'vertical', noBorder: true });
  deskRoot.addChild(inputGroup);

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
    inputGroup.removeAllChildren();
    inputGroup.addChild(component);
  };

  return {
    desk,
    outputsGroup,
    setInput,
    init,
  };
};
