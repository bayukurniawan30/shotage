/** Convert an H.264 Annex B access unit to MP4's length-prefixed AVC format. */
export function convertAvcAnnexB(data: Uint8Array): {
  sample: Uint8Array;
  decoderDescription: Uint8Array | null;
} {
  const units: Uint8Array[] = [];
  let start = -1;

  for (let index = 0; index + 3 <= data.length; index++) {
    if (data[index] !== 0 || data[index + 1] !== 0) continue;
    const prefixLength = data[index + 2] === 1 ? 3 : data[index + 2] === 0 && data[index + 3] === 1 ? 4 : 0;
    if (!prefixLength) continue;
    if (start >= 0 && index > start) units.push(data.subarray(start, index));
    start = index + prefixLength;
    index += prefixLength - 1;
  }
  if (start >= 0 && start < data.length) units.push(data.subarray(start));
  if (units.length === 0) {
    throw new Error('The H.264 encoder did not produce an Annex B video chunk.');
  }

  const sps = units.find((unit) => (unit[0] & 0x1f) === 7);
  const pps = units.find((unit) => (unit[0] & 0x1f) === 8);
  let decoderDescription: Uint8Array | null = null;
  if (sps && pps) {
    if (sps.length < 4 || sps.length > 65535 || pps.length > 65535) {
      throw new Error('The H.264 encoder returned an invalid SPS/PPS header.');
    }
    // High profiles require the four chroma/bit-depth extension bytes in avcC.
    // WebCodecs' common hardware H.264 output is 8-bit 4:2:0.
    const hasHighProfileExtension = [100, 110, 122, 144].includes(sps[1]);
    decoderDescription = new Uint8Array(11 + sps.length + pps.length + (hasHighProfileExtension ? 4 : 0));
    decoderDescription.set([1, sps[1], sps[2], sps[3], 0xff, 0xe1], 0);
    decoderDescription[6] = sps.length >> 8;
    decoderDescription[7] = sps.length & 0xff;
    decoderDescription.set(sps, 8);
    const ppsOffset = 8 + sps.length;
    decoderDescription[ppsOffset] = 1;
    decoderDescription[ppsOffset + 1] = pps.length >> 8;
    decoderDescription[ppsOffset + 2] = pps.length & 0xff;
    decoderDescription.set(pps, ppsOffset + 3);
    if (hasHighProfileExtension) {
      decoderDescription.set([0xfd, 0xf8, 0xf8, 0], ppsOffset + 3 + pps.length);
    }
  }

  const sampleLength = units.reduce((total, unit) => total + 4 + unit.length, 0);
  const sample = new Uint8Array(sampleLength);
  const view = new DataView(sample.buffer);
  let position = 0;
  for (const unit of units) {
    view.setUint32(position, unit.length);
    position += 4;
    sample.set(unit, position);
    position += unit.length;
  }
  return { sample, decoderDescription };
}
