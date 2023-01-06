import * as openrazer from 'openrazer';

const wait = (millis: number) =>
  new Promise((resolve) => setTimeout(resolve, millis));

(async () => {
  const devices = await openrazer.getMousemats();

  console.log(devices);

  if (devices.length === 0) return;
  const device = devices[0];

  console.log('serial:', await device.getSerialNumber());
  console.log('firmware:', await device.getFirmwareVersion());

  console.log('Setting to spectrum');
  device.writeCustomFrame(0, [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
  ]);

  await wait(5000);

  console.log('Setting to spectrum');
  device.setMatrixEffectSpectrum();

  await wait(5000);

  console.log('Setting to white');
  device.setMatrixEffectStatic([255, 255, 255]);

  await wait(5000);

  console.log('Setting to wave');
  device.setMatrixEffectWave('left');

  await wait(5000);

  console.log('Setting to wave right');
  device.setMatrixEffectWave('right');

  await wait(5000);

  console.log('dimming');
  device.setMatrixBrightness(100);

  await wait(5000);

  console.log('brightening');
  device.setMatrixBrightness(255);
})();
