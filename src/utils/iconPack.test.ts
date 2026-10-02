import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  crc32,
  createIco,
  createZip,
  generateIconPack,
  resampleIconPixels,
  type IconPackOptions,
} from './iconPack';

function readZip(bytes: Uint8Array) {
  const files = new Map<string, Uint8Array>();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const name = new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + nameLength));
    const start = offset + 30 + nameLength;
    const data = bytes.slice(start, start + size);
    expect(crc32(data)).toBe(view.getUint32(offset + 14, true));
    files.set(name, data);
    offset = start + size;
  }
  expect(view.getUint32(offset, true)).toBe(0x02014b50);
  const end = bytes.length - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  expect(view.getUint16(end + 10, true)).toBe(files.size);
  expect(view.getUint32(end + 16, true)).toBe(offset);
  return files;
}

afterEach(() => vi.unstubAllGlobals());

describe('icon pack binary formats', () => {
  it('retains thin strokes by averaging all contributing pixels', () => {
    // A one-pixel black stroke on an opaque white 4px row must contribute
    // to the result even when it falls between the final pixel centers.
    const row = new Uint8ClampedArray([
      0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    ]);
    expect([...resampleIconPixels(row, 4, 1, 1, 1)]).toEqual([191, 191, 191, 255]);
  });
  it('handles fractional sample coverage and avoids transparent color halos', () => {
    const row = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 0, 0, 0, 255, 255]);
    expect([...resampleIconPixels(row, 3, 1, 2, 1)]).toEqual([255, 0, 0, 170, 0, 0, 255, 170]);
  });
  it('uses standard CRC32 and valid ZIP entry/directory offsets', async () => {
    const data = new TextEncoder().encode('123456789');
    expect(crc32(data)).toBe(0xcbf43926);
    const zip = createZip([{ name: 'web/test.txt', data }]);
    const files = readZip(new Uint8Array(await zip.arrayBuffer()));
    expect(files.get('web/test.txt')).toEqual(data);
  });

  it('writes a multi-size ICO directory with PNG payloads', () => {
    const data = new Uint8Array([137, 80, 78, 71]);
    const ico = createIco([
      { size: 16, data },
      { size: 256, data },
    ]);
    const view = new DataView(ico.buffer);
    expect(view.getUint16(2, true)).toBe(1);
    expect(view.getUint16(4, true)).toBe(2);
    expect(ico[6]).toBe(16);
    expect(ico[22]).toBe(0);
    expect(view.getUint32(18, true)).toBe(38);
    expect(view.getUint32(34, true)).toBe(42);
  });
});

describe('platform contents', () => {
  const master = { width: 1024, height: 1024 } as HTMLCanvasElement;
  const options: IconPackOptions = {
    platforms: ['web', 'android', 'ios', 'windows'],
    name: 'Test & App',
    shortName: 'Test',
    startUrl: '/studio',
    background: '#ffffff',
    theme: '#111111',
    padding: 0,
    legacyTiles: true,
  };
  function mockCanvas() {
    const draws: unknown[][] = [];
    vi.stubGlobal('document', {
      createElement: () => {
        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({
            fillRect: vi.fn(),
            drawImage: (...args: unknown[]) => draws.push(args),
            getImageData: () => ({ data: new Uint8ClampedArray(canvas.width * canvas.height * 4) }),
            createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
            putImageData: vi.fn(),
          }),
          toBlob: (callback: (blob: Blob) => void) =>
            callback(new Blob([new Uint8Array([137, 80, 78, 71])])),
        };
        return canvas;
      },
    });
    return draws;
  }
  it('includes every promised platform asset and valid relative manifest references', async () => {
    const draws = mockCanvas();
    const zip = await generateIconPack(master, options);
    const files = readZip(new Uint8Array(await zip.arrayBuffer()));
    expect(files.size).toBe(39);
    const decode = (name: string) => new TextDecoder().decode(files.get(name));
    const manifest = JSON.parse(decode('web/manifest.json'));
    expect(manifest.start_url).toBe('/studio');
    expect(manifest.icons).toHaveLength(4);
    for (const icon of manifest.icons) expect(files.has(`web/${icon.src}`)).toBe(true);
    const catalog = JSON.parse(decode('ios/AppIcon.appiconset/Contents.json'));
    expect(catalog.images).toHaveLength(18);
    for (const image of catalog.images)
      expect(files.has(`ios/AppIcon.appiconset/${image.filename}`)).toBe(true);
    expect(files.has('windows/browserconfig.xml')).toBe(true);
    expect(files.has('android/android-icon-192x192.png')).toBe(true);
    expect(draws.some((draw) => Math.abs(Number(draw[1]) - 1024 * 0.22) < 0.001)).toBe(true);
  });
  it('omits unselected platforms and rejects invalid settings', async () => {
    mockCanvas();
    const zip = await generateIconPack(master, {
      ...options,
      platforms: ['windows'],
      legacyTiles: false,
    });
    expect([...readZip(new Uint8Array(await zip.arrayBuffer())).keys()]).toEqual([
      'app-icon-1024x1024.png',
      'windows/windows-icon.ico',
      'README.txt',
    ]);
    await expect(
      generateIconPack({} as HTMLCanvasElement, { ...options, platforms: [] })
    ).rejects.toThrow('Select');
    await expect(
      generateIconPack({} as HTMLCanvasElement, { ...options, startUrl: '//evil.test' })
    ).rejects.toThrow('Start URL');
  });
});
