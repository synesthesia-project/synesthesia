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

const TestComponent = ({ foo }: { foo: string }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [count]);

  return <Group title={`asd: ${count}`}>{`${foo}: ${count}`}</Group>;
};

const App = () => (
  <Group title="foo">
    <TestComponent foo="a" />
    <Group defaultCollapsibleState="closed">
      <TestComponent foo="b" />
    </Group>
  </Group>
);

LightDeskRenderer.render(<App />, group);
