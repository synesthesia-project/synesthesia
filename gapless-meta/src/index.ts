
type MPEGAudioVersion = '1' | '2' | '2.5';

const MPEGAudioVersionMapping: {[id: number]: MPEGAudioVersion} = {
  0: '2.5',
  2: '2',
  3: '1'
};

type MPEGLayer = '1' | '2' | '3';

const MPEGLayerMapping: { [id: number]: MPEGLayer } = {
  1: '3',
  2: '2',
  3: '1'
};

const MODES = ['stereo', 'joint_stereo', 'dual_channel', 'mono'] as const;

/**
 * Sample rate index mapping in Hz, for each audio version
 * From: https://www.codeproject.com/Articles/8295/MPEG-Audio-Frame-Header#SamplingRate
 */
const SAMPLE_RATES = {
  '1':   [44100, 48000, 32000],
  '2':   [22050, 24000, 16000],
  '2.5': [11025, 12000,  8000]
}

const BITRATES_RAW = {
  'MPEG-1-Layer-1': [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  'MPEG-1-Layer-2': [0, 32, 48, 56,  64,  80,  96, 112, 128, 160, 192, 224, 256, 320, 384],
  'MPEG-1-Layer-3': [0, 32, 40, 48,  56,  64,  80,  96, 112, 128, 160, 192, 224, 256, 320],
  'MPEG-2-Layer-1': [0, 32, 48, 56,  64,  80,  96, 112, 128, 144, 160, 176, 192, 224, 256],
  'MPEG-2-Layer-O': [0,  8, 16, 24,  32,  40,  48,  56,  64,  80,  96, 112, 128, 144, 160],
}

/**
 * Version -> Layer -> [bitrate] (in kilobits per second, not kibibits)
 *
 * See: https://www.codeproject.com/Articles/8295/MPEG-Audio-Frame-Header#Bitrate
 */
const BITRATES = {
  '1': {
    '1': BITRATES_RAW['MPEG-1-Layer-1'],
    '2': BITRATES_RAW['MPEG-1-Layer-2'],
    '3': BITRATES_RAW['MPEG-1-Layer-3']
  },
  '2': {
    '1': BITRATES_RAW['MPEG-2-Layer-1'],
    '2': BITRATES_RAW['MPEG-2-Layer-O'],
    '3': BITRATES_RAW['MPEG-2-Layer-O']
  },
  '2.5': {
    '1': BITRATES_RAW['MPEG-2-Layer-1'],
    '2': BITRATES_RAW['MPEG-2-Layer-O'],
    '3': BITRATES_RAW['MPEG-2-Layer-O']
  }
}

/**
 * Version -> Layer -> [bitrate]
 *
 * See: https://www.codeproject.com/Articles/8295/MPEG-Audio-Frame-Header
 */
const SAMPLES_PER_FRAME = {
  '1': {
    '1': 384,
    '2': 1152,
    '3': 1152
  },
  '2': {
    '1': 384,
    '2': 1152,
    '3': 576
  },
  '2.5': {
    '1': 384,
    '2': 1152,
    '3': 576
  }
}

/**
 * Version -> mode -> bytes
 *
 * @see https://www.codeproject.com/Articles/8295/MPEG-Audio-Frame-Header#SideInfo
 */
const LAYER_3_SIDE_INFORMATION_BYTES = {
  '1': {
    'dual': 32,
    'mono': 17
  },
  '2': {
    'dual': 17,
    'mono': 9
  },
  '2.5': {
    'dual': 17,
    'mono': 9
  }
}

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
  const audioVersion = (frameHeader[1] >> 3) & 0x3;
  const layerIndex = (frameHeader[1] >> 1) & 0x3;
  const protection = (frameHeader[1]) & 0x1;

  const bitrateIndex = frameHeader[2] >> 4;
  const sampleRateIndex = (frameHeader[2] >> 2) & 0x3;
  const padding = (frameHeader[2] >> 1) & 0x1;
  const mode = MODES[(frameHeader[3] >> 6) & 0x3];

  // Validate (check sync, and ignore for any reserved values)
  if (frameSync !== 0x7ff) return;
  if (audioVersion === 0x1) return;
  if (layerIndex === 0x0) return;
  if (bitrateIndex === 0xf) return;
  if (sampleRateIndex === 0x3) return;

  // Convert Information
  const version = MPEGAudioVersionMapping[audioVersion];
  const layer = MPEGLayerMapping[layerIndex];
  const bitrate = BITRATES[version][layer][bitrateIndex];
  const sampleRate = SAMPLE_RATES[version][sampleRateIndex];
  const spf = SAMPLES_PER_FRAME[version][layer];

  console.log('isFrame', MPEGAudioVersionMapping[audioVersion]);
  console.log(`MPEG ${version} layer ${layer}`);
  console.log(`Bitrate:`, bitrate);
  console.log(`Sample Rate:`, sampleRate);
  console.log(`Samples per frame:`, spf);
  console.log(`padding:`, padding);
  console.log(`protection bit:`, protection);
  console.log(`mode:`, mode);

  // Calculate the start of the data for the frame
  let dataStart: null | number = null;

  // Extract VBR Information
  if (layer === '3') {
    const sideMode = mode === 'mono' ? mode : 'dual';
    const sideInformationBytes = LAYER_3_SIDE_INFORMATION_BYTES[version][sideMode];
    dataStart =
      // Header
      4 +
      // Side Information
      sideInformationBytes;
  } else {
    console.log('Unable to calculate start of data frame (TODO)');
  }

  if (dataStart !== null) {
    const vbrHeaderID = [
      bytes[offset + dataStart],
      bytes[offset + dataStart + 1],
      bytes[offset + dataStart + 2],
      bytes[offset + dataStart + 3]
    ].map(c => String.fromCharCode(c)).join('');
    if (vbrHeaderID === 'Xing' || vbrHeaderID === 'Info') {
      // Valid VBR Header
      console.log('Valid VBR Header');
    }
  }
}


export function getMetadata(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  parseAudioFrameHeader(bytes, 0);
  return 'todo';
}
