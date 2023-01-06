import { getPixelMap } from '../lib/pixelmaps';

describe('Test Pixelmaps', () => {
  // Test hardcoded maps

  it('Razer Firefly', async () => {
    if (!(await getPixelMap('Razer Firefly')))
      throw new Error('unable to get map');
  });

  // Test that we're able to produce each pixelmap's data from the SVG

  it('Razer Ornata Chroma', async () => {
    if (!(await getPixelMap('Razer Ornata Chroma')))
      throw new Error('unable to get map');
  });
});
