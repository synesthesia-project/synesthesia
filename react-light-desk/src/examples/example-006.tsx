import * as React from 'react';
import * as ld from '@synesthesia-project/light-desk';

import { LightDeskRenderer, Button, Switch } from '../index';

const desk = new ld.LightDesk();

desk.start({
  mode: 'automatic',
  port: 1338,
});

const group = new ld.Group({ direction: 'vertical' });
desk.setRoot(group);

const callback = (val: ld.Button) => console.log('callback', !!val);

/**
 * Test app that explicitly reorders existing elements
 */
const App = () => {
  const [show, setShow] = React.useState<'on' | 'off'>('off');
  const [refSelect, setRefSelect] = React.useState<'a' | 'b'>('a');
  const refA = React.useRef<ld.Button>(null);
  const refB = React.useRef<ld.Button>(null);

  console.log('render refs', !!refA.current, !!refB.current);

  React.useEffect(() => {
    setInterval(() => {
      console.log('interval refs', !!refA.current, !!refB.current);
    }, 1000);
  }, []);

  return (
    <>
      <Switch state={show} onChange={(value) => setShow(value)} />
      <Button onClick={() => setRefSelect('a')} text={'select a'} />
      <Button onClick={() => setRefSelect('b')} text={'select b'} />
      {`Selected Ref: ${refSelect}`}
      {show === 'on' && (
        <Button ref={refSelect === 'a' ? refA : refB} text={'eeeek'} />
      )}
      {show === 'on' && <Button ref={callback} text={'eeeek'} />}
    </>
  );
};

LightDeskRenderer.render(<App />, group);
