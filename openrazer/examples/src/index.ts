import * as openrazer from 'openrazer';

const wait = (millis: number) =>
  new Promise((resolve) => setTimeout(resolve, millis));

(async () => {
  const kbds = await openrazer.getKeyboards();

  if (kbds.length === 0) return;
  const kbd = kbds[0];

  let b = 255;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    kbd.setMatrixBrightness(b);
    await wait(20);
    b -= 10;
    if (b < 0) b = 255;
  }
})();
