import * as React from 'react';
import * as ld from '@synesthesia-project/light-desk';

import { LightDeskRenderer, Group } from '../index';

const desk = new ld.LightDesk();

desk.start({
  mode: 'automatic',
  port: 1338,
});

const group = new ld.Group();
desk.setRoot(group);

const App = () => {
  const [title, setTitle] = React.useState('initial-group');

  return (
    <Group title={title} editableTitle={true} onTitleChanged={setTitle}>
      {`Label: ${title}`}
    </Group>
  );
};

LightDeskRenderer.render(<App />, group);
