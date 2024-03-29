type MPEGAudioVersion = '1' | '2' | '2.5';

const MPEGAudioVersionMapping: { [id: number]: MPEGAudioVersion } = {
  0: '2.5',
  2: '2',
  3: '1',
};

type MPEGLayer = '1' | '2' | '3';

const MPEGLayerMapping: { [id: number]: MPEGLayer } = {
  1: '3',
  2: '2',
  3: '1',
};

const MODES = ['stereo', 'joint_stereo', 'dual_channel', 'mono'] as const;

type Mode = typeof MODES[number];

/**
 * Sample rate index mapping in Hz, for each audio version
 * From: https://www.codeproject.com/Articles/8295/MPEG-Audio-Frame-Header#SamplingRate
 */
const SAMPLE_RATES = {
  '1': [44100, 48000, 32000],
  '2': [22050, 24000, 16000],
  '2.5': [11025, 12000, 8000],
};

const BITRATES_RAW = {
  'MPEG-1-Layer-1': [
    0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448,
  ],
  'MPEG-1-Layer-2': [
    0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384,
  ],
  'MPEG-1-Layer-3': [
    0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320,
  ],
  'MPEG-2-Layer-1': [
    0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256,
  ],
  'MPEG-2-Layer-O': [
    0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160,
  ],
};

/**
 * Version -> Layer -> [bitrate] (in kilobits per second, not kibibits)
 *
 * See: https://www.codeproject.com/Articles/8295/MPEG-Audio-Frame-Header#Bitrate
 */
const BITRATES = {
  '1': {
    '1': BITRATES_RAW['MPEG-1-Layer-1'],
    '2': BITRATES_RAW['MPEG-1-Layer-2'],
    '3': BITRATES_RAW['MPEG-1-Layer-3'],
  },
  '2': {
    '1': BITRATES_RAW['MPEG-2-Layer-1'],
    '2': BITRATES_RAW['MPEG-2-Layer-O'],
    '3': BITRATES_RAW['MPEG-2-Layer-O'],
  },
  '2.5': {
    '1': BITRATES_RAW['MPEG-2-Layer-1'],
    '2': BITRATES_RAW['MPEG-2-Layer-O'],
    '3': BITRATES_RAW['MPEG-2-Layer-O'],
  },
};

/**
 * Version -> Layer -> [bitrate]
 *
 * See: https://www.codeproject.com/Articles/8295/MPEG-Audio-Frame-Header
 */
const SAMPLES_PER_FRAME = {
  '1': {
    '1': 384,
    '2': 1152,
    '3': 1152,
  },
  '2': {
    '1': 384,
    '2': 1152,
    '3': 576,
  },
  '2.5': {
    '1': 384,
    '2': 1152,
    '3': 576,
  },
};

/**
 * Version -> mode -> bytes
 *
 * @see https://www.codeproject.com/Articles/8295/MPEG-Audio-Frame-Header#SideInfo
 */
const LAYER_3_SIDE_INFORMATION_BYTES = {
  '1': {
    dual: 32,
    mono: 17,
  },
  '2': {
    dual: 17,
    mono: 9,
  },
  '2.5': {
    dual: 17,
    mono: 9,
  },
};

export interface Metadata {
  version: MPEGAudioVersion;
  layer: MPEGLayer;
  bitrate: number;
  sampleRate: number;
  samplesPerFrame: number;
  mode: Mode;
  vbrInfo?: VBRMetadata;
  lameInfo?: LameMetadata;
}

export interface VBRMetadata {
  isCBR: boolean;
  numberOfFrames?: number;
}

export interface LameMetadata {
  encoder: string;
  /**
   * Number of samples that were added to the start (the encoder delay).
   * Range: `0`-`4096`
   */
  paddingStart: number;
  /**
   * Number of samples of padding at the end of the track.
   * Range: `0`-`4096`
   */
  paddingEnd: number;
}

function extractAsciiString(bytes: Uint8Array, index: number, length: number) {
  let str = '';
  for (let i = 0; i < length; i++) {
    const char = bytes[index + i];
    if (char > 31 && char < 127) str += String.fromCharCode(char);
  }
  return str;
}

/**
 * See information of frame layout here:
 * https://www.codeproject.com/Articles/8295/MPEG-Audio-Frame-Header
 */
function parseAudioFrameHeader(
  bytes: Uint8Array,
  offset: number
): Metadata | null {
  // Frame header consists of 4 bytes
  const frameHeader = [
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3],
  ];
  // Extract Information
  const frameSync = (frameHeader[0] << 3) | (frameHeader[1] >> 5);
  const audioVersion = (frameHeader[1] >> 3) & 0x3;
  const layerIndex = (frameHeader[1] >> 1) & 0x3;
  // const protection = (frameHeader[1]) & 0x1;

  const bitrateIndex = frameHeader[2] >> 4;
  const sampleRateIndex = (frameHeader[2] >> 2) & 0x3;
  // const padding = (frameHeader[2] >> 1) & 0x1;
  const mode = MODES[(frameHeader[3] >> 6) & 0x3];

  // Validate (check sync, and ignore for any reserved values)
  if (frameSync !== 0x7ff) return null;
  if (audioVersion === 0x1) return null;
  if (layerIndex === 0x0) return null;
  if (bitrateIndex === 0xf) return null;
  if (sampleRateIndex === 0x3) return null;

  // Convert Information
  const version = MPEGAudioVersionMapping[audioVersion];
  const layer = MPEGLayerMapping[layerIndex];
  const bitrate = BITRATES[version][layer][bitrateIndex];
  const sampleRate = SAMPLE_RATES[version][sampleRateIndex];
  const samplesPerFrame = SAMPLES_PER_FRAME[version][layer];

  const metadata: Metadata = {
    version,
    layer,
    bitrate,
    sampleRate,
    samplesPerFrame,
    mode,
  };

  // Calculate the start of the data for the frame
  let dataStart: null | number = null;

  // Extract VBR Information
  if (layer === '3') {
    const sideMode = mode === 'mono' ? mode : 'dual';
    const sideInformationBytes =
      LAYER_3_SIDE_INFORMATION_BYTES[version][sideMode];
    dataStart =
      // Header
      4 +
      // Side Information
      sideInformationBytes;
  } else {
    console.log('Unable to calculate start of data frame (TODO)');
  }

  if (dataStart !== null) {
    const vbrStart = offset + dataStart;
    const vbrHeaderID = extractAsciiString(bytes, vbrStart, 4);
    if (vbrHeaderID === 'Xing' || vbrHeaderID === 'Info') {
      // Valid VBR Header
      const hasFrames = (bytes[vbrStart + 7] & 0x1) === 0x1;
      const hasBytes = (bytes[vbrStart + 7] & 0x2) === 0x2;
      const hasTOC = (bytes[vbrStart + 7] & 0x4) === 0x4;
      const hasQuality = (bytes[vbrStart + 7] & 0x8) === 0x8;
      let numberOfFrames: number | undefined;
      const framesStart = vbrStart + 8;
      if (hasFrames) {
        numberOfFrames =
          (bytes[framesStart] << 24) +
          (bytes[framesStart + 1] << 16) +
          (bytes[framesStart + 2] << 8) +
          bytes[framesStart + 3];
      }
      metadata.vbrInfo = {
        isCBR: vbrHeaderID === 'Info',
        numberOfFrames,
      };
      const lameExtensionStart =
        // VBR Header
        vbrStart +
        8 +
        (hasFrames ? 4 : 0) +
        (hasBytes ? 4 : 0) +
        (hasTOC ? 100 : 0) +
        (hasQuality ? 4 : 0);
      // Attempt to extract LAME extension information
      // See: http://gabriel.mp3-tech.org/mp3infotag.html#versionstring
      const encoder = extractAsciiString(bytes, lameExtensionStart, 9);
      // Only continue extracting LAME info if we think a valid encoder has
      // been specified.
      if (encoder.length === 9) {
        // Encoder Delays
        const paddingStart =
          (bytes[lameExtensionStart + 21] << 4) |
          (bytes[lameExtensionStart + 22] >> 4);
        const paddingEnd =
          ((bytes[lameExtensionStart + 22] & 0xf) << 8) |
          bytes[lameExtensionStart + 23];
        metadata.lameInfo = {
          encoder,
          paddingStart,
          paddingEnd,
        };
      }
    }
  }

  return metadata;
}

/**
 * @return the size of the ID3v2 tag located the given offset in bytes,
 * or `0` if no tag is present at the given offset.
 */
function extractTagSize(bytes: Uint8Array, offset: number) {
  if (extractAsciiString(bytes, offset, 3) === 'ID3') {
    const flags = bytes[offset + 5];
    const hasFooter = (flags & 0x10) === 0x10;
    const size =
      // 32-bit Syncsafe integer (https://en.wikipedia.org/wiki/Synchsafe)
      (bytes[offset + 6] << 21) |
      (bytes[offset + 7] << 14) |
      (bytes[offset + 8] << 7) |
      bytes[offset + 9];
    return 10 + size + (hasFooter ? 10 : 0);
  }
  return 0;
}

export function getMetadata(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let offset = 0;
  let tagSize = 0;
  while ((tagSize = extractTagSize(bytes, offset)) !== 0) offset += tagSize;
  console.log('offset:', offset);
  return parseAudioFrameHeader(bytes, offset);
}

export default getMetadata;
