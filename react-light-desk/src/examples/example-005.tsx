import * as React from 'react';
import * as ld from '@synesthesia-project/light-desk';

import { LightDeskRenderer, Button, Tabs, Tab } from '../index';

const desk = new ld.LightDesk();

desk.start({
  mode: 'automatic',
  port: 1338,
});

const group = new ld.Group({ direction: 'vertical' });
desk.setRoot(group);

/**
 * Test app that explicitly reorders existing elements
 */
const App = () => {
  const [labels, setLabels] = React.useState(['foo', 'bar', 'baz']);

  return (
    <Tabs>
      {labels.map((label) => (
        <Tab name={label} key={label}>
          <Button
            text={'move to start'}
            onClick={() =>
              setLabels([label, ...labels.filter((l) => l !== label)])
            }
          />
        </Tab>
      ))}
    </Tabs>
  );
};

LightDeskRenderer.render(<App />, group);
