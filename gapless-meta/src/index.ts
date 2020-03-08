
enum AudioVersion {
  'MPEG Version 2.5' = 0,
  'MPEG Version 2' = 2,
  'MPEG Version 1' = 3
};

/**
 * See information of frame layout here:
 * https://www.codeproject.com/Articles/8295/MPEG-Audio-Frame-Header
 */
function parseAudioFrameHeader(bytes: Uint8Array, offset: number) {
  // Frame header consists of 4 bytes
  const frameHeader = [
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3]
  ];
  // Extract Information
  const frameSync = (frameHeader[0] << 3) | (frameHeader[1] >> 5);
  const audioVersion: AudioVersion = (frameHeader[1] >> 3) & 0x3;
  const layerIndex = (frameHeader[1] >> 1) & 0x3;

  const bitrateIndex = frameHeader[2] >> 4;
  const sampleRateIndex = (frameHeader[2] >> 2) & 0x3;
  const padding = (frameHeader[2] >> 1) & 0x1;

  // Validate (check sync, and ignore for any reserved values)
  if (frameSync !== 0x7ff) return;
  if (audioVersion === 0x1) return;
  if (layerIndex === 0x0) return;
  if (bitrateIndex === 0xf) return;
  if (sampleRateIndex === 0x3) return;

  console.log('isFrame', AudioVersion[audioVersion]);
  console.log(`padding:`, padding);
}


export function getMetadata(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  parseAudioFrameHeader(bytes, 0);
  return 'todo';
}
