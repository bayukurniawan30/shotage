import { describe, expect, it } from 'vitest';
import { convertAvcAnnexB } from '../avcAnnexB';

describe('convertAvcAnnexB', () => {
  it('builds an AVC decoder description and length-prefixed sample', () => {
    const encoded = new Uint8Array([
      0, 0, 0, 1, 0x67, 0x42, 0, 0x1f, 0xaa,
      0, 0, 1, 0x68, 0xce, 0x06,
      0, 0, 0, 1, 0x65, 0x88, 0x99,
    ]);
    const result = convertAvcAnnexB(encoded);
    expect(Array.from(result.decoderDescription ?? [])).toEqual([
      1, 0x42, 0, 0x1f, 0xff, 0xe1, 0, 5, 0x67, 0x42, 0, 0x1f, 0xaa,
      1, 0, 3, 0x68, 0xce, 0x06,
    ]);
    expect(Array.from(result.sample)).toEqual([
      0, 0, 0, 5, 0x67, 0x42, 0, 0x1f, 0xaa,
      0, 0, 0, 3, 0x68, 0xce, 0x06,
      0, 0, 0, 3, 0x65, 0x88, 0x99,
    ]);
  });

  it('leaves decoder configuration unset for later delta chunks', () => {
    const result = convertAvcAnnexB(new Uint8Array([0, 0, 1, 0x41, 0x9a]));
    expect(result.decoderDescription).toBeNull();
    expect(Array.from(result.sample)).toEqual([0, 0, 0, 2, 0x41, 0x9a]);
  });

  it('includes the required avcC extension for a High profile stream', () => {
    const result = convertAvcAnnexB(new Uint8Array([
      0, 0, 0, 1, 0x67, 100, 0, 0x2a, 0xaa,
      0, 0, 0, 1, 0x68, 0xce,
      0, 0, 0, 1, 0x65, 0x88,
    ]));
    expect(Array.from(result.decoderDescription?.slice(-4) ?? [])).toEqual([
      0xfd, 0xf8, 0xf8, 0,
    ]);
  });

  it('rejects data that is not Annex B', () => {
    expect(() => convertAvcAnnexB(new Uint8Array([0, 0, 0, 2, 0x65, 0xff]))).toThrow(
      'did not produce an Annex B'
    );
  });
});
