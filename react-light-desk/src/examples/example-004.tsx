import * as React from 'react';
import * as ld from '@synesthesia-project/light-desk';

import {
  LightDeskRenderer,
  Label,
  Switch,
  Tab,
  Tabs,
  Group,
  Rect,
  Button,
  TextInput,
} from '../index';
import { RGBA_PURPLE } from '@synesthesia-project/compositor/lib/color';
import { RGBAColor } from '@synesthesia-project/compositor';

const desk = new ld.LightDesk();

desk.start({
  mode: 'automatic',
  port: 1338,
});

const group = new ld.Group({ direction: 'vertical' });
desk.setRoot(group);

const App = () => {
  const [switchState, setSwitchState] = React.useState<'off' | 'on'>('off');
  const [color, setColor] = React.useState(RGBA_PURPLE);
  const [textValue, setTextValue] = React.useState('initial text');

  return (
    <Tabs>
      <Tab name="FooBar">
        <Group noBorder={true}>
          {`Switch State: ${switchState}`}
          <Switch
            state={switchState}
            onChange={(value) => setSwitchState(value)}
          />
          <Switch
            state={switchState === 'on' ? 'off' : 'on'}
            onChange={(value) => setSwitchState(value === 'on' ? 'off' : 'on')}
          />
        </Group>
      </Tab>
      <Tab name="Colors">
        <Group noBorder={true}>
          <Rect color={color} />
          <Button
            text="red"
            onClick={() => setColor(new RGBAColor(255, 0, 0, 1))}
          />
          <Button
            text="blue"
            onClick={() => setColor(new RGBAColor(0, 0, 255, 1))}
          />
        </Group>
      </Tab>
      <Tab name="Another">
        <Group noBorder={true}>
          <Label text={textValue} />
          <TextInput value={textValue} onChange={setTextValue} />
        </Group>
      </Tab>
    </Tabs>
  );
};

LightDeskRenderer.render(<App />, group);
