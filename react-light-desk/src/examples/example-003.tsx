import * as React from 'react';
import * as ld from '@synesthesia-project/light-desk';

import {
  LightDeskRenderer,
  Button,
  Group,
  GroupHeader,
  SliderButton,
} from '../index';

const desk = new ld.LightDesk();

desk.start({
  mode: 'automatic',
  port: 1338,
});

const group = new ld.Group();
desk.setRoot(group);

const App = () => {
  const [count, setCount] = React.useState(2);
  const [val, setVal] = React.useState(0);

  const buttons: JSX.Element[] = [];

  for (let i = 0; i < count; i++) {
    buttons.push(
      <SliderButton value={val} mode="writeThrough" onChange={setVal} />
    );
  }

  return (
    <Group>
      <GroupHeader>
        <Button key="add" text="add" onClick={() => setCount(count + 1)} />
        <Button
          key="remove"
          text="remove"
          onClick={() => setCount(Math.max(0, count - 1))}
        />
        <Button text="max" onClick={() => setVal(255)} />
        <Button text="min" onClick={() => setVal(0)} />
      </GroupHeader>
      <>{buttons}</>
    </Group>
  );
};

LightDeskRenderer.render(<App />, group);
