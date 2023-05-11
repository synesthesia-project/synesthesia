import * as ld from '@synesthesia-project/light-desk';

export const createDesk = () => {
  const desk = new ld.LightDesk();
  const deskRoot = new ld.Group({ noBorder: true, direction: 'vertical' });
  desk.setRoot(deskRoot);

  const header = new ld.Group({ noBorder: true });
  deskRoot.addChild(header);

  header.addChild(new ld.Label(`Output Name:`));

  const addOutputKey = new ld.TextInput('');
  header.addChild(addOutputKey);

  const addButton = new ld.Button('Add Output');
  header.addChild(addButton);

  // List of outputs
  const outputsGroup = new ld.Group({ direction: 'vertical' });
  deskRoot.addChild(outputsGroup);

  const inputGroup = new ld.Group({ direction: 'vertical', noBorder: true });
  deskRoot.addChild(inputGroup);

  const init = (listeners: { addOutput: (key: string) => Promise<void> }) => {
    addButton.addListener(async () =>
      listeners.addOutput(addOutputKey.getValue())
    );
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
